import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, UserDto } from './dto/user.dto';


@ApiTags("users")
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }


  @Post()
  @ApiOperation({ summary: 'Create a new user' }) // Description of the endpoint
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully.' }) // Success response
  @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
  create(@Body() createUserDto: Prisma.UserCreateInput) {
    return this.usersService.create(createUserDto);
  }
  
  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users',type:[UserDto] })
  @ApiBearerAuth() 
  @ApiResponse({ status: 401, description: 'UnAuthorized.' }) // Forbidden
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User object',type:UserDto })
  @ApiBearerAuth()
  @ApiResponse({ status: 401, description: 'UnAuthorized.' }) // Forbidden
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
  
  @UseGuards(AuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' }) // Description of the endpoint
  @ApiBody({ type: UpdateUserDto })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'User update successfully.' }) // Success response
  @ApiResponse({ status: 400, description: 'Bad Request.' }) // Error response
  update(@Param('id') id: string, @Body() updateUserDto: Prisma.UserUpdateInput) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User deleted succesfully' })
  @ApiBearerAuth()
  @ApiResponse({ status: 401, description: 'UnAuthorized.' }) // Forbidden
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
