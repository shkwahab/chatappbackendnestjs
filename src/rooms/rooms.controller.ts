import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway'; // Import RoomsGateway
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateRoomDto, JoinRoomDto } from './dto/room.dto';

@Controller('rooms')
export class RoomsController {
    constructor(
        private readonly roomsService: RoomsService,
        private readonly roomsGateway: RoomsGateway // Inject RoomsGateway
    ) { }

    @UseGuards(AuthGuard)
    @Post()
    async create(@Body(ValidationPipe) createRoomDto: CreateRoomDto) {
        const room = await this.roomsService.create(createRoomDto);
        return room;
    }

    @UseGuards(AuthGuard)
    @Post("join")
    async joinRoom(@Body(ValidationPipe) joinRoomDto: JoinRoomDto, @Request() req: any) {
        const room = await this.roomsService.joinRoom(joinRoomDto)
        this.roomsGateway.joinRoom(joinRoomDto, req.user)
        return room;
    }

    @UseGuards(AuthGuard)
    @Get()
    async findAll() {
        const rooms = await this.roomsService.findAll();
        return rooms;
    }

    @UseGuards(AuthGuard)
    @Get("invitations:id")
    async roomsInviation(@Param("id") id: string) {
        const rooms = await this.roomsService.findAllRoomsInvitation(id);
        return rooms;
    }

    @UseGuards(AuthGuard)
    @Get(":id")
    async findOne(@Param("id") id: string) {
        const room = await this.roomsService.findOne(id);
        return room;
    }

    @UseGuards(AuthGuard)
    @Patch(":id")
    async update(@Param("id") id: string, @Body() updateRoomDto: Prisma.RoomsUpdateInput) {
        const updatedRoom = await this.roomsService.update(id, updateRoomDto);
        return updatedRoom;
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.roomsService.remove(id);
        return { message: "deleted successfully" };
    }
}
