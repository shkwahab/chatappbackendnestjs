import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { DeleteMessageDto, ReadMessageDto, SendMessageDto, UnReadMessageDto, UpdateMessageDto } from './dto/messageDto';
import { NotificationService } from 'src/notification/notification.service';


@Injectable()
export class MessagesService {
    constructor(
        private databaseService: DatabaseService,
        private readonly notifierService: NotificationService

    ) { }

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

    async findUserMessages(roomId: string, page: number = 1, limit: number) {
        const skip = (page - 1) * Number(limit);
        try {
            const totalCount = await this.databaseService.message.count({
                where: {
                    messageMembership: {
                        some: {
                            roomId,
                        },
                    },
                },
            });
    
            const messages = await this.databaseService.message.findMany({
                where: {
                    messageMembership: {
                        some: {
                            roomId
                        },
                    },
                },
                skip,
                take: Number(limit),
                orderBy: {
                    createdAt: 'desc',
                },
            });
    
            const messageMembersShip = async (messageId: string) => {
                const memberShip = await this.databaseService.messageMemberShip.findUnique({
                    where: {
                        messageId
                    }
                });
    
                if (!memberShip) {
                    return { sender: null, receiver: null };
                }
    
                const senderUser = memberShip.senderId
                    ? await this.databaseService.user.findUnique({
                        where: {
                            id: memberShip.senderId
                        }
                    })
                    : null;
    
                const receiverUser = memberShip.receiverId
                    ? await this.databaseService.user.findUnique({
                        where: {
                            id: memberShip.receiverId
                        }
                    })
                    : null;
    
                // Return user data without password if user exists
                const { password: senderPassword, ...sender } = senderUser || {};
                const { password: receiverPassword, ...receiver } = receiverUser || {};
    
                return { sender, receiver };
            };
    
            const results = await Promise.all(messages.map(async (item) => {
                const memberShip = await messageMembersShip(item.id);
    
                return {
                    ...item,
                    sender: memberShip.sender,
                    receiver: memberShip.receiver
                };
            }));
    
            const response = {
                count: totalCount,
                next: page * Number(limit) < totalCount ? `/messages/rooms/${roomId}?page=${page + 1}&limit=${Number(limit)}` : null,
                previous: page > 1 ? `/messages/rooms/${roomId}?page=${page - 1}&limit=${Number(limit)}` : null,
                results,
            };
    
            return response;
        } catch (error) {
            throw new BadRequestException('Failed to retrieve user messages: ' + error.message);
        }
    }
    

    async sendMessage(sendMessageDto: SendMessageDto) {
        try {
            const newmessage = await this.create({ message: sendMessageDto.message })
            const sendMessage = await this.databaseService.messageMemberShip.create({
                data: {
                    senderId: sendMessageDto.senderId,
                    messageId: newmessage.id,
                    receiverId:sendMessageDto.receiverId,
                    roomId: sendMessageDto.roomId
                }
            })
            await this.databaseService.messageStatus.create({
                data: {
                    messageId: sendMessage.id,
                    userId: sendMessageDto.senderId,
                    roomId: sendMessageDto.roomId
                }
            })
            const sender = await this.databaseService.user.findUnique({ where: { id: sendMessageDto.senderId } })
            if (sendMessageDto.receiverId) {
                const notification = await this.databaseService.notifications.create({
                    data: {
                        event: "sendMessage",
                        senderId: sendMessageDto.senderId,
                        message: `${sender.name} has sent you the message`,
                        type: "Message"
                    }
                })

                await this.databaseService.notificationReceivers.create({
                    data: {
                        receiverId: sendMessageDto.receiverId,
                        notificationId: notification.id
                    }
                })
                const notifierUrl = process.env.SITE_URL
                await this.notifierService.sendPushNotification(notification.id, notifierUrl)
            }
            return sendMessage
        } catch (error) {
            throw new BadRequestException("FAILED TO SEND MESSAGE " + error)
        }
    }

    async updateMessage(updateMessageDto: UpdateMessageDto) {
        try {
            const messageMemberShip = await this.databaseService.messageMemberShip.findUnique({
                where: {
                    messageId: updateMessageDto.messageId
                }
            })
            if (messageMemberShip.senderId === updateMessageDto.userId) {
                return await this.update(updateMessageDto.messageId, { message: updateMessageDto.message });
            }

        } catch (error) {
            throw new BadRequestException("FAILED TO UPDATE MESSAGE " + error)
        }
    }

    async deleteMessage(deleteMessageDto: DeleteMessageDto) {
        try {
            const messageMemberShip = await this.databaseService.messageMemberShip.findUnique({
                where: {
                    messageId: deleteMessageDto.messageId
                }
            })
            if (messageMemberShip.senderId === deleteMessageDto.userId) {
                return await this.delete(deleteMessageDto.messageId);
            }
        } catch (error) {
            throw new BadRequestException("FAILED TO DELETE MESSAGE " + error)
        }
    }

    async readMessage(readMessageDto: ReadMessageDto) {
        try {
            const read = await this.databaseService.messageStatus.update({
                data: {
                    messageId: readMessageDto.messageId,
                    userId: readMessageDto.userId,
                    roomId: readMessageDto.roomId,
                    isRead: true
                },
                where: {
                    messageId: readMessageDto.messageId
                }
            })
            return read
        } catch (error) {
            throw new BadRequestException("FAILED TO READ MESSAGE" + error)
        }
    }
    async readMessages(read: ReadMessageDto[]) {
        try {
            const readPromises = read.map(item =>
                this.readMessage({
                    userId: item.userId,
                    roomId: item.roomId,
                    messageId: item.messageId
                })
            );
            await Promise.all(readPromises);
        } catch (error) {
            throw new BadRequestException("Failed to read messages" + error)
        }
    }

    async unReadMessageCount(unReadMessageDto: UnReadMessageDto) {
        try {
            const unRead = await this.databaseService.messageStatus.count({
                where: {
                    isRead: false,
                    userId: unReadMessageDto.userId,
                    roomId: unReadMessageDto.roomId
                }
            })
            return unRead
        } catch (error) {
            throw new BadRequestException(error)
        }
    }
}

