import { Injectable, UnauthorizedException } from '@nestjs/common'
import { pool } from '../db/pool.module';
import { UpdateUserDto } from './dto/update-user.dto';
import { verify } from 'argon2'

/**
 * Сервис для работы с пользователями.
 */
@Injectable()
export class UserService {

    /**
     * Создает нового пользователя.
     * @param name - Имя пользователя.
     * @param surname - Фамилия пользователя.
     * @returns Созданный пользователь.
     */
    public async create(
        req: Request, dto: UpdateUserDto
    ) {

        // const isValidPassword = await verify(dto.name, dto.surname);

        // if (!isValidPassword) {
        //     throw new UnauthorizedException(
        //         'Неверный пароль. Пожалуйста, попробуйте еще раз или восстановите пароль, если забыли его.'
        //     )
        // }

        const nwePerson = await pool.query(
            `INSERT INTO person (name, surname) values ($1, $2) RETURNING *`,
            [dto.name, dto.surname]
        )

        return nwePerson
    }
}
