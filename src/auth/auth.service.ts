import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { AuthDto, UserDto, verifyToken } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    public constructor(
        public readonly databaseService: DatabaseService,
        public readonly jwtService: JwtService,
    ) { }

    async generateToken(user: UserDto) {
        try {
            return this.jwtService.sign(user, {
                secret: process.env.ACCESS_SECRET_KEY,
                expiresIn: "1d"
            })
        } catch (error) {
            throw new error("failed to generate token")
        }
    }
    async generateRefreshToken(user: UserDto) {
        try {
            return this.jwtService.sign(user, {
                secret: process.env.REFRESH_SECRET_KEY,
                expiresIn: "7d"
            })
        } catch (error) {
            throw new error("failed to generate token")
        }
    }

    async authentication(authDto: AuthDto) {
        try {
            const user = await this.databaseService.user.findUnique({ where: { email: authDto.email } });
            if (!user) {
                throw new BadRequestException('Invalid Credentials');
            }
            const isPasswordValid = await bcrypt.compare(authDto.password, user.password);
            if (isPasswordValid) {
                const { password, ...myUser } = user;
                const token = await this.generateToken(myUser)
                const refreshToken = await this.generateRefreshToken(myUser)
                return { id:user.id, token, refreshToken }
            } else {
                throw new BadRequestException('Invalid Credentials');
            }
        } catch (error) {
            throw new BadRequestException('Invalid Credentials');
        }
    }

    async revalidateAccessToken(token: verifyToken) {
        try {
            const decoded: UserDto = await this.jwtService.verify(token.refreshToken,
                {
                    secret: process.env.REFRESH_SECRET_KEY
                }
            )
            const user = await this.databaseService.user.findUnique({
                where: {
                    id: decoded.id
                }
            })
            if (!user) {
                throw new UnauthorizedException("Invalid Token")
            }
            const accesstoken = await this.generateToken(user);
            return { token: accesstoken }
        } catch (error) {
            throw new UnauthorizedException("Invalid Token")
        }
    }
}
