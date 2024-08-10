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