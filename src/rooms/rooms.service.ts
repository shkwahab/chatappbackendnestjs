import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { AcceptInviteDto, AcceptRequestDto, BlockRoomMemberDto, CreateRoomDto, DeleteRoomMemberShipDto, JoinRoomDto, MemberRequestRoomDto, MemberRoomDto } from './dto/room.dto';
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
          deletedAt: null
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



  async findAll(page: number = 1, user: User) {
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
      // Get total count of rooms
      const totalCount = await this.databaseService.rooms.count({
        where: {
          roomMemberships: {
            some: {
              deletedAt: null
            }
          }
        }
      });

      // Fetch rooms with pagination
      const rooms = await this.databaseService.rooms.findMany({
        skip,
        take: limit,
        where: {
          roomMemberships: {
            some: {
              deletedAt: null
            }
          }
        },
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

          // Fetch the unread messages count for the current user
          const unread = await this.databaseService.messageStatus.count({
            where: {
              roomId: room.id,
              userId: user.id,
              isRead: false
            }
          });

          const lastMessage = lastMessageMemberShip && lastMessageMemberShip.messageId
            ? await getLastMessage(lastMessageMemberShip.messageId)
            : null;
          return {
            ...room,
            lastMessage,
            unread
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
              isApproved: true,
              deletedAt: null
            },
          },
        },
      });


      const allRooms = await this.databaseService.rooms.findMany({
        where: {
          roomMemberships: {
            some: {
              userId: id,
              isApproved: true,
              deletedAt: null
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

          const actions = await this.databaseService.roomMembership.count({
            where: {
              roomId: room.id,
              request: "INVITATION",
              isApproved: false,
              role: "USER"
            }
          })
          // Fetch the last message if it exists
          const lastMessage = lastMessageMemberShip && lastMessageMemberShip.messageId
            ? await getLastMessage(lastMessageMemberShip.messageId)
            : null;

          // Return the room details with lastMessage and unread count
          return {
            ...room,
            lastMessage,
            unread, // Add unread count to the response
            actions
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
              isApproved: true,
              deletedAt: null
            }
          }
        },
        select: {
          id: true,
          name: true,
          img: true,
          email: true,
          username: true,
          createdAt: true,
          updatedAt: true,
          roomMemberships: {
            where: {
              roomId: id,
              isApproved: true,
              deletedAt: null
            },
            select: {
              createdAt: true,
              userId: true
            },

          }
        }
      });


      const actions = await this.databaseService.roomMembership.findMany({
        where: {
          roomId: room.id,
          request: "INVITATION",
          isApproved: false,
          role: "USER"
        },
        include: {
          user: {
            select: {
              username: true,
              img: true
            }
          }
        }
      })

      if (!room) {
        throw new BadRequestException("No Room Found");
      }
      const roomMemberships = await this.databaseService.roomMembership.findMany({
        where: {
          roomId: room.id,
          isApproved: true,
          deletedAt: null
        },
        include: {
          user: {
            select: {
              id: true,
              username: true
            },
          },
        },
      });

      const oldRoomMemberships = await this.databaseService.roomMembership.findMany({
        where: {
          roomId: room.id,
          isApproved: true,
          deletedAt: {
            not: null, // Ensure we are filtering memberships where deletedAt is not null
          },
        },

        select: {
          deletedAt: true,
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
      });

      const oldUsers = oldRoomMemberships.filter(membership => membership.deletedAt).map((membership => membership))

      const blockMembers = roomMemberships.filter(membership => membership.isBlocked).map(membership => membership.user);
      const structuredRoomUsers = roomusers.map(user => {
        const membership = user.roomMemberships.length > 0 ? user.roomMemberships[0] : null;
        return {
          ...user,
          roomMemberships: membership
        };
      });
      return { room, users: structuredRoomUsers, actions, blockMembers, oldUsers };
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


  async rejectInvitation(rejectInvitationDto: AcceptInviteDto, user: User) {
    if (rejectInvitationDto.adminId === user.id) {
      await this.databaseService.roomMembership.delete({
        where: {
          roomId_userId: {
            roomId: rejectInvitationDto.roomId,
            userId: rejectInvitationDto.userId
          }
        }
      })
    }
  }

  async remove(id: string) {
    try {
      const room = await this.databaseService.rooms.findUnique({ where: { id } });
      if (!room) {
        throw new NotFoundException("Invalid Room Id");
      }
      // await this.databaseService.messageStatus.deleteMany({
      //   where: {
      //     roomId: room.id
      //   }
      // })
      // await this.databaseService.messageMemberShip.deleteMany({
      //   where: {
      //     roomId: room.id
      //   }
      // })
      // await this.databaseService.roomMembership.deleteMany({
      //   where: {
      //     roomId: room.id
      //   }
      // })
      await this.databaseService.rooms.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      });
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
    console.log(joinRoomDto);

    // Find the room by ID
    const room = await this.databaseService.rooms.findUnique({
      where: { id: joinRoomDto.roomId }
    });

    if (!room) {
      throw new Error('Room not found');
    }

   

    const roomMembership = await this.databaseService.roomMembership.upsert({
      where: {
        roomId_userId: {
          userId: joinRoomDto.userId,
          roomId: joinRoomDto.roomId,
        }
      },
      update: {
        role: joinRoomDto.role || "USER",
        request: room.isPublic ? "NONE" : "INVITATION",
        isApproved: room.isPublic ? true : false
      },
      create: {
        userId: joinRoomDto.userId,
        roomId: joinRoomDto.roomId,
        role: "USER",
        request: room.isPublic ? "NONE" : "INVITATION",
        isApproved: room.isPublic ? true : false
      }
    });


    // Notify admin if the room is not public
    if (!room.isPublic) {
      const receiverId = await this.findAdminByRoom(joinRoomDto.roomId);
      const receiver = await this.databaseService.user.findUnique({ where: { id: receiverId } });

      const notification = await this.databaseService.notifications.create({
        data: {
          event: "joinRoom",
          senderId: joinRoomDto.userId,
          message: `${receiver.name} requested to join the group`,
          type: "Action",
          url: "/rooms/join"
        }
      });
      await this.databaseService.notificationReceivers.create({
        data: { notificationId: notification.id, receiverId }
      });

      const notifierUrl = process.env.SITE_URL;
      await this.notifierService.sendPushNotification(notification.id, notifierUrl);
    }

    return roomMembership;
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
          data: { isApproved: true,deletedAt:null }
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

  async acceptRoomRequest(acceptRequstDto: AcceptRequestDto, currentUser: User) {
    try {
      if (currentUser.id === currentUser.id) {
        const updateMembership = await this.databaseService.roomMembership.update({
          where: {
            roomId_userId: {
              roomId: acceptRequstDto.roomId,
              userId: acceptRequstDto.userId
            }
          },
          data: {
            isApproved: true,
            deletedAt: null
          }
        })
        const room = await this.databaseService.rooms.findUnique({
          where: {
            id: acceptRequstDto.roomId
          }
        })
        const sender = await this.databaseService.user.findUnique({
          where: {
            id: acceptRequstDto.userId
          }
        })
        const receiver = await this.databaseService.user.findUnique({
          where: {
            id: room.adminId
          }
        })

        const notification = await this.databaseService.notifications.create({
          data: {
            type: "Message",
            senderId: acceptRequstDto.userId,
            message: `${sender.name} has accepted your request to join the ${room.name} ${room.isPublic ? "community" : "group"} `,
            event: "acceptRequest"
          }
        })

        await this.databaseService.notificationReceivers.create({
          data: {
            notificationId: notification.id,
            receiverId: receiver.id
          }
        })

        const notifierUrl = process.env.SITE_URL
        await this.notifierService.sendPushNotification(notification.id, notifierUrl)

        return updateMembership
      }
      throw new BadRequestException("Dont have right to update other users request")

    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async blockUnblockMember(adminId: string, blockRoomMemberDto: BlockRoomMemberDto) {
    try {
      const admin = await this.findAdminByRoom(blockRoomMemberDto.roomId)
      const sender = await this.databaseService.user.findUnique({ where: { id: admin } })
      if (admin === adminId) {
        const blockUser = await this.databaseService.roomMembership.update({
          data: {
            userId: blockRoomMemberDto.userId,
            roomId: blockRoomMemberDto.roomId,
            isBlocked: blockRoomMemberDto.isBlocked
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
            event: "blockUnblockMember",
            senderId: admin,
            message: `${sender.name} has ${blockRoomMemberDto.isBlocked ? "blocked" : "unBlock"}  you`,
            url: "/rooms/blockUnblockMember"
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

  async deleteRoomMemberShip(deleteMemberShipDto: DeleteRoomMemberShipDto) {
    try {
      const deleteMembership = await this.databaseService.roomMembership.delete({
        where: {
          roomId_userId: {
            roomId: deleteMemberShipDto.roomId,
            userId: deleteMemberShipDto.userId
          }
        }
      })
      return deleteMembership
    } catch (error) {
      throw new BadRequestException(error)
    }
  }
}


