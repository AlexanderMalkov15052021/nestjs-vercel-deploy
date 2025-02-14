import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { createClient } from 'redis';

import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {

  const redis = await createClient({ url: process.env.REDIS_URL }).connect();

  await redis.set('key', 'value');
  const value = await redis.get('key');

  console.log(value);

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.APPLICATION_PORT ?? 3000);
}
bootstrap();
