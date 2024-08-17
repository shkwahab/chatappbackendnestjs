import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { IsNotEmpty, IsString } from "class-validator";

export class MemberRoomDto {
  @ApiProperty({
    required: false
  })
  userId: string
}
export class MemberRequestRoomDto {
  @ApiProperty()
  userId: string
  @ApiProperty()
  roomId: string
}
export class CreateRoomDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
  @ApiProperty({
    required: false
  })
  img?: string;
  @ApiProperty({
    required: false
  })
  isPublic?: boolean
  createdAt?: Date;
  updatedAt?: Date;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  adminId: string;
  messageMembership?: Prisma.MessageMemberShipCreateNestedManyWithoutRoomInput;
  roomMemberships?: Prisma.RoomMembershipCreateNestedManyWithoutRoomInput;
}
export class CreateRoomWithMembersDto {
  @ApiProperty({ type: CreateRoomDto })
  room: CreateRoomDto;

  @ApiProperty({ type: [MemberRoomDto], required: false })
  members?: MemberRoomDto[];
}


export class RoomDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  img: string;
  @ApiProperty()
  adminId: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
export class RoomsInviationDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  userId: string;
  @ApiProperty()
  roomId: string;
  @ApiProperty()
  role: "ADMIN" | "USER";
  @ApiProperty()
  isBlocked: boolean;
  @ApiProperty()
  isApproved: boolean;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}



export class GetRoomDto {
  @ApiProperty()
  count: number;
  @ApiProperty()
  next: string | null;
  @ApiProperty()
  previous: string | null;

  @ApiProperty({
    type: [Object], // Indicating it's an array of objects
    description: 'Array of room objects',
  })
  result: {
    id: string;
    name: string;
    img: string;
    adminId: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date | null;
    lastMessage: string | null;
  }[];
}


export class JoinRoomDto {
  id?: string
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  userId: string;
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  roomId: string;
  @ApiProperty({
    required: false
  })
  isBlocked?: boolean;
  @ApiProperty({
    required: false
  })
  isApproved?: boolean;
}


export class AcceptInviteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  adminId: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  userId: string;
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  roomId: string;
}

export class BlockRoomMemberDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  userId: string;
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  roomId: string;
}


export class RoomsUpdateDto {
  @ApiProperty({ required: false })
  name?: string
  @ApiProperty({ required: false })
  img?: string
  @ApiProperty({ required: false })
  isPublic?: boolean
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  adminUser?: Prisma.UserUpdateOneRequiredWithoutAdminRoomsNestedInput
  messageMembership?: Prisma.MessageMemberShipUpdateManyWithoutRoomNestedInput
  messageStatuses?: Prisma.MessageStatusUpdateManyWithoutRoomNestedInput
  roomMemberships?: Prisma.RoomMembershipUpdateManyWithoutRoomNestedInput
}


export class AcceptRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roomId: string
}