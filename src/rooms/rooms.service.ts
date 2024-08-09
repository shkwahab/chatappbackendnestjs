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
        data: { roomId: room.id, userId: room.adminId, isApproved: true, role: "ADMIN" }
      })
      return room
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }


  async findAll(page: number = 1) {
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
      // Get total count of rooms
      const totalCount = await this.databaseService.rooms.count();

      // Fetch rooms with pagination
      const rooms = await this.databaseService.rooms.findMany({
        skip,
        take: limit,
      });

      // Fetch the last message for each room
      const roomsWithLastMessage = await Promise.all(
        rooms.map(async (room) => {
          const lastMessage = await this.databaseService.messageMemberShip.findFirst({
            where: { roomId: room.id },
            orderBy: {
              createdAt: "desc"
            }
          });
          return {
            ...room,
            lastMessage,
          };
        }),
      );

      // Construct response
      const response = {
        count: totalCount,
        next: page * limit < totalCount ? `/rooms?page=${page + 1}` : null,
        previous: page > 1 ? `/rooms?page=${page - 1}` : null,
        result: roomsWithLastMessage,
      };

      return response;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to fetch rooms: ' + error.message);
    }
  }

  async findAllAdminRooms(id: string, page: number = 1) {
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
      // Get total count of rooms for the admin
      const totalCount = await this.databaseService.rooms.count({
        where: { adminId: id },
      });

      // Fetch rooms with pagination for the given admin
      const rooms = await this.databaseService.rooms.findMany({
        where: { adminId: id },
        skip,
        take: limit,
      });

      // Fetch the last message for each room
      const roomsWithLastMessage = await Promise.all(
        rooms.map(async (room) => {
          const lastMessage = await this.databaseService.messageMemberShip.findFirst({
            where: { roomId: room.id },
            orderBy: { createdAt: 'desc' },
          });
          return {
            ...room,
            lastMessage,
          };
        }),
      );

      // Construct response
      const response = {
        count: totalCount,
        next: page * limit < totalCount ? `/rooms/admin/${id}?page=${page + 1}` : null,
        previous: page > 1 ? `/admin/rooms/${id}?page=${page - 1}` : null,
        result: roomsWithLastMessage,
      };

      return response;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to fetch admin rooms: ' + error.message);
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
    const roomMembership = await this.databaseService.roomMembership.create({
      data: {
        userId: joinRoomDto.userId,
        roomId: joinRoomDto.roomId
      }
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

  async acceptInvitation(acceptInviteDto: AcceptInviteDto) {
    try {
      const room = await this.databaseService.rooms.findUnique({ where: { id: acceptInviteDto.roomId } })
      const sender = await this.databaseService.user.findUnique({ where: { id: acceptInviteDto.adminId } })

      if (room.adminId === acceptInviteDto.adminId) {
        const updateRoomMembership = await this.databaseService.roomMembership.update({
          where: { roomId: acceptInviteDto.roomId, userId: acceptInviteDto.userId },
          data: { isApproved: true }
        })
        return updateRoomMembership;
      }

      const notification = await this.databaseService.notifications.create({
        data: {
          event: "acceptInvite",
          senderId: acceptInviteDto.userId,
          message: `${sender.name} has accepted your invitation`,
          type: "Action",
          url: "/rooms/acceptInvite"
        }
      })
      await this.databaseService.notificationReceivers.create({
        data: { notificationId: notification.id, receiverId: acceptInviteDto.userId }
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
          where: { roomId: blockRoomMemberDto.roomId, userId: blockRoomMemberDto.userId }
        })
        const notification = await this.databaseService.notifications.create({
          data: {
            type: "Action",
            event: "blockMember",
            senderId: admin,
            message: `${sender.name} has blocked you`,
            url: "/rooms/blockMember"
          }
        })
        await this.databaseService.notificationReceivers.create({
          data: { notificationId: notification.id, receiverId: blockUser.id }
        })
        return blockUser
      }
      throw new BadRequestException("Only Admin has right to block the group user")
    } catch (error) {
      throw new BadRequestException("Only Admin has right to block the group user")
    }
  }
}

