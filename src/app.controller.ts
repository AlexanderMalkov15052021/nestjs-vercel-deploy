import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  public async getHello() {
    return this.appService.getHello();
  }

  @Post()
  saveInfo(@Body() body: any) {
    return {
      ...body
    };
  }
}
