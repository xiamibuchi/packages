import { Controller, Get, HttpCode } from '@nestjs/common';
// @ts-ignore
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health-check')
  @HttpCode(200)
  healthCheck(): string {
    return this.appService.healthCheck();
  }
}
