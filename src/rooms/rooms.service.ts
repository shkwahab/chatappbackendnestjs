import { BadRequestException, Injectable, NotFoundException, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { AcceptInviteDto, BlockRoomMemberDto, CreateRoomDto, JoinRoomDto } from './dto/room.dto';

@Injectable()
export class RoomsService {
  public constructor(
    private readonly databaseService: DatabaseService,
  ) { }

  async create(createRoomDto: CreateRoomDto) {
    try {
      const room = await this.databaseService.rooms.create({
        data: createRoomDto,
      });
      await this.databaseService.roomMembership.create({
        data: { roomId: room.id, userId: room.adminId, isApproved: true }
      })
      return room
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }


  async findAll() {
    try {
      return await this.databaseService.rooms.findMany()
    }
    catch (error) {
      console.log(error)
      throw new BadRequestException(error)
    }
  }

  async findAllAdminRooms(@Param("id") id: string) {
    try {
      return await this.databaseService.rooms.findMany(
        {
          where: { adminId: id }
        }
      )
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error)
    }
  }

  async findOne(id: string) {
    try {
      const room = await this.databaseService.rooms.findUnique({
        where: { id }
      });
      if (!room) {
        throw new BadRequestException("No Room Found");
      }
      return room;
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error)
    }
  }

  async update(id: string, updateRoomDto: Prisma.RoomsUpdateInput) {
    try {
      const room = await this.databaseService.rooms.findUnique({
        where: { id }
      });
      if (!room) {
        throw new BadRequestException("No Room Found");
      }
      return await this.databaseService.rooms.update({
        where: { id },
        data: { ...updateRoomDto, updatedAt: new Date() }
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async remove(id: string) {
    try {
      const room = await this.databaseService.rooms.findUnique({ where: { id } });
      if (!room) {
        throw new NotFoundException("Invalid Room Id");
      }
      await this.databaseService.rooms.delete({ where: { id } });
      return { message: "deleted successfully" };
    } catch (error) {
      throw new BadRequestException("Failed to Delete");
    }
  }

  async findAdminByRoom(id: string) {
    try {
      const room = await this.databaseService.rooms.findUnique({ where: { id } })
      return room.adminId;
    } catch (error) {
      console.log(error)
    }
  }

  async joinRoom(joinRoomDto: JoinRoomDto) {
    const roomMembership = this.databaseService.roomMembership.create({
      data: joinRoomDto
    })
    const receiverId = await this.findAdminByRoom(joinRoomDto.roomId)
    const receiver = await this.databaseService.user.findUnique({ where: { id: receiverId } })

    const notification = await this.databaseService.notifications.create({
      data: {
        event: "joinRoom",
        senderId: joinRoomDto.userId,
        message: `${receiver.name} requested to join the group`,
        type: "Action",
        url: "/rooms/join",

      }
    })
    await this.databaseService.notificationReceivers.create({
      data: { notificationId: notification.id, receiverId }
    })
    return roomMembership
  }

  async acceptInvitation(adminId: string, acceptInviteDto: AcceptInviteDto) {
    try {
      const room = await this.databaseService.rooms.findUnique({ where: { id: acceptInviteDto.roomId } })
      const sender = await this.databaseService.user.findUnique({ where: { id: adminId } })

      if (room.adminId === adminId) {
        const updateRoomMembership = await this.databaseService.roomMembership.update({
          where: { roomId: acceptInviteDto.roomId, userId: acceptInviteDto.userId },
          data: { isApproved: true }
        })
        return updateRoomMembership;
      }

      await this.databaseService.notifications.create({
        data: {
          event: "acceptInvite",
          senderId: acceptInviteDto.userId,
          message: `${sender.name} has accepted your invitation`,
          type: "Action",
          url: "/rooms/acceptInvite"
        }
      })

    } catch (error) {

    }
  }

  async findAllRoomsInvitation(roomId: string) {
    try {
      const invitationRequests = await this.databaseService.roomMembership.findMany({
        where: { roomId: roomId }
      })
      return invitationRequests
    } catch (error) {
      throw new BadRequestException("failed to find any request")
    }
  }
  async blockRoomUser(adminId: string, blockRoomMemberDto: BlockRoomMemberDto) {
    try {
      const admin = await this.findAdminByRoom(blockRoomMemberDto.roomId)
      const sender = await this.databaseService.user.findUnique({ where: { id: admin } })
      if (admin === adminId) {
        const blockUser = await this.databaseService.roomMembership.update({
          data: {
            userId: blockRoomMemberDto.userId,
            roomId: blockRoomMemberDto.roomId,
            isBlocked: true
          },
          where: { roomId: blockRoomMemberDto.roomId }
        })
        await this.databaseService.notifications.create({
          data: {
            type: "Action",
            event: "blockMember",
            senderId: admin,
            message: `${sender.name} has blocked you`,
            url: "/rooms/blockMember"
          }
        })
        return blockUser
      }

      throw new BadRequestException("Only Admin has right to block the group user")
    } catch (error) {
      throw new BadRequestException("Only Admin has right to block the group user")
    }
  }
}

