import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, verifyToken } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { } 
  
  @Post()
  auth(@Body(ValidationPipe) authDto: AuthDto) {
    return this.authService.authentication(authDto);
  }
  @Post("/refresh-token")
  generateAuthTokne(@Body(ValidationPipe) tokenDto:verifyToken){
    return this.authService.revalidateAccessToken(tokenDto)
  }

}
