import { SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AcceptInviteDto, BlockRoomMemberDto, CreateRoomDto, JoinRoomDto, MemberRoomDto, RoomDto } from './dto/room.dto';
import { UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { isUndefined } from 'util';
import { RoomsService } from './rooms.service';
import { User } from '@prisma/client';

@WebSocketGateway({ namespace: 'rooms' })
export class RoomsGateway {
    @WebSocketServer()
    server: Server;
    client: Socket;

    private userSocketMap: Map<string, Socket> = new Map()
    constructor(
        // private readonly roomsService: RoomsService,
        private readonly dbService: DatabaseService,
        private readonly jwtService: JwtService,
        private readonly roomsService: RoomsService,
    ) { }

    async handleConnection(client: Socket) {
        const authHeader = client.handshake.headers.authorization;
        if (!authHeader) {
            client.disconnect();
            throw new UnauthorizedException('Authorization header not provided');
        }

        const token = authHeader.split(' ')[1]; // Extract the token part
        if (!token) {
            client.disconnect();
            throw new UnauthorizedException('Token not provided');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.ACCESS_SECRET_KEY,
            });
            client.handshake.auth = { user: payload }; // Ensure auth is initialized
            this.userSocketMap.set(payload.id, client); // Add client to map
            return client
        } catch (error) {
            client.disconnect();
            throw new UnauthorizedException('Invalid token');
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.handshake.auth?.user?.id;
        if (userId) {
            this.userSocketMap.delete(userId);
        }
    }

    public async findSocketById(id: string): Promise<Socket | null> {
        const socket = this.userSocketMap.get(id);
        if (!socket) {
            console.log('Socket not found');
            return null;
        }
        return socket;
    }

    // Convert DTO to a plain object before emitting
    @SubscribeMessage('joinRoom')
    async joinRoom(@MessageBody() joinRoom: JoinRoomDto, @ConnectedSocket() client: Socket) {
        const user: User = client.handshake.auth?.user;

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        const room = await this.dbService.rooms.findUnique({ where: { id: joinRoom.roomId } });


        if (room.isPublic) {
            client.join(room.id);
            console.log(`Client joined room ${room.id}`);
        }
        if (room.adminId != user.id) {
            const adminSocket = this.userSocketMap.get(room.adminId);
            this.server.to(adminSocket.id).emit('joinRoom', joinRoom);
        }
    }
    
    @SubscribeMessage('sentInvitation')
    async createRoom(@MessageBody() sentInvitation: MemberRoomDto[], @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth?.user;
        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }
        const requestedMembers = sentInvitation.map((member) => {
            return this.userSocketMap.get(member.userId);
        }).filter(member => member); 
    
        requestedMembers.forEach((member) => {
            this.server.to(member.id).emit('joinRequest', sentInvitation);
        });
    }


    @SubscribeMessage('acceptInvitation')
    async acceptRoomInvitations(@MessageBody() acceptInviteDto: AcceptInviteDto, @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth?.user; // Use optional chaining

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        client.join(acceptInviteDto.roomId);
        console.log(`Client joined room ${acceptInviteDto.roomId}`);

        const inviteuser = await this.dbService.user.findUnique({ where: { id: acceptInviteDto.userId } });
        const inviteUserSocket = this.userSocketMap.get(inviteuser.id)
        if (inviteuser && inviteuser.id === user.id) {
            this.server.to(inviteUserSocket.id).emit('acceptInvitation', acceptInviteDto);
        }
    }

    @SubscribeMessage('blockMember')
    async blockMember(@MessageBody() blockMemberDto: BlockRoomMemberDto, @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth?.user;

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        const adminId = await this.roomsService.findAdminByRoom(blockMemberDto.roomId);

        const adminSocket = this.userSocketMap.get(adminId)
        this.server.to(adminSocket.id).emit('blockMember', blockMemberDto);
    }
}


