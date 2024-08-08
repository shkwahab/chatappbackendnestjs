import { Controller, Get, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get(":id")
  findAll(@Param("id") @Query("page") id: string, pagenumber: number) {
    return this.notificationService.findAll(id, pagenumber);
  }

}
