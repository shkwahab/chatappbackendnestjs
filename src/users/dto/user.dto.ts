import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";

export class UserDto {
    @ApiProperty()
    id: string;
    name: string;
    @ApiProperty()
    username: string;
    @ApiProperty()
    img: string;
    @ApiProperty()
    email: string;
    @ApiProperty()
    createdAt: Date;
    @ApiProperty()
    updatedAt: Date | null;
}

export class CreateUserDto {
    id?: string
    @ApiProperty()
    name: string
    @ApiProperty()
    username: string
    img?: string
    @ApiProperty()
    email: string
    @ApiProperty()
    password: string
    createdAt?: Date | string
    updatedAt?: Date | string | null
    roomMemberships?: Prisma.RoomMembershipCreateNestedManyWithoutUserInput
    sentMessages?: Prisma.MessageMemberShipCreateNestedManyWithoutSenderInput
    receivedMessages?: Prisma.MessageMemberShipCreateNestedManyWithoutReceiverInput
    adminRooms?: Prisma.RoomsCreateNestedManyWithoutAdminUserInput
    messageStatuses?: Prisma.MessageStatusCreateNestedManyWithoutUserInput
    notificationSender?: Prisma.NotificationsCreateNestedManyWithoutNotificationSenderInput
    NotificationReceivers?: Prisma.NotificationReceiversCreateNestedManyWithoutReceiverInput
    Notifier?: Prisma.NotifierCreateNestedManyWithoutUserInput
}
export class UpdateUserDto {
    @ApiProperty({
        required: false
    })
    name?:  string
    @ApiProperty({
        required: false
    })
    username?:  string
    @ApiProperty({
        required: false
    })
    img?:  string
    @ApiProperty({
        required: false
    })
    email?:  string
    @ApiProperty({
        required: false
    })
    password?:  string
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    roomMemberships?: Prisma.RoomMembershipUpdateManyWithoutUserNestedInput
    sentMessages?: Prisma.MessageMemberShipUpdateManyWithoutSenderNestedInput
    receivedMessages?: Prisma.MessageMemberShipUpdateManyWithoutReceiverNestedInput
    adminRooms?: Prisma.RoomsUpdateManyWithoutAdminUserNestedInput
    messageStatuses?: Prisma.MessageStatusUpdateManyWithoutUserNestedInput
    notificationSender?: Prisma.NotificationsUpdateManyWithoutNotificationSenderNestedInput
    NotificationReceivers?: Prisma.NotificationReceiversUpdateManyWithoutReceiverNestedInput
    Notifier?: Prisma.NotifierUpdateManyWithoutUserNestedInput
}