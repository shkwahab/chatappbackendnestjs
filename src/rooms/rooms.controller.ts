import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { RoomsService } from './rooms.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AcceptInviteDto, AcceptRequestDto, BlockRoomMemberDto, CreateRoomWithMembersDto, DeleteRoomMemberShipDto, GetRoomDto, JoinRoomDto, MemberRequestRoomDto, MemberRoomDto, RoomsInviationDto, RoomsUpdateDto } from './dto/room.dto';
import { RoomsGateway } from './rooms.gateway';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DatabaseService } from 'src/database/database.service';


@ApiTags("rooms")
@Controller('rooms')
export class RoomsController {
    constructor(
        private readonly roomsService: RoomsService,
        private readonly roomsGateway: RoomsGateway,
        private readonly databaseService: DatabaseService,
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
    @Post("/sendRequest")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Sent Request to members to join room' })
    @ApiBody({ type: [MemberRequestRoomDto] })
    @ApiResponse({ status: 201, description: 'Request Sent successfully.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async sendRequest(@Body(ValidationPipe) sendMembersRequestDto: MemberRequestRoomDto[], @Request() req) {
        const user: User = req.user
        const client = await this.roomsGateway.findSocketById(user.id)
        if (client) {
            await this.roomsGateway.sendRequest(sendMembersRequestDto, client)
        }
        const room = await this.roomsService.sendRequest(sendMembersRequestDto);
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
        if (client) {
            await this.roomsGateway.joinRoom(joinRoomDto, client)
        }
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
        await this.roomsService.acceptInvitation(acceptInviteDto);
        const user: User = req.user
        const client = await this.roomsGateway.findSocketById(user.id)
        if (client) {
            this.roomsGateway.acceptRoomInvitations(acceptInviteDto, client);
        }
        const { password, ...newUser } = await this.databaseService.user.findUnique({
            where: {
                id: acceptInviteDto.userId
            }
        });
        return newUser
    }

    @UseGuards(AuthGuard)
    @Delete("rejectInvitation/:adminId/:roomId/:userId")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reject Invitation Room' })
    @ApiResponse({ status: 201, description: 'Admin has rejected your request to join room.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async rejectInvitation(@Param("adminId") adminId: string, @Param("roomId") roomId: string, @Param("userId") userId: string, @Request() req) {
        const user: User = req.user
        const invite = await this.roomsService.rejectInvitation({ adminId, roomId, userId }, user)
        const client = await this.roomsGateway.findSocketById(user.id)
        if (client) {
            this.roomsGateway.rejectInvitation({ roomId, userId }, client);
        }
        console.log(invite)
        return invite
    }

    @UseGuards(AuthGuard)
    @Patch("acceptRequest")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Accept Request Room' })
    @ApiBody({ type: AcceptRequestDto })
    @ApiResponse({ status: 201, description: 'Request Accepted.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async acceptRequest(@Body() acceptRequestDto: AcceptRequestDto, @Request() req) {
        const user: User = req.user
        const request = await this.roomsService.acceptRoomRequest(acceptRequestDto, user);
        const client = await this.roomsGateway.findSocketById(user.id)
        if (client) {
            this.roomsGateway.acceptRequest(acceptRequestDto, client);
        }

        return request;
    }

    @UseGuards(AuthGuard)
    @Patch("leaveRoom")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Exit Room or Leave Room' })
    @ApiBody({ type: AcceptRequestDto })
    @ApiResponse({ status: 201, description: 'Room Membership deleted.' })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async exitRoom(@Body() deleteRoomMemberShipDto:DeleteRoomMemberShipDto, @Request() req) {
        const user: User = req.user
        const exitRoom = await this.roomsService.deleteRoomMemberShip(deleteRoomMemberShipDto)
        const client = await this.roomsGateway.findSocketById(user.id)
        if (client) {
            this.roomsGateway.leaveRoom(deleteRoomMemberShipDto,client)
        }

        return exitRoom;
    }

    @UseGuards(AuthGuard)

    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get All Rooms' })
    @ApiResponse({ status: 200, description: 'List of Rooms.', type: GetRoomDto })
    @ApiQuery({ name: "page", type: Number, required: false })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async findAll(@Request() req, @Query("page") page?: number) {
        const user: User = req.user;
        const rooms = await this.roomsService.findAll(page, user);
        return rooms;
    }

    @Get(":id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get Room by id' })
    @ApiResponse({ status: 200, description: 'Get Room by Id.' })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async findOne(@Param("id") id: string) {
        const room = await this.roomsService.findOne(id);
        return room;
    }

    @UseGuards(AuthGuard)
    @Get("user/:id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get All Rooms of User' })
    @ApiResponse({ status: 200, description: 'List of Rooms by User Id.', type: GetRoomDto })
    @ApiQuery({ name: "page", type: Number, required: false })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    async findAllUserRooms(@Param("id") id: string, @Request() req, @Query("page") page?: number,) {
        const user: User = req.user
        const rooms = await this.roomsService.findAllUserRooms(id, page, user);
        return rooms;
    }

    @UseGuards(AuthGuard)
    @Patch("blockUnblockMember/:id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Block Unblock User by Room Admin Id' })
    @ApiResponse({ status: 201, description: 'Block Unblock User by Room Admin Id.' })
    @ApiBody({ type: BlockRoomMemberDto })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 401, description: 'UnAuthorized.' })
    @ApiResponse({ status: 400, description: 'Only Admin has right to block the user only.' })
    async blockUnblockMember(@Param("id") adminId: string, @Body() blockRoomMemberDto: BlockRoomMemberDto, @Request() req) {
        const blockUnblockMember = await this.roomsService.blockUnblockMember(adminId, blockRoomMemberDto);
        const user: User = req.user
        const client = await this.roomsGateway.findSocketById(user.id)
        if (client) {
            this.roomsGateway.blockUnblockMember(blockRoomMemberDto, client);
        }
        return blockUnblockMember
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
        console.log(updateRoomDto)
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
