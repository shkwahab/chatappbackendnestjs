import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtService } from '@nestjs/jwt';
import { RoomsGateway } from './rooms.gateway';

@Module({
  imports: [DatabaseModule],
  providers: [RoomsService, JwtService, RoomsGateway],
  controllers: [RoomsController],
})
export class RoomsModule {}
