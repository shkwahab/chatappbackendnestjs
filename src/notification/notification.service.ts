import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import * as webPush from 'web-push';
import { Key, SubscriptionDto } from './dto/notifierDto';

@Injectable()
export class NotificationService {
    public constructor(public readonly databaseService: DatabaseService) { }

    async subscribe(subscriptonDto: SubscriptionDto) {
        try {
            const subscriber = await this.databaseService.notifier.create({
                data: subscriptonDto
            })
            return subscriber
        } catch (error) {
            throw new BadRequestException(error)
        }
    }



    async findAll(userId: string, page: number = 1) {
        const PAGE_SIZE = 10;

        // Fetch notifications for the user, sorted by creation date (newest first)
        const notifications = await this.databaseService.notifications.findMany({
            where: {
                NotificationReceivers: {
                    some: {
                        receiverId: userId
                    }
                }
            },
            orderBy: { createdAt: 'desc' }, // Sort by creation date, newest first
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        });

        const totalNotifications = await this.databaseService.notifications.count({
            where: {
                NotificationReceivers: {
                    some: {
                        receiverId: userId
                    }
                }
            }
        });

        // Fetch sender details and exclude email and password
        const notificationsWithSender = await Promise.all(
            notifications.map(async (notification) => {
                const { email, password, createdAt, updatedAt, ...sender } = await this.databaseService.user.findUnique({
                    where: { id: notification.senderId }
                });

                return {
                    ...notification,
                    sender: sender,
                };
            })
        );

        // Determine if there's a next page
        const hasNextPage = (page * PAGE_SIZE) < totalNotifications;

        // Create pagination response
        const paginatedNotifications = {
            notifications: notificationsWithSender,
            pagination: {
                currentPage: page,
                pageSize: PAGE_SIZE,
                totalNotifications,
                hasNextPage,
                nextPage: hasNextPage ? `/notifications/${userId}?page=${page + 1}` : null,
                previousPage: page > 1 ? `/notifications/${userId}?page=${page - 1}` : null,
            },
        };

        return paginatedNotifications;
    }


    async sendPushNotification(notificationId: string, url: string) {
        try {
            const notification = await this.databaseService.notifications.findUnique({
                where: {
                    id: notificationId
                }
            })
            const NotificationReceivers = await this.databaseService.notificationReceivers.findMany({
                where: {
                    notificationId
                }
            })
            const receiverIds = NotificationReceivers.map(receiver => receiver.receiverId);
            const subscribers = await this.databaseService.notifier.findMany({
                where: {
                    userId: { in: receiverIds }
                }
            });
            
            for (const subscriber of subscribers) {
                try {
                    const pushSubscription = {
                        endpoint: subscriber.endpoint,
                        keys: subscriber.keys as Key
                    };
                   const res= await webPush.sendNotification(pushSubscription, JSON.stringify({
                        title: "Chat App",
                        body: notification.message,
                        icon: process.env.APP_ICON,
                        url
                    }));
                    console.log(res)
                } catch (error) {
                    console.error('Error sending notification:', error);
                }
            }

        } catch (error) {
            throw new BadRequestException(error)
        }
    }

}
