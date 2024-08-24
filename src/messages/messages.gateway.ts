import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { ReadMessageDto, SendMessageDto, UpdateMessageDto } from './dto/messageDto';

@WebSocketGateway(5000, {
  cors: {
    origin: "*"
  },
  namespace: "messages"
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;
  private userSocketMap: Map<string, Socket> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) { }

  async handleConnection(client: Socket) {
    const authHeader = client.handshake.headers.authorization;
    if (!authHeader) {
      client.disconnect();
      throw new UnauthorizedException('Authorization header not provided');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      client.disconnect();
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.ACCESS_SECRET_KEY,
      });
      client.handshake.auth = { user: payload };
      this.userSocketMap.set(payload.id, client);
      console.log(client.id)
    } catch (error) {
      client.disconnect();
      console.log(error)
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

  @SubscribeMessage('sendMessage')
  async sendMessage(@MessageBody() sendMessage: SendMessageDto, @ConnectedSocket() client: Socket) {
    if (!client.handshake || !client.handshake.auth) {
      throw new UnauthorizedException('Client not connected or handshake information missing');
    }

    const user: User = client.handshake.auth.user;

    // Check if the user is a member of the room
    const isMember = await this.databaseService.roomMembership.findFirst({
      where: {
        roomId: sendMessage.roomId,
        userId: user.id,
      },
    });
    if (!isMember) {
      return;
    }

    const roomUsers = await this.databaseService.user.findMany({
      where: {
        roomMemberships: {
          some: {
            roomId: sendMessage.roomId
          }
        }
      }
    });

    for (const roomUser of roomUsers) {
      const socket = this.userSocketMap.get(roomUser.id);
      if (socket) {
        this.server.to(socket.id).emit('receiveMessage', {
          roomId: sendMessage.roomId,
          senderId: user.id,
          message: sendMessage.message
        });
      }
    }
  }
  @SubscribeMessage('editMessage')
  async editMessage(@MessageBody() editMessageDto: UpdateMessageDto, @ConnectedSocket() client: Socket) {
    if (!client.handshake || !client.handshake.auth) {
      throw new UnauthorizedException('Client not connected or handshake information missing');
    }

    const user: User = client.handshake.auth.user;

    // Check if the user is a member of the room
    const isMember = await this.databaseService.roomMembership.findFirst({
      where: {
        roomId: editMessageDto.roomId,
        userId: user.id,
      },
    });
    if (!isMember) {
      return;
    }

    const roomUsers = await this.databaseService.user.findMany({
      where: {
        roomMemberships: {
          some: {
            roomId: editMessageDto.roomId
          }
        }
      }
    });

    for (const roomUser of roomUsers) {
      const socket = this.userSocketMap.get(roomUser.id);
      if (socket) {
        this.server.to(socket.id).emit('editMessage', {
          roomId: editMessageDto.roomId,
          senderId: user.id,
          message: editMessageDto.message
        });
      }
    }
  }

  @SubscribeMessage('unReadMessage')
  async unReadMessage(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    const user: User = client.handshake.auth.user;
    if (!client || !client.handshake || !client.handshake.auth) {
      throw new UnauthorizedException('Client not connected or handshake information missing');
    }
    const getAllRoomMembers = await this.databaseService.user.findMany({
      where: {
        roomMemberships: {
          some: {
            roomId
          }
        }
      }
    });

    for (const member of getAllRoomMembers) {
      if (member.id === user.id) continue;

      const socket = this.userSocketMap.get(member.id);
      if (socket) {
        this.server.to(socket.id).emit("unReadMessage", "You got the message");
      }
    }
  }

  @SubscribeMessage('readMessages')
  async readMessages(@MessageBody() readMessages: ReadMessageDto[], @ConnectedSocket() client: Socket) {
    const user: User = client.handshake.auth.user;
    if (!client || !client.handshake || !client.handshake.auth) {
      throw new UnauthorizedException('Client not connected or handshake information missing');
    }
    const socketUser = this.userSocketMap.get(user.id);

    if (socketUser) {
      this.server.to(socketUser.id).emit("readMessages", readMessages);
    }
  }
}
