import { Injectable, NotFoundException } from '@nestjs/common'
import { hash } from 'argon2'

import { UpdateUserDto } from './dto/update-user.dto'
import { pool } from '../db/pool.module'
import { AuthMethod } from 'src/libs/common/types';

/**
 * Сервис для работы с пользователями.
 */
@Injectable()
export class UserService {

	public async findById(id: string) {

		// const user = await this.prismaService.user.findUnique({
		// 	where: {
		// 		id
		// 	},
		// 	include: {
		// 		accounts: true
		// 	}
		// })

		const userReq = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);

		if (!userReq.rows[0]) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенные данные.'
			)
		}

		return userReq.rows[0];
	}

	// установить ограничение, удаляет только администратор

	public async getAllUsers() {

		const userReq = await pool.query(`SELECT * FROM users`);

		if (!userReq.rows.length) {
			throw new NotFoundException(
				'Пользователи не найдены. Таблица пуста.'
			)
		}

		return userReq.rows;
	}

	public async deleteAllUsers() {

		await pool.query(`DELETE FROM users`);

		return true;
	}

	public async findByEmail(email: string) {
		// const user = await this.prismaService.user.findUnique({
		// 	where: {
		// 		email
		// 	},
		// 	include: {
		// 		accounts: true
		// 	}
		// })

		const userReq = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

		return userReq.rows[0];
	}

	/**
	 * Создает нового пользователя.
	 * @param email - Email пользователя.
	 * @param password - Пароль пользователя.
	 * @param displayName - Отображаемое имя пользователя.
	 * @param picture - URL аватара пользователя.
	 * @param method - Метод аутентификации пользователя.
	 * @param isVerified - Флаг, указывающий, подтвержден ли email пользователя.
	 * @returns Созданный пользователь.
	 */
	public async create(
		email: string,
		password: string,
		displayName: string,
		picture: string,
		method: AuthMethod,
		isVerified: boolean
	) {
		// const user = await this.prismaService.user.create({
		// 	data: {
		// 		email,
		// 		password: password ? await hash(password) : '',
		// 		displayName,
		// 		picture,
		// 		method,
		// 		isVerified
		// 	},
		// 	include: {
		// 		accounts: true
		// 	}
		// })

		const userReq = await pool.query(
			`INSERT INTO users (email, password, display_name, picture, method, is_verified) values ($1, $2, $3, $4, $5, $6) RETURNING *`,
			[email, password ? await hash(password) : '', displayName, picture, method, isVerified]
		)

		return userReq.rows[0]
	}

	/**
	 * Обновляет данные пользователя.
	 * @param userId - ID пользователя.
	 * @param dto - Данные для обновления пользователя.
	 * @returns Обновленный пользователь.
	 */
	public async update(userId: string, dto: UpdateUserDto) {
		const user = await this.findById(userId)

		// const updatedUser = await this.prismaService.user.update({
		// 	where: {
		// 		id: user.id
		// 	},
		// 	data: {
		// 		email: dto.email,
		// 		displayName: dto.name,
		// 		isTwoFactorEnabled: dto.isTwoFactorEnabled
		// 	}
		// })

		const updatedUserReq = await pool.query(
			`UPDATE users SET email = $1, display_name = $2, is_two_factor_enabled = $3  WHERE id = $4`,
			[dto.email, dto.name, dto.isTwoFactorEnabled, user.id]
		);

		return updatedUserReq.rows[0];
	}
}
