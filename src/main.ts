import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { createClient } from 'redis';

import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await createClient({ url: process.env.REDIS_URL }).connect();

  await app.listen(process.env.APPLICATION_PORT ?? 3000);
}
bootstrap();
