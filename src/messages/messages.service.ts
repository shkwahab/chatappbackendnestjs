import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { DeleteMessageDto, GetMessageDto, ReadMessageDto, SendMessageDto, UnReadMessageDto, UpdateMessageDto } from './dto/messageDto';
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

    async findUserMessages(getMessageDto: GetMessageDto, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        try {
            const totalCount = await this.databaseService.message.count({
                where: {
                    messageMembership: {
                        some: {
                            receiverId: getMessageDto.userId,
                            roomId: getMessageDto.roomId,
                        },
                    },
                },
            });

            const messages = await this.databaseService.message.findMany({
                where: {
                    messageMembership: {
                        some: {
                            roomId: getMessageDto.roomId,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            });
            const messageMembersShip = async (messageId) => {
                const memberShip = await this.databaseService.messageMemberShip.findUnique({
                    where: {
                        messageId
                    }
                });
                const senderUser = await this.databaseService.user.findUnique({
                    where: {
                        id: memberShip.senderId
                    }
                });
                const receiverUser = await this.databaseService.user.findUnique({
                    where: {
                        id: memberShip.receiverId
                    }
                });
                const { password: senderPassword, ...sender } = senderUser;
                const { password: receiverPassword, ...receiver } = receiverUser;
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
                next: page * limit < totalCount ? `/messages/${getMessageDto.userId}?page=${page + 1}&limit=${limit}` : null,
                previous: page > 1 ? `/messages/${getMessageDto.userId}?page=${page - 1}&limit=${limit}` : null,
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

