import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtService } from '@nestjs/jwt';
import { RoomsGateway } from './rooms.gateway';
import { NotificationModule } from 'src/notification/notification.module';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [DatabaseModule,NotificationModule],
  providers: [RoomsService,NotificationService, JwtService, RoomsGateway],
  controllers: [RoomsController],
})
export class RoomsModule {}
