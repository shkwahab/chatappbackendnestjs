import { Controller, Post, UseGuards, Request, Body, ValidationPipe, Patch, Delete, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { DeleteMessageDto, GetMessageDto, ReadMessageDto, SendMessageDto, UnReadMessageDto, UpdateMessageDto } from './dto/messageDto';
import { MessagesGateway } from './messages.gateway';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags("messages")
@Controller('messages')
export class MessagesController {
    public constructor(
        private readonly messageService: MessagesService,
        private readonly messageGateway: MessagesGateway
    ) { }

    @UseGuards(AuthGuard)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Send the message' }) // Description of the endpoint
    @ApiBody({ type: SendMessageDto })
    @ApiResponse({ status: 201, description: 'Message Sent Successfully.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async sendMessage(@Body(ValidationPipe) sendMessageDto: SendMessageDto, @Request() req: any) {
        const user: User = req.user
        const client = await this.messageGateway.findSocketById(user.id)
        this.messageGateway.sendMessage(sendMessageDto, client);
        this.messageGateway.unReadMessage(sendMessageDto.roomId, client)
        return await this.messageService.sendMessage(sendMessageDto);
    }

    @UseGuards(AuthGuard)
    @Post("get")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get the messages of User by Room Id' }) // Description of the endpoint
    @ApiBody({ type: SendMessageDto })
    @ApiQuery({ name: "page", required: false })
    @ApiQuery({ name: "limit", required: false })
    @ApiResponse({ status: 201, description: 'Message Sent Successfully.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async getUserMessages(@Body(ValidationPipe) getMessageDto: GetMessageDto, @Query("page") page: number = 1, @Query("limit") limit: number = 10) {
        return await this.messageService.findUserMessages(getMessageDto, page, limit);
    }

    @UseGuards(AuthGuard)
    @Patch()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update the messages of User by Room Id' }) // Description of the endpoint
    @ApiBody({ type: UpdateMessageDto })
    @ApiResponse({ status: 201, description: 'Message Updated Successfully.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async updateUserMessage(@Body(ValidationPipe) updateMessageDto: UpdateMessageDto) {
        return await this.messageService.updateMessage(updateMessageDto)
    }

    @UseGuards(AuthGuard)
    @Delete()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete the messages of User by Room Id' }) // Description of the endpoint
    @ApiBody({ type: DeleteMessageDto })
    @ApiResponse({ status: 201, description: 'Message Deleted Successfully.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async deleteUserMessage(@Body(ValidationPipe) deleteMessageDto: DeleteMessageDto) {
        return await this.messageService.deleteMessage(deleteMessageDto)
    }

    @UseGuards(AuthGuard)
    @Post("unReadCount")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Return the lenght of unRead Messages' }) // Description of the endpoint
    @ApiBody({ type:UnReadMessageDto })
    @ApiResponse({ status: 201, description: 'UnRead Messages length.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async unReadMessage(@Body(ValidationPipe) unReadMessageDto: UnReadMessageDto) {
        return await this.messageService.unReadMessageCount(unReadMessageDto)
    }

    @UseGuards(AuthGuard)
    @Post("readMessages")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Read the messages by message id' }) // Description of the endpoint
    @ApiBody({ type:[ReadMessageDto] })
    @ApiResponse({ status: 201, description: 'Messages Read Successfully.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async ReadMessages(@Body(ValidationPipe) readMessagesDto: ReadMessageDto[], @Request() req) {
        const user: User = req.user
        const client = await this.messageGateway.findSocketById(user.id)
        this.messageGateway.readMessages(readMessagesDto, client)
        return await this.messageService.readMessages(readMessagesDto)
    }

}
