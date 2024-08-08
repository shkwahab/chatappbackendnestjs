import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports:[DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService,JwtService],
})
export class AuthModule {}
