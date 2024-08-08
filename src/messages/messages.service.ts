import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';


@Injectable()
export class MessagesService {
    constructor(private databaseService: DatabaseService) { }

    async create(createMessageDto: Prisma.MessageCreateInput) {
        try {
            const newmessage = await this.databaseService.message.create({ data: createMessageDto })
            return newmessage
        } catch (error) {
            throw new BadRequestException("Failed to create the message " + error)
        }
    }

    async update(id: string, updateMessageDto: Prisma.MessageUpdateInput) {
        try {
            const updatedMessage = await this.databaseService.message.update({ data: updateMessageDto, where: { id } })
            return updatedMessage
        } catch (error) {
            throw new BadRequestException("Failed to update message " + error)
        }
    }

    async delete(id: string) {
        try {
            const messageTrash = await this.databaseService.message.delete({ where: { id } })
            return messageTrash
        } catch (error) {
            throw new BadRequestException("Failed to delete message " + error)
        }
    }

    async findUserMessages(userId: string, roomId: string) {
        try {
            const messages = await this.databaseService.message.findMany({
                where: {
                    messageMembership: {
                        some: {
                            receiverId: userId,
                            roomId: roomId
                        },

                    }
                }
            })
            return messages
        } catch (error) {
            throw new BadRequestException("Failed to retrieve user messages " + error)
        }
    }
    async sendMessage(roomId: string, senderId: string, message: string, receiverId?: string) {
        try {
            const newmessage = await this.create({ message })
            const sendMessage = await this.databaseService.messageMemberShip.create({
                data: {
                    senderId,
                    receiverId,
                    messageId: newmessage.id,
                    roomId
                }
            })

            return sendMessage
        } catch (error) {
            throw new BadRequestException("FAILED TO SEND MESSAGE " + error)
        }
    }

    async updateMessage(messageId: string, userId: string, message: string) {
        try {
            const messageMemberShip = await this.databaseService.messageMemberShip.findUnique({
                where: {
                    messageId
                }
            })
            if (messageMemberShip.senderId === userId) {
                return await this.update(messageId, { message });
            }

        } catch (error) {
            throw new BadRequestException("FAILED TO UPDATE MESSAGE " + error)
        }
    }

    async deleteMessage(messageId: string, userId: string) {
        try {
            const messageMemberShip = await this.databaseService.messageMemberShip.findUnique({
                where: {
                    messageId
                }
            })
            if (messageMemberShip.senderId === userId) {
                return await this.delete(messageId);
            }
        } catch (error) {
            throw new BadRequestException("FAILED TO DELETE MESSAGE "+error)
        }
    }

}
