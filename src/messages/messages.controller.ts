import { Controller, Post, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('messages')
export class MessagesController {
    public constructor(private readonly messageService: MessagesService) { }

    @UseGuards(AuthGuard)
    @Post()
    async sendMessage() {

    }

}
