import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Prisma } from '@prisma/client';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get(":id")
  findAll(@Param("id") @Query("page") id:string, pagenumber:number) {
    return this.notificationService.findAll(id,pagenumber);
  }
  
}
