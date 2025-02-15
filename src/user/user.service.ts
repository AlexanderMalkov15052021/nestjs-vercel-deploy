import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { hash } from 'argon2'

import { UpdateUserDto } from './dto/update-user.dto'
import { pool } from '../db/pool.module';

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

		// if (!user) {
		// 	throw new NotFoundException(
		// 		'Пользователь не найден. Пожалуйста, проверьте введенные данные.'
		// 	)
		// }

		return `user`
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
		method: "",
		// method: AuthMethod,
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

		return 1
	}

	/**
	 * Обновляет данные пользователя.
	 * @param userId - ID пользователя.
	 * @param dto - Данные для обновления пользователя.
	 * @returns Обновленный пользователь.
	 */
	public async update(userId: string, dto: UpdateUserDto) {
		// const user = await this.findById(userId)

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

		return 1
	}
}
