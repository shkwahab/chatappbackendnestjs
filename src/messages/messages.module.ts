import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports:[DatabaseModule],
  providers: [MessagesGateway, MessagesService,JwtService],
  controllers: [MessagesController],
})
export class MessagesModule {}
