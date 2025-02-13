import { Injectable, Res } from '@nestjs/common';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { Response } from 'express';
import { pool } from './db/pool.module';

dotenv.config();

@Injectable()
export class AppService {
  async getHello(): Promise<string> {

    const users = await pool.query(`SELECT * FROM person`)

    return JSON.stringify({ res: "test!", data: users.rows });
  }
}
