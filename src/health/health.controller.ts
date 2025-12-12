import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'GPG Backend API is running',
      timestamp: new Date().toISOString(),
    };
  }
}

