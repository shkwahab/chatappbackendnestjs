import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadImageRequestDto } from "./dto"
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { File } from 'multer'; 
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  sayHi(): Object {
    return this.appService.sayHi();
  }


  @ApiBearerAuth()
  @Post('/upload/image')
  @ApiOperation({ summary: 'Upload Single image file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageRequestDto })
  @ApiResponse({ status: 201, description: 'File URL.',example:{img:"imgurl"} })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImg(@UploadedFile() file: Express.Multer.File) {
    return this.appService.uploadImage(file);
  }
}