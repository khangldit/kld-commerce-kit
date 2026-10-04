import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose, { type Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  check() {
    const dbUp =
      this.connection.readyState === mongoose.ConnectionStates.connected;

    const result = {
      status: dbUp ? 'ok' : 'error',
      db: dbUp ? 'up' : 'down',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };

    if (!dbUp) {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
