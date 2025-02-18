import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  public async getHello() {
    return this.appService.getHello();
  }

  @Post()
  public async getData() {
    return this.appService.getData();
  }

}
