import { IsNotEmpty, IsNumber, IsString } from "class-validator"

export class GetMessageDto {
    @IsString()
    @IsNotEmpty()
    userId: string
    @IsString()
    @IsNotEmpty()
    roomId: string

}

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    roomId: string
    @IsString()
    @IsNotEmpty()
    senderId: string
    @IsString()
    @IsNotEmpty()
    message: string
    receiverId?: string
}

export class UpdateMessageDto {
    @IsString()
    @IsNotEmpty()
    messageId: string
    @IsString()
    @IsNotEmpty()
    userId: string
    @IsString()
    @IsNotEmpty()
    message: string
}


export class ReadMessageDto {
    @IsString()
    @IsNotEmpty()
    messageId: string
    @IsString()
    @IsNotEmpty()
    userId: string
    @IsString()
    @IsNotEmpty()
    roomId: string
}
export class UnReadMessageDto {
    @IsString()
    @IsNotEmpty()
    roomId: string
    @IsString()
    @IsNotEmpty()
    userId: string
}

export class DeleteMessageDto{
    @IsString()
    @IsNotEmpty()
    messageId: string
    @IsString()
    @IsNotEmpty()
    userId: string
}