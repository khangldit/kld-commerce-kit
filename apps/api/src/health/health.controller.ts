import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Liveness probe. Also used by the web app to wake the API from a cold start.',
  })
  @ApiOkResponse({ description: 'API and database are up' })
  @ApiServiceUnavailableResponse({ description: 'Database is down' })
  check() {
    return this.healthService.check();
  }
}
