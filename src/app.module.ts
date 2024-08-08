import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [ UsersModule, RoomsModule, DatabaseModule, AuthModule, NotificationModule, MessagesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
