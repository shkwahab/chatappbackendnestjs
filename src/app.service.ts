import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  sayHi(): Object {
    return {message:"Welcome to the Chatapp"}
  }
}
