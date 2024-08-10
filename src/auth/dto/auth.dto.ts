import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class AuthDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    password: string
}

export class UserDto {
    id: string;
    name: string;
    username: string;
    img: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export class verifyToken {
    @ApiProperty()
    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    refreshToken: string
}


export class AuthenticatedCredentialResponse {
    @ApiProperty()
    id: string;
    @ApiProperty()
    token: string;
    @ApiProperty()
    refreshToken: string;
}
export class RefreshResponse {
    @ApiProperty()
    token: string;
}