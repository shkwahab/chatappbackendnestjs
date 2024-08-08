import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';


@WebSocketGateway({ namespace: "message" })
export class MessagesGateway {
  @WebSocketServer()
  server: Server;
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
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) { }


  @SubscribeMessage('sendMessage')
  async sendMessage(@MessageBody() sendMessage: { roomId: string, senderId: string, message: string }, @ConnectedSocket() client: Socket) {
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

    this.server.to(sendMessage.roomId).emit('receiveMessage', {
      roomId: sendMessage.roomId,
      senderId: user.id,
      message: sendMessage.message
    });
  }
}
