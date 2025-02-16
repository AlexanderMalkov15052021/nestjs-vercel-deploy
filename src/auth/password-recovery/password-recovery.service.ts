import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { hash } from 'argon2'
import { v4 as uuidv4 } from 'uuid'

import { MailService } from '../../libs/mail/mail.service'
import { UserService } from '../../user/user.service'

import { NewPasswordDto } from './dto/new-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { pool } from '../../db/pool.module'
import { TokenType } from 'src/libs/common/types'

/**
 * Сервис для управления восстановлением пароля.
 */
@Injectable()
export class PasswordRecoveryService {
	/**
	 * Конструктор сервиса восстановления пароля.
	 * @param userService - Сервис для работы с пользователями.
	 * @param mailService - Сервис для отправки email-сообщений.
	 */
	public constructor(
		private readonly userService: UserService,
		private readonly mailService: MailService
	) { }

	/**
	 * Запрашивает сброс пароля и отправляет токен на указанный email.
	 * @param dto - DTO с адресом электронной почты пользователя.
	 * @returns true, если токен успешно отправлен.
	 * @throws NotFoundException - Если пользователь не найден.
	 */
	public async reset(dto: ResetPasswordDto) {
		const existingUser = await this.userService.findByEmail(dto.email)

		if (!existingUser) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}

		const passwordResetToken = await this.generatePasswordResetToken(
			existingUser.email
		)

		await this.mailService.sendPasswordResetEmail(
			passwordResetToken.email,
			passwordResetToken.token
		)

		return true
	}

	/**
	 * Устанавливает новый пароль для пользователя.
	 * @param dto - DTO с новым паролем.
	 * @param token - Токен для сброса пароля.
	 * @returns true, если пароль успешно изменен.
	 * @throws NotFoundException - Если токен или пользователь не найден.
	 * @throws BadRequestException - Если токен истек.
	 */
	public async new(dto: NewPasswordDto, token: string) {

		// const existingToken = await this.prismaService.token.findFirst({
		// 	where: {
		// 		token,
		// 		type: TokenType.PASSWORD_RESET
		// 	}
		// })

		const existingTokenReq = await pool.query(`SELECT * FROM tokens WHERE token = $1 and type = $2`, [token, TokenType.PASSWORD_RESET]);

		if (!existingTokenReq.rows[0]) {
			throw new NotFoundException(
				'Токен не найден. Пожалуйста, проверьте правильность введенного токена или запросите новый.'
			)
		}

		const hasExpired = new Date(existingTokenReq.rows[0].expiresIn) < new Date()

		if (hasExpired) {
			throw new BadRequestException(
				'Токен истек. Пожалуйста, запросите новый токен для подтверждения сброса пароля.'
			)
		}

		const existingUser = await this.userService.findByEmail(
			existingTokenReq.rows[0].email
		);

		if (!existingUser) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
			)
		}

		// await this.prismaService.user.update({
		// 	where: {
		// 		id: existingUser.id
		// 	},
		// 	data: {
		// 		password: await hash(dto.password)
		// 	}
		// })

		await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [await hash(dto.password), existingUser.id]);

		// await this.prismaService.token.delete({
		// 	where: {
		// 		id: existingTokenReq.rows[0].id,
		// 		type: TokenType.PASSWORD_RESET
		// 	}
		// })

		await pool.query(`DELETE FROM tokens WHERE id = $1 and type = $2`, [existingTokenReq.rows[0].id, TokenType.PASSWORD_RESET]);

		return true;
	}

	/**
	 * Генерирует токен для сброса пароля.
	 * @param email - Адрес электронной почты пользователя.
	 * @returns Объект токена сброса пароля.
	 */
	private async generatePasswordResetToken(email: string) {
		const token = uuidv4()
		const expiresIn = new Date(new Date().getTime() + 3600 * 1000)

		// const existingToken = await this.prismaService.token.findFirst({
		// 	where: {
		// 		email,
		// 		type: TokenType.PASSWORD_RESET
		// 	}
		// })

		const existingTokenReq = await pool.query(`SELECT * FROM tokens WHERE email = $1 and type = $2`, [email, TokenType.PASSWORD_RESET]);

		if (existingTokenReq.rows[0]) {
			// await this.prismaService.token.delete({
			// 	where: {
			// 		id: existingTokenReq.rows[0].id,
			// 		type: TokenType.PASSWORD_RESET
			// 	}
			// })

			await pool.query(`DELETE FROM tokens WHERE id = $1 and type = $2`, [existingTokenReq.rows[0].id, TokenType.VERIFICATION])
		}

		// const passwordResetToken = await this.prismaService.token.create({
		// 	data: {
		// 		email,
		// 		token,
		// 		expiresIn,
		// 		type: TokenType.PASSWORD_RESET
		// 	}
		// })

		const passwordResetTokenReq = await pool.query(
			`INSERT INTO tokens (email, token, expires_in, type) values ($1, $2, $3, $4) RETURNING *`,
			[email, token, expiresIn, TokenType.PASSWORD_RESET]
		);

		return passwordResetTokenReq.rows[0]
	}
}
