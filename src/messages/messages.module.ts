import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtService } from '@nestjs/jwt';
import { NotificationModule } from 'src/notification/notification.module';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports:[DatabaseModule,NotificationModule],
  providers: [MessagesGateway, MessagesService, NotificationService, JwtService],
  controllers: [MessagesController],
})
export class MessagesModule {}
