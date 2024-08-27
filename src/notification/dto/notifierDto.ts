import { IsJSON, IsNotEmpty, IsString } from "class-validator";

export type Key = {
    p256dh: string
    auth: string
}

export class SubscriptionDto {
    @IsString()
    id?: string
    @IsString()
    @IsNotEmpty()
    userId: string
    @IsString()
    @IsNotEmpty()
    endpoint: string
    @IsJSON()
    @IsNotEmpty()
    keys: Key
    @IsString()
    userAgent?: string
    @IsString()
    deviceId?: string
}




import { ApiProperty } from '@nestjs/swagger';

class NotificationSenderDto {
  @ApiProperty({ example: '66b589446e18e3438b78cbcd' })
  id: string;

  @ApiProperty({ example: 'ali' })
  name: string;

  @ApiProperty({ example: 'ali123' })
  username: string;

  @ApiProperty({
    example: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
  })
  img: string;
}


export class NotificationDto {
  @ApiProperty({ example: '66b5978b819ac58ea33f2959' })
  id: string;

  @ApiProperty({ example: 'Abdul Wahab requested to join the group' })
  message: string;

  @ApiProperty({ example: 'joinRoom' })
  event: string;

  @ApiProperty({ example: 'Action' })
  type: string;

  @ApiProperty({ example: '/rooms/join' })
  url: string;

  @ApiProperty({ example: '66b589446e18e3438b78cbcd' })
  senderId: string;

  @ApiProperty({ example: '2024-08-09T04:14:03.474Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-08-09T04:14:03.474Z' })
  updatedAt: string;

  @ApiProperty({ type: NotificationSenderDto })
  sender: NotificationSenderDto;
}
