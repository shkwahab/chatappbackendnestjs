import { Controller, Post, UseGuards, Request, Body, ValidationPipe, Patch, Delete, Query, Param, Get } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { DeleteMessageDto, ReadMessageDto, SendMessageDto, UnReadMessageDto, UpdateMessageDto } from './dto/messageDto';
import { MessagesGateway } from './messages.gateway';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

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
        if (client) {
            this.messageGateway.sendMessage(sendMessageDto, client);
            this.messageGateway.unReadMessage(sendMessageDto.roomId, client)
        }
        return await this.messageService.sendMessage(sendMessageDto);
    }

    @UseGuards(AuthGuard)
    @Get("rooms/:id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get the messages of User by Room Id' })
    @ApiQuery({ name: "page", required: false })
    @ApiQuery({ name: "limit", required: false })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 200, description: 'Message get successfully.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async getUserMessages(@Param("id") id: string, @Query("page") page: number = 1, @Query("limit") limit: number = 10) {
        return await this.messageService.findUserMessages(id, Number(page), Number(limit));
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
    @Delete("/:id/:userId")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete the messages of User by Room Id' }) 
    @ApiParam({name:"id",type:String})
    @ApiParam({name:"userId",type:String})
    @ApiResponse({ status: 201, description: 'Message Deleted Successfully.' }) 
    @ApiResponse({ status: 400, description: 'Bad Request.' }) 
    async deleteUserMessage(@Param("id") messageId:string,@Param("userId") userId:string) {
        return await this.messageService.deleteMessage({messageId,userId})
    }

    

    @UseGuards(AuthGuard)
    @Post("readMessages")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Read the messages by message id' }) // Description of the endpoint
    @ApiBody({ type: [ReadMessageDto] })
    @ApiResponse({ status: 201, description: 'Messages Read Successfully.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async ReadMessages(@Body(ValidationPipe) readMessagesDto: ReadMessageDto[], @Request() req) {
        const user: User = req.user
        const client = await this.messageGateway.findSocketById(user.id)
        this.messageGateway.readMessages(readMessagesDto, client)
        return await this.messageService.readMessages(readMessagesDto)
    }

}
