import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { RoomsService } from './rooms.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AcceptInviteDto, BlockRoomMemberDto, CreateRoomDto, JoinRoomDto } from './dto/room.dto';
import { RoomsGateway } from './rooms.gateway';

@Controller('rooms')
export class RoomsController {
    constructor(
        private readonly roomsService: RoomsService,
        private readonly roomsGateway: RoomsGateway,
    ) { }

    @UseGuards(AuthGuard)
    @Post()
    async create(@Body(ValidationPipe) createRoomDto: CreateRoomDto) {
        const room = await this.roomsService.create(createRoomDto);
        return room;
    }

    @UseGuards(AuthGuard)
    @Post("join")
    async joinRoom(@Body(ValidationPipe) joinRoomDto: JoinRoomDto, @Request() req) {
        const user:User = req.user
        const client = await this.roomsGateway.findSocketById(user.id)
        const room = await this.roomsService.joinRoom(joinRoomDto)
        await this.roomsGateway.joinRoom(joinRoomDto, client)
        return room;
    }

    @UseGuards(AuthGuard)
    @Post("acceptInvitation")
    async acceptInvitation(@Body() adminId: string, acceptInviteDto: AcceptInviteDto) {
        const invite = await this.roomsService.acceptInvitation(adminId, acceptInviteDto);
        // this.roomsGateway.acceptRoomInvitations(acceptInviteDto, req);
        return invite
    }

    @UseGuards(AuthGuard)
    @Post("blockMember")
    async blockMember(@Body() adminId: string, blockRoomMemberDto: BlockRoomMemberDto) {
        const blockMember = await this.roomsService.acceptInvitation(adminId, blockRoomMemberDto);
        // this.roomsGateway.blockMember(blockRoomMemberDto, req);
        return blockMember
    }


    @UseGuards(AuthGuard)
    @Get()
    async findAll(@Query("page") page?: number) {
        const rooms = await this.roomsService.findAll(page);
        return rooms;
    }

    @UseGuards(AuthGuard)
    @Get("admin")
    async findAllAdminRooms(@Param("id") id: string, @Query("page") page?: number) {
        const rooms = await this.roomsService.findAllAdminRooms(id, page);
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
