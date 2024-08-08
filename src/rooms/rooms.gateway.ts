import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { Prisma } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AcceptInviteDto, JoinRoomDto, RoomDto } from './dto/room.dto';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@WebSocketGateway({ namespace: 'rooms' })
export class RoomsGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly roomsService: RoomsService,
        private readonly dbService: DatabaseService,
        private readonly jwtService: JwtService
    ) { }
    async handleConnection(client: Socket) {
        const token = client.handshake.auth.token;
        if (!token) {
            client.disconnect();
            throw new UnauthorizedException('Token not provided');
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.ACCESS_SECRET_KEY,
            });
            client.handshake.auth.user = payload;
        } catch (error) {
            client.disconnect();
            throw new UnauthorizedException('Invalid token');
        }
    }
    @SubscribeMessage('newRoom')
    async newRoom(@MessageBody() newRoom: RoomDto) {
        this.server.emit("newRoom", newRoom)
    }

    @SubscribeMessage('joinRoom')
    async joinRoom(@MessageBody() joinRoom: JoinRoomDto, @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth.user;
        const adminId = await this.roomsService.findAdminByRoom(joinRoom.roomId);

        if (adminId === user.id) {
            this.server.emit("joinRoom", JoinRoomDto)
        }
    }

    @SubscribeMessage('acceptInvitation')
    async acceptRoomInvitations(@MessageBody() acceptInviteDto: AcceptInviteDto, @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth.user;
        const userId = await this.dbService.user.findUnique({ where: { id: acceptInviteDto.userId } })
        if (userId === user.id) {
            this.server.emit("acceptInvitation", acceptInviteDto)
        }
    }

    @SubscribeMessage('findAllRooms')
    async findAll() {
        const rooms = await this.roomsService.findAll();
        this.server.emit('findAllRooms', rooms);
    }

    @SubscribeMessage('findOneRoom')
    async findOne(@MessageBody() id: string) {
        const room = await this.roomsService.findOne(id);
        this.server.emit('findOneRoom', room);
    }

    @SubscribeMessage('updateRooms')
    async update(@MessageBody() id: string, updateRoomsDto: Prisma.RoomsUpdateInput) {
        const updatedRoom = await this.roomsService.update(id, updateRoomsDto);
        this.server.emit('updateRooms', updatedRoom);
    }

    @SubscribeMessage('removeRooms')
    async remove(@MessageBody() id: string) {
        await this.roomsService.remove(id);
        this.server.emit('removeRooms', id);
    }
}
