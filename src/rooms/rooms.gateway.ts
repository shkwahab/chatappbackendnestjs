import { SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AcceptInviteDto, AcceptRequestDto, BlockRoomMemberDto, CreateRoomDto, DeleteRoomMemberShipDto, JoinRoomDto, MemberRequestRoomDto, MemberRoomDto, RoomDto } from './dto/room.dto';
import { UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RoomsService } from './rooms.service';
import { User } from '@prisma/client';

@WebSocketGateway(5000, {
    namespace: 'rooms',
    cors: {
        origin: "*"
    }
})

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
        // Ensure client is valid
        if (!client || !client.handshake) {
            throw new UnauthorizedException('Client not connected or handshake information missing');
        }

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

    @SubscribeMessage('sentInvitationRequest')
    async sendRequest(@MessageBody() sentInvitation: MemberRequestRoomDto[], @ConnectedSocket() client: Socket) {
        // Ensure client is valid
        if (!client || !client.handshake) {
            throw new UnauthorizedException('Client not connected or handshake information missing');
        }

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

        const inviteuser = await this.dbService.user.findUnique({ where: { id: acceptInviteDto.userId } });

        const socket = this.userSocketMap.get(inviteuser.id)
        this.server.to(socket.id).emit("acceptInvitation", {
            inviteuser
        })


    }


    @SubscribeMessage('acceptRequest')
    async acceptRequest(@MessageBody() acceptRequestDto: AcceptRequestDto, @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth?.user; // Use optional chaining

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }


        const acceptuser = await this.dbService.user.findUnique({ where: { id: acceptRequestDto.userId } })

        console.log("trigger hoy gi ha request wali")


        const requestRoomUser = await this.dbService.user.findMany({
            where: {
                roomMemberships: {
                    some: {
                        id: acceptRequestDto.roomId
                    }
                }
            }
        })
        for (const roomUser of requestRoomUser) {
            const socket = this.userSocketMap.get(roomUser.id);
            if (socket) {
                this.server.to(socket.id).emit('acceptRequest', {
                    roomId: acceptRequestDto.roomId,
                    senderId: acceptRequestDto.userId,
                    message: acceptuser.name + " has joined the room"
                });
            }
        }

    }

    @SubscribeMessage('rejectInvitation')
    async rejectInvitation(@MessageBody() rejectInvitationDto: AcceptRequestDto, @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth?.user; // Use optional chaining
        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }
        const socketUser = this.userSocketMap.get(rejectInvitationDto.userId)
        if (socketUser) {
            this.server.to(socketUser.id).emit('rejectInvitation', rejectInvitationDto);
        }
    }

    @SubscribeMessage('blockUnblockMember')
    async blockUnblockMember(@MessageBody() blockUnblockMemberDto: BlockRoomMemberDto, @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth?.user;

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }
        const SocketUser = this.userSocketMap.get(blockUnblockMemberDto.userId)

        this.server.to(SocketUser.id).emit('blockUnblockMember', blockUnblockMemberDto);
    }
    @SubscribeMessage('leaveRoom')
    async leaveRoom(@MessageBody() leaveRoomDto: DeleteRoomMemberShipDto, @ConnectedSocket() client: Socket) {
        const user = client.handshake.auth?.user;

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }
        const roomUsers = await this.dbService.user.findMany({
            where: {
                roomMemberships: {
                    some: {
                        roomId: leaveRoomDto.roomId
                    }
                }
            }
        });

        for (const roomUser of roomUsers) {
            const socket = this.userSocketMap.get(roomUser.id);
            if (socket) {
                this.server.to(socket.id).emit('leaveRoom', {
                    roomId: leaveRoomDto.roomId,
                    senderId: user.id,
                    message: `${leaveRoomDto.userId} user id has left the user`
                });
            }
        }
    }
}


