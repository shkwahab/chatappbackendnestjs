import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { RoomsService } from './rooms.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AcceptInviteDto, BlockRoomMemberDto, CreateRoomDto, CreateRoomWithMembersDto, GetRoomDto, JoinRoomDto, MemberRoomDto, RoomsInviationDto, RoomsUpdateDto } from './dto/room.dto';
import { RoomsGateway } from './rooms.gateway';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';


@ApiTags("rooms")
@Controller('rooms')
export class RoomsController {
    constructor(
        private readonly roomsService: RoomsService,
        private readonly roomsGateway: RoomsGateway,
    ) { }

    @UseGuards(AuthGuard)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new room and sent invitation to members to join room' })
    @ApiBody({ type: CreateRoomWithMembersDto })
    @ApiResponse({ status: 201, description: 'Room created successfully.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async create(@Body(ValidationPipe) createRoomWithMemberDto: CreateRoomWithMembersDto, @Request() req) {
        const user: User = req.user
        const client = await this.roomsGateway.findSocketById(user.id)
        if (client)
            await this.roomsGateway.createRoom(createRoomWithMemberDto.members, client)
        const room = await this.roomsService.create(createRoomWithMemberDto.room, createRoomWithMemberDto.members);
        return room;
    }

    @UseGuards(AuthGuard)
    @Post("join")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Join Room' })
    @ApiBody({ type: JoinRoomDto })
    @ApiResponse({ status: 201, description: 'Join Room Request Sent Successfully.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async joinRoom(@Body(ValidationPipe) joinRoomDto: JoinRoomDto, @Request() req) {
        const user: User = req.user
        const client = await this.roomsGateway.findSocketById(user.id)
        const room = await this.roomsService.joinRoom(joinRoomDto)
        await this.roomsGateway.joinRoom(joinRoomDto, client)
        return room;
    }

    @UseGuards(AuthGuard)
    @Patch("acceptInvitation")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Accept Invitation Room' })
    @ApiBody({ type: AcceptInviteDto })
    @ApiResponse({ status: 201, description: 'Admin has accepted your request to join room.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async acceptInvitation(@Body() acceptInviteDto: AcceptInviteDto, @Request() req) {
        const invite = await this.roomsService.acceptInvitation(acceptInviteDto);
        const user: User = req.user
        const client = await this.roomsGateway.findSocketById(user.id)
        this.roomsGateway.acceptRoomInvitations(acceptInviteDto, client);
        return invite
    }

    @UseGuards(AuthGuard)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get All Rooms' })
    @ApiResponse({ status: 200, description: 'List of Rooms.', type: GetRoomDto })
    @ApiQuery({ name: "page", type: Number, required: false })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async findAll(@Query("page") page?: number) {
        const rooms = await this.roomsService.findAll(page);
        return rooms;
    }

    @UseGuards(AuthGuard)
    @Get("user/:id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get All Rooms of User' })
    @ApiResponse({ status: 200, description: 'List of Rooms by User Id.', type: GetRoomDto })
    @ApiQuery({ name: "page", type: Number, required: false })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async findAllUserRooms(@Param("id") id: string, @Query("page") page?: number) {
        const rooms = await this.roomsService.findAllUserRooms(id, page);
        return rooms;
    }

    @UseGuards(AuthGuard)
    @Get("invitations/:id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get All Rooms Invitations by Room Id' })
    @ApiResponse({ status: 200, description: 'List of Invitations by Room Id.', type: [RoomsInviationDto] })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 401, description: 'UnAuthorized.' })
    async roomsInviation(@Param("id") id: string) {
        const rooms = await this.roomsService.findAllRoomsInvitation(id);
        return rooms;
    }


    @UseGuards(AuthGuard)
    @Patch("blockMember/:id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Block User by Room Admin Id' })
    @ApiResponse({ status: 201, description: 'Block User by Room Admin Id.' })
    @ApiBody({ type: BlockRoomMemberDto })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 401, description: 'UnAuthorized.' })
    @ApiResponse({ status: 400, description: 'Only Admin has right to block the user only.' })
    async blockMember(@Param("id") adminId: string, @Body() blockRoomMemberDto: BlockRoomMemberDto, @Request() req) {
        const blockMember = await this.roomsService.blockRoomUser(adminId, blockRoomMemberDto);
        const user: User = req.user
        const client = await this.roomsGateway.findSocketById(user.id)
        this.roomsGateway.blockMember(blockRoomMemberDto, client);
        return blockMember
    }



    @UseGuards(AuthGuard)
    @Patch(":id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update Room by Room Id and Admin Id' })
    @ApiResponse({ status: 201, description: 'Room Updated Successfully.', type: RoomsUpdateDto })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 401, description: 'UnAuthorized.' })
    @ApiResponse({ status: 400, description: 'Only Admin has right to update the room.' })
    async update(@Param("id") id: string, @Body() updateRoomDto: Prisma.RoomsUpdateInput) {
        const updatedRoom = await this.roomsService.update(id, updateRoomDto);
        return updatedRoom;
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete Room by Room Id' })
    @ApiResponse({ status: 201, description: 'Room Deleted Successfully.' })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 401, description: 'UnAuthorized.' })
    async remove(@Param('id') id: string) {
        await this.roomsService.remove(id);
        return { message: "deleted successfully" };
    }



}
