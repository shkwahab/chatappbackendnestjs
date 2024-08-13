import { ApiProperty } from '@nestjs/swagger';

export class UploadImageRequestDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The image file to upload',
  })
  file: any; // `any` type for file upload
}
