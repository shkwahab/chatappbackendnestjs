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

    async findUserMessages(userId: string, roomId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        try {
          const totalCount = await this.databaseService.message.count({
            where: {
              messageMembership: {
                some: {
                  receiverId: userId,
                  roomId: roomId,
                },
              },
            },
          });
    
          const messages = await this.databaseService.message.findMany({
            where: {
              messageMembership: {
                some: {
                  receiverId: userId,
                  roomId: roomId,
                },
              },
            },
            skip,
            take: limit,
            orderBy: {
              createdAt: 'desc', 
            },
          });
    
          const response = {
            count: totalCount,
            next: page * limit < totalCount ? `/messages/${userId}/rooms/${roomId}?page=${page + 1}&limit=${limit}` : null,
            previous: page > 1 ? `/messages/${userId}/rooms/${roomId}?page=${page - 1}&limit=${limit}` : null,
            result: messages,
          };
    
          return response;
        } catch (error) {
          throw new BadRequestException('Failed to retrieve user messages: ' + error.message);
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
            await this.databaseService.messageStatus.create({
                data: {
                    messageId: sendMessage.id,
                    userId: senderId,
                    roomId
                }
            })
            const sender = await this.databaseService.user.findUnique({ where: { id: senderId } })
            if (receiverId) {
                const notification = await this.databaseService.notifications.create({
                    data: {
                        event: "sendMessage",
                        senderId: senderId,
                        message: `${sender.name} has sent you the message`,
                        type: "Message"
                    }
                })

                await this.databaseService.notificationReceivers.create({
                    data: {
                        receiverId,
                        notificationId: notification.id
                    }
                })
            }
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
            throw new BadRequestException("FAILED TO DELETE MESSAGE " + error)
        }
    }
    async readMessage(messageId: string, userId: string, roomId: string) {
        try {
            const read = await this.databaseService.messageStatus.update({
                data: {
                    messageId,
                    userId,
                    roomId,
                    isRead: true
                },
                where: {
                    messageId
                }
            })
            return read
        } catch (error) {
            throw new BadRequestException("FAILED TO READ MESSAGE" + error)
        }
    }
    async readMessages(read: { messageId: string, userId: string, roomId: string }[]) {
        try {
            const readPromises = read.map(item =>
                this.readMessage(item.messageId, item.userId, item.roomId)
            );
            await Promise.all(readPromises);
        } catch (error) {
            throw new BadRequestException("Failed to read messages" + error)
        }
    }

    async unReadMessageCount(roomId: string, userId: string) {
        try {
            const unRead = await this.databaseService.messageStatus.count({
                where: {
                    isRead: false,
                    userId,
                    roomId
                }
            })
            return unRead
        } catch (error) {
            throw new BadRequestException(error)
        }
    }
}

