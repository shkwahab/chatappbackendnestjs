import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';


@Injectable()
export class NotificationService {
  public constructor(public readonly databaseService: DatabaseService) { }
 
  async findAll(userId: string, page: number = 1) {
    const PAGE_SIZE = 10;
    
    // Fetch notifications for the user, sorted by creation date (newest first)
    const notifications = await this.databaseService.notifications.findMany({
        where: { NotificationReceivers:{
            some:{
                receiverId:userId
            }
        } },
        orderBy: { createdAt: 'desc' }, // Sort by creation date, newest first
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
    });
    const totalNotifications = await this.databaseService.notifications.count({
        where: { NotificationReceivers:{
            some:{
                receiverId:userId
            }
        } }
    });

    // Determine if there's a next page
    const hasNextPage = (page * PAGE_SIZE) < totalNotifications;

    // Create pagination response
    const paginatedNotifications = {
        notifications,
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


}
