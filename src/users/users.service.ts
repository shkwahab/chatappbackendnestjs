import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly datbaseService: DatabaseService) { }
  async create(createUserDto: Prisma.UserCreateInput) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.datbaseService.user.create({
      data: { ...createUserDto, password: hashedPassword }
    })
    const { password, ...createUser } = user;
    return createUser
  }

  async findAll() {
    const users = await this.datbaseService.user.findMany()
    return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  }

  async findOne(id: string) {
    try {
      const user = await this.datbaseService.user.findUnique({
        where: {
          id
        }
      })
      if (!user) {
        throw new BadRequestException("No User Found")
      }
      return (({ password, ...userWithoutPassword }) => userWithoutPassword)(user);
    } catch (error) {
      throw new BadRequestException("No User Found")
    }
  }

  async update(id: string, updateUserDto: Prisma.UserUpdateInput) {
    try {
      const user = this.datbaseService.user.findUnique({ where: { id } })
      if (!user) {
        throw new BadRequestException("User not found")
      }

      const update = await this.datbaseService.user.update({
        where: {
          id
        },
        data: { ...updateUserDto, updatedAt: new Date() }
      });
      const { password, ...updateUser } = update
      return updateUser
    } catch (error) {
      throw new BadRequestException("User not found")
    }
  }

  async remove(id: string) {
    try {
      const user = await this.datbaseService.user.delete({
        where: {
          id
        }
      });
      if (user) {
        return { message: `User Deleted by ${user.id}` }
      }
      throw new BadRequestException("Invalid User")
    } catch (error) {
      throw new BadRequestException("Invalid User")
    }
  }
}
