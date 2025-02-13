import { Injectable, Res } from '@nestjs/common';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { Response } from 'express';

dotenv.config();

@Injectable()
export class AppService {
  async getHello(): Promise<string> {

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL ? true : false
    });

    const users = await pool.query(`SELECT * FROM person`)

    return JSON.stringify({ res: "test", data: users.rows });
  }
}
