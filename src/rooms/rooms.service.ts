import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { AcceptInviteDto, BlockRoomMemberDto, CreateRoomDto, JoinRoomDto, MemberRequestRoomDto, MemberRoomDto } from './dto/room.dto';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class RoomsService {
  public constructor(
    private readonly databaseService: DatabaseService,
    private readonly notifierService: NotificationService
  ) { }

  async create(createRoomDto: CreateRoomDto, memberRoomDto?: MemberRoomDto[]) {
    try {
      // Create the room
      const room = await this.databaseService.rooms.create({
        data: createRoomDto,
      });

      // Find the sender
      const sender = await this.databaseService.user.findUnique({
        where: { id: room.adminId },
      });

      await this.databaseService.roomMembership.create({
        data: {
          roomId: room.id,
          userId: room.adminId,
          isApproved: true,
          role: "ADMIN",
        }
      });


      if (memberRoomDto && memberRoomDto.length > 0) {
        // Create room memberships for the other members
        const promises = memberRoomDto.map(async (item) => {
          return this.databaseService.roomMembership.create({
            data: {
              roomId: room.id,
              userId: item.userId,
              isApproved: false,
              role: "USER",
              request: "REQUEST"
            }

          });
        });
        await Promise.all(promises);

        // Create notifications
        await this.databaseService.notifications.create({
          data: {
            senderId: room.adminId,
            message: `${sender.name} has requested you to join the ${room.name} ${room.isPublic ? "channel" : "group"}`,
            type: "Action",
            url: "/rooms/acceptRequest",
            NotificationReceivers: {
              createMany: {
                data: memberRoomDto.map((item) => ({
                  receiverId: item.userId,
                })),
              },
            },
          },
        });
      }

      return room;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async sendRequest(memberRoomDto: MemberRequestRoomDto[]) {
    try {
      const promises = memberRoomDto.map(async (item) => {
        return this.databaseService.roomMembership.create({
          data: {
            roomId: memberRoomDto[0].roomId,
            userId: item.userId,
            isApproved: false,
            role: "USER",
            request: "REQUEST"
          }

        });
      });
      await Promise.all(promises);

      const room = await this.databaseService.rooms.findUnique({
        where: { id: memberRoomDto[0].roomId }
      })
      const sender = await this.databaseService.user.findUnique({
        where: { id: room.adminId },
      });

      await this.databaseService.notifications.create({
        data: {
          senderId: room.adminId,
          message: `${sender.name} has requested you to join the ${room.name} ${room.isPublic ? "channel" : "group"}`,
          type: "Action",
          url: "/rooms/acceptRequest",
          NotificationReceivers: {
            createMany: {
              data: memberRoomDto.map((item) => ({
                receiverId: item.userId,
              })),
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(error)
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
        include: {
          roomMemberships: true
        }
      });

      const getLastMessage = async (messageId: string | null) => {
        if (messageId) {
          return await this.databaseService.message.findUnique({
            where: {
              id: messageId,
            },
          });
        }
        return null;
      };

      // Fetch the last message for each room
      const roomsWithLastMessage = await Promise.all(
        rooms.map(async (room) => {
          const lastMessageMemberShip = await this.databaseService.messageMemberShip.findFirst({
            where: { roomId: room.id },
            orderBy: {
              createdAt: "desc"
            }
          });
          const lastMessage = lastMessageMemberShip && lastMessageMemberShip.messageId
            ? await getLastMessage(lastMessageMemberShip.messageId)
            : null;
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
  async findAllUserRooms(id: string, page: number = 1, user: User) {
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
      // Get total count of rooms for the user
      const totalCount = await this.databaseService.rooms.count({
        where: {
          roomMemberships: {
            some: {
              userId: id,
              isApproved: true
            },
          },
        },
      });

      // Fetch all rooms for the given user
      const allRooms = await this.databaseService.rooms.findMany({
        where: {
          roomMemberships: {
            some: {
              userId: id,
              isApproved: true
            },
          },
        },
      });

      const getLastMessage = async (messageId: string | null) => {
        if (messageId) {
          return await this.databaseService.message.findUnique({
            where: {
              id: messageId,
            },
          });
        }
        return null;
      };
      // Count Read uncount messages


      const roomsWithLastMessage = await Promise.all(
        allRooms.map(async (room) => {
          // Fetch the last message membership for the room
          const lastMessageMemberShip = await this.databaseService.messageMemberShip.findFirst({
            where: { roomId: room.id },
            orderBy: { createdAt: 'desc' },
          });

          // Fetch the unread messages count for the current user
          const unread = await this.databaseService.messageStatus.count({
            where: {
              roomId: room.id,
              userId: user.id,
              isRead: false
            },
          });

          // Fetch the last message if it exists
          const lastMessage = lastMessageMemberShip && lastMessageMemberShip.messageId
            ? await getLastMessage(lastMessageMemberShip.messageId)
            : null;

          // Return the room details with lastMessage and unread count
          return {
            ...room,
            lastMessage,
            unread, // Add unread count to the response
          };
        }),
      );
      // Sort rooms by last message date (if available) and then by room creation date
      const sortedRooms = roomsWithLastMessage.sort((a, b) => {
        const lastMessageDateA = a.lastMessage?.createdAt || new Date(0); // Default to epoch if no message
        const lastMessageDateB = b.lastMessage?.createdAt || new Date(0); // Default to epoch if no message

        // Sort primarily by last message date
        if (lastMessageDateA < lastMessageDateB) return 1;
        if (lastMessageDateA > lastMessageDateB) return -1;

        // If last message dates are equal, sort by room creation date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Apply pagination to the sorted list
      const paginatedRooms = sortedRooms.slice(skip, skip + limit);

      // Construct response
      const response = {
        count: totalCount,
        next: skip + limit < totalCount ? `/rooms/user/${id}?page=${Number(page) + 1}` : null,
        previous: skip > 0 ? `/rooms/user/${id}?page=${page - 1}` : null,
        result: paginatedRooms,
      };

      return response;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to fetch user rooms: ' + error.message);
    }
  }




  async findOne(id: string) {
    try {
      const room = await this.databaseService.rooms.findUnique({
        where: { id }
      });
      const roomusers = await this.databaseService.user.findMany({
        where: {
          roomMemberships: {
            some: {
              roomId: id,
              isApproved: true
            }
          }
        }
      })

      const users = roomusers.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
      if (!room) {
        throw new BadRequestException("No Room Found");
      }
      return { room, users };
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
      const update = await this.databaseService.rooms.update({
        where: { id },
        data: { ...updateRoomDto, updatedAt: new Date() }
      });
      console.log(update)
      return update
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
      await this.databaseService.messageStatus.deleteMany({
        where: {
          roomId: room.id
        }
      })
      await this.databaseService.messageMemberShip.deleteMany({
        where: {
          roomId: room.id
        }
      })
      await this.databaseService.roomMembership.deleteMany({
        where: {
          roomId: room.id
        }
      })
      await this.databaseService.rooms.delete({ where: { id } });
      return { message: "Deleted successfully" };
    } catch (error) {
      throw new BadRequestException("Failed to Delete" + error);
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
    const room = await this.databaseService.rooms.findUnique({
      where: {
        id: joinRoomDto.roomId
      }
    })
    const roomMembership = await this.databaseService.roomMembership.create({
      data: {
        userId: joinRoomDto.userId,
        roomId: joinRoomDto.roomId,
        request: room.isPublic ? "NONE" : "REQUEST",
        isApproved: room.isPublic ? true : false
      }
    })
    const receiverId = await this.findAdminByRoom(joinRoomDto.roomId)
    const receiver = await this.databaseService.user.findUnique({ where: { id: receiverId } })
    if (!(room.isPublic)) {
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
      const notifierUrl = process.env.SITE_URL
      await this.notifierService.sendPushNotification(notification.id, notifierUrl)
    }

    return roomMembership
  }

  async acceptInvitation(acceptInviteDto: AcceptInviteDto) {
    try {
      const room = await this.databaseService.rooms.findUnique({ where: { id: acceptInviteDto.roomId } })
      const sender = await this.databaseService.user.findUnique({ where: { id: acceptInviteDto.adminId } })

      if (room.adminId === acceptInviteDto.adminId) {
        const updateRoomMembership = await this.databaseService.roomMembership.update({
          where: {
            roomId_userId: {
              userId: acceptInviteDto.userId,
              roomId: acceptInviteDto.roomId
            }
          },
          data: { isApproved: true }
        })
        const notification = await this.databaseService.notifications.create({
          data: {
            senderId: acceptInviteDto.adminId,
            message: `${sender.name} has accepted your request to join the ${room.name} room`,
            type: "Message"
          }
        })
        await this.databaseService.notificationReceivers.create({
          data: {
            notificationId: notification.id,
            receiverId: acceptInviteDto.userId
          }
        })
        const notifierUrl = process.env.SITE_URL
        await this.notifierService.sendPushNotification(notification.id, notifierUrl)
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
      const notifierUrl = process.env.SITE_URL
      await this.notifierService.sendPushNotification(notification.id, notifierUrl)

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
          where: {
            roomId_userId: {
              roomId: blockRoomMemberDto.roomId, userId: blockRoomMemberDto.userId
            }
          }
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
        const notifierUrl = process.env.SITE_URL
        await this.notifierService.sendPushNotification(notification.id, notifierUrl)
        return blockUser
      }
      throw new BadRequestException("Only Admin has right to block the group user")
    } catch (error) {
      throw new BadRequestException("Only Admin has right to block the group user")
    }
  }
}

