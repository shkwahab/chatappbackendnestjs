import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty,  IsString } from "class-validator"



export class SendMessageDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    roomId: string
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    senderId: string
    @IsString()
    @ApiProperty()
    message: string
    receiverId?: string
}

export class UpdateMessageDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    roomId: string
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    messageId: string
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    userId: string
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    message: string
}



export class ReadMessageDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    messageId: string
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    userId: string
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    roomId: string
}
export class UnReadMessageDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    roomId: string
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    userId: string
}

export class DeleteMessageDto{
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    messageId: string
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    userId: string
}