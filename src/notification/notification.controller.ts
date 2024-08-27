import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationDto, SubscriptionDto } from './dto/notifierDto';

@ApiTags("notification")
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get User Notifications' }) // Description of the endpoint
  @ApiResponse({ status: 200, description: 'List of notifications.', type: NotificationDto }) // Success response
  @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
  @ApiParam({ name: "id", type: String })
  @ApiParam({ name: "page", type: Number, required: false })
  findAll(@Param("id") @Query("page") id: string, pagenumber: number) {
    return this.notificationService.findAll(id, pagenumber);
  }

  @Post("subscribe")
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register Subscriber' }) 
  @ApiResponse({ status: 200, description: 'Subscriber Registered', type: SubscriptionDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' }) 
  Subscribe(@Body() subscribeDto: SubscriptionDto) {
    return this.notificationService.subscribe(subscribeDto);
  }
}
