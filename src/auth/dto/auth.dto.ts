import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class AuthDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string
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

export class verifyToken{
    @IsString()
    @IsNotEmpty()
    refreshToken:string
}