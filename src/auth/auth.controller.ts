import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, AuthenticatedCredentialResponse, RefreshResponse, verifyToken } from './dto/auth.dto';
import { ApiTags, ApiResponse, ApiBody, ApiOperation } from '@nestjs/swagger';
import { UserDto } from 'src/users/dto/user.dto';

@ApiTags("auth")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post()
  @ApiOperation({ summary: 'Login user' }) 
  @ApiBody({ type: AuthDto })
  @ApiResponse({ status: 200, description: "login successfully",type:AuthenticatedCredentialResponse })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  auth(@Body(ValidationPipe) authDto: AuthDto) {
    return this.authService.authentication(authDto);
  }

  @Post("/refresh-token")
  @ApiOperation({ summary: 'Generate new access token'}) 
  @ApiBody({ type: verifyToken })
  @ApiResponse({ status: 200, description: "new access token" ,type:RefreshResponse })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  generateAuthTokne(@Body(ValidationPipe) tokenDto: verifyToken) {
    return this.authService.revalidateAccessToken(tokenDto)
  }

}
