import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { Server, Socket } from 'socket.io';
import { AcceptInviteDto, BlockRoomMemberDto, JoinRoomDto } from './dto/room.dto';
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

    @SubscribeMessage('joinRoom')
    async joinRoom(@MessageBody() joinRoom: JoinRoomDto, @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth.user;
        const adminId = await this.roomsService.findAdminByRoom(joinRoom.roomId);
        const room =await this.dbService.rooms.findUnique({where:{id:joinRoom.roomId}})
        if(room.isPublic){
            const roomId=room.id
            client.join(roomId);
        }
        if (adminId === user.id) {
            this.server.emit("joinRoom", JoinRoomDto)
        }
    }

    @SubscribeMessage('acceptInvitation')
    async acceptRoomInvitations(@MessageBody() acceptInviteDto: AcceptInviteDto, @ConnectedSocket() client: Socket) {
        client.join(acceptInviteDto.roomId)
        const user = client.handshake.auth.user;
        const userId = await this.dbService.user.findUnique({ where: { id: acceptInviteDto.userId } })
        if (userId === user.id) {
            this.server.emit("acceptInvitation", acceptInviteDto)
        }
    }

    @SubscribeMessage('blockMember')
    async blockMember(@MessageBody() blockMemberDto: BlockRoomMemberDto, @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth.user;
        const adminId = await this.roomsService.findAdminByRoom(blockMemberDto.roomId)
        if (adminId === user.id) {
            this.server.emit("blockMember", blockMemberDto)
        }
    }

}
