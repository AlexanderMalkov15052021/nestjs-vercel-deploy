import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  getHello(): string {
    return 'API for authentication users!';
  }

  getData(): string {
    return '{ "data": "test" }';
  }

}
