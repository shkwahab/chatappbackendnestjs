import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports:[DatabaseModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    JwtService
  ]
})
export class UsersModule {}
