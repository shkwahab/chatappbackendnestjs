import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { RoomsService } from './rooms.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AcceptInviteDto, BlockRoomMemberDto, CreateRoomDto, GetRoomDto, JoinRoomDto, RoomsInviationDto, RoomsUpdateDto } from './dto/room.dto';
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
    @ApiOperation({ summary: 'Create a new room' }) // Description of the endpoint
    @ApiBody({ type: CreateRoomDto })
    @ApiResponse({ status: 201, description: 'Room created successfully.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async create(@Body(ValidationPipe) createRoomDto: CreateRoomDto) {
        const room = await this.roomsService.create(createRoomDto);
        return room;
    }

    @UseGuards(AuthGuard)
    @Post("join")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Join Room' }) // Description of the endpoint
    @ApiBody({ type: JoinRoomDto })
    @ApiResponse({ status: 201, description: 'Join Room Request Sent Successfully.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
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
    @ApiOperation({ summary: 'Accept Invitation Room' }) // Description of the endpoint
    @ApiBody({ type: AcceptInviteDto })
    @ApiResponse({ status: 201, description: 'Admin has accepted your request to join room.' }) // Success response
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
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
    @ApiOperation({ summary: 'Get All Rooms' }) // Description of the endpoint
    @ApiResponse({ status: 200, description: 'List of Rooms.', type: GetRoomDto }) // Success response
    @ApiQuery({ name: "page", type: Number, required: false })
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async findAll(@Query("page") page?: number) {
        const rooms = await this.roomsService.findAll(page);
        return rooms;
    }

    @UseGuards(AuthGuard)
    @Get("user/:id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get All Rooms of User' }) // Description of the endpoint
    @ApiResponse({ status: 200, description: 'List of Rooms by User Id.', type: GetRoomDto }) // Success response
    @ApiQuery({ name: "page", type: Number, required: false })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
    async findAllUserRooms(@Param("id") id: string, @Query("page") page?: number) {
        const rooms = await this.roomsService.findAllUserRooms(id, page);
        return rooms;
    }

    @UseGuards(AuthGuard)
    @Get("invitations/:id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get All Rooms Invitations by Room Id' }) // Description of the endpoint
    @ApiResponse({ status: 200, description: 'List of Invitations by Room Id.', type: [RoomsInviationDto] }) // Success response
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 401, description: 'UnAuthorized.' }) // Error response
    async roomsInviation(@Param("id") id: string) {
        const rooms = await this.roomsService.findAllRoomsInvitation(id);
        return rooms;
    }


    @UseGuards(AuthGuard)
    @Patch("blockMember/:id")
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Block User by Room Admin Id' }) // Description of the endpoint
    @ApiResponse({ status: 201, description: 'Block User by Room Admin Id.' }) // Success response
    @ApiBody({ type: BlockRoomMemberDto })
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 401, description: 'UnAuthorized.' }) // Error response
    @ApiResponse({ status: 400, description: 'Only Admin has right to block the user only.' }) // Error response
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
    @ApiOperation({ summary: 'Update Room by Room Id and Admin Id' }) // Description of the endpoint
    @ApiResponse({ status: 201, description: 'Room Updated Successfully.', type: RoomsUpdateDto }) // Success response
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 401, description: 'UnAuthorized.' }) // Error response
    @ApiResponse({ status: 400, description: 'Only Admin has right to update the room.' }) // Error response
    async update(@Param("id") id: string, @Body() updateRoomDto: Prisma.RoomsUpdateInput) {
        const updatedRoom = await this.roomsService.update(id, updateRoomDto);
        return updatedRoom;
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete Room by Room Id' }) // Description of the endpoint
    @ApiResponse({ status: 201, description: 'Room Deleted Successfully.' }) // Success response
    @ApiParam({ name: "id", type: String })
    @ApiResponse({ status: 401, description: 'UnAuthorized.' }) // Error response
    async remove(@Param('id') id: string) {
        await this.roomsService.remove(id);
        return { message: "deleted successfully" };
    }



}
