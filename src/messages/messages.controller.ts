import { Controller, Post, UseGuards, Request, Body, ValidationPipe, Patch, Delete, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { DeleteMessageDto, GetMessageDto, ReadMessageDto, SendMessageDto, UnReadMessageDto, UpdateMessageDto } from './dto/messageDto';
import { MessagesGateway } from './messages.gateway';
import { User } from '@prisma/client';

@Controller('messages')
export class MessagesController {
    public constructor(
        private readonly messageService: MessagesService,
        private readonly messageGateway: MessagesGateway
    ) { }

    @UseGuards(AuthGuard)
    @Post()
    async sendMessage(@Body(ValidationPipe) sendMessageDto: SendMessageDto, @Request() req: any) {
        const user: User = req.user
        const client = await this.messageGateway.findSocketById(user.id)
        this.messageGateway.sendMessage(sendMessageDto, client);
        this.messageGateway.unReadMessage(sendMessageDto.roomId, client)
        return await this.messageService.sendMessage(sendMessageDto);
    }

    @UseGuards(AuthGuard)
    @Post()
    async getUserMessages(@Body(ValidationPipe) getMessageDto: GetMessageDto, @Query("page") page: number=1, @Query("limit") limit: number=10) {
        return await this.messageService.findUserMessages(getMessageDto, page, limit);
    }

    @UseGuards(AuthGuard)
    @Patch()
    async updateUserMessage(@Body(ValidationPipe) updateMessageDto: UpdateMessageDto) {
        return await this.messageService.updateMessage(updateMessageDto)
    }

    @UseGuards(AuthGuard)
    @Delete()
    async deleteUserMessage(@Body(ValidationPipe) deleteMessageDto: DeleteMessageDto) {
        return await this.messageService.deleteMessage(deleteMessageDto)
    }

    @UseGuards(AuthGuard)
    @Post("unReadCount")
    async unReadMessage(@Body(ValidationPipe) unReadMessageDto: UnReadMessageDto) {
        return await this.messageService.unReadMessageCount(unReadMessageDto)
    }

    @UseGuards(AuthGuard)
    @Post("readMessages")
    async ReadMessages(@Body(ValidationPipe) readMessagesDto: ReadMessageDto[], @Request() req) {
        const user: User = req.user
        const client = await this.messageGateway.findSocketById(user.id)
        this.messageGateway.readMessages(readMessagesDto, client)
        return await this.messageService.readMessages(readMessagesDto)
    }

}
