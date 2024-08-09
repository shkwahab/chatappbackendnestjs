import { Prisma } from "@prisma/client";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  img?: string;
  isPublic?: boolean
  createdAt?: Date;
  updatedAt?: Date;
  @IsNotEmpty()
  @IsString()
  adminId: string;
  messageMembership?: Prisma.MessageMemberShipCreateNestedManyWithoutRoomInput;
  roomMemberships?: Prisma.RoomMembershipCreateNestedManyWithoutRoomInput;
}

export class RoomDto {
  id: string;
  name: string;
  img: string;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
}


export class JoinRoomDto {
  id?: string
  @IsString()
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  @IsString()
  roomId: string;
  role?: "USER" | "ADMIN";
  isBlocked?: boolean;
  isApproved?: boolean;
}


export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  adminId: string;
  @IsString()
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  @IsString()
  roomId: string;
}

export class BlockRoomMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  @IsString()
  roomId: string;
}