import {
	BadRequestException,
	ConflictException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { MailService } from '../../libs/mail/mail.service'
import { UserService } from '../../user/user.service'

import { AuthService } from '../auth.service'

import { ConfirmationDto } from './dto/confirmation.dto'

import { pool } from '../../db/pool.module'

/**
 * Сервис для управления подтверждением электронной почты.
 */
@Injectable()
export class EmailConfirmationService {
	/**
	 * Конструктор сервиса подтверждения электронной почты.
	 * @param mailService - Сервис для отправки email-сообщений.
	 * @param userService - Сервис для работы с пользователями.
	 * @param authService - Сервис для аутентификации (внедряется через forwardRef).
	 */
	public constructor(
		private readonly mailService: MailService,
		private readonly userService: UserService,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService
	) { }

	/**
	 * Обрабатывает новый запрос на подтверждение электронной почты.
	 * @param req - Объект запроса Express.
	 * @param dto - DTO с токеном подтверждения.
	 * @returns Сессия пользователя после успешного подтверждения.
	 * @throws NotFoundException - Если токен или пользователь не найден.
	 * @throws BadRequestException - Если токен истек.
	 */
	public async newVerification(req: Request, dto: ConfirmationDto) {
		// const existingToken = await this.prismaService.token.findUnique({
		// 	where: {
		// 		token: dto.token,
		// 		type: TokenType.VERIFICATION
		// 	}
		// })

		// if (!existingToken) {
		// 	throw new NotFoundException(
		// 		'Токен подтверждения не найден. Пожалуйста, убедитесь, что у вас правильный токен.'
		// 	)
		// }

		// const hasExpired = new Date(existingToken.expiresIn) < new Date()

		// if (hasExpired) {
		// 	throw new BadRequestException(
		// 		'Токен подтверждения истек. Пожалуйста, запросите новый токен для подтверждения.'
		// 	)
		// }

		// const existingUser = await this.userService.findByEmail(
		// 	existingToken.email
		// )

		// if (!existingUser) {
		// 	throw new NotFoundException(
		// 		'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
		// 	)
		// }

		// await this.prismaService.user.update({
		// 	where: {
		// 		id: existingUser.id
		// 	},
		// 	data: {
		// 		isVerified: true
		// 	}
		// })

		// const token = await this.prismaService.token.findUnique({
		// 	where: {
		// 		id: existingToken.id,
		// 		type: TokenType.VERIFICATION
		// 	}
		// });

		// if (token) {
		// 	await this.prismaService.token.delete({
		// 		where: {
		// 			id: existingToken.id,
		// 			type: TokenType.VERIFICATION
		// 		}
		// 	});
		// }

		return `this.authService.saveSession(req, existingUser)`
	}

	/**
	 * Отправляет токен подтверждения на указанный email.
	 * @param email - Адрес электронной почты пользователя.
	 * @returns true, если токен успешно отправлен.
	 */
	public async sendVerificationToken(email: string) {
		const verificationToken = await this.generateVerificationToken(email);

		// await this.mailService.sendConfirmationEmail(
		// 	verificationToken.email,
		// 	verificationToken.token
		// )

		return true
	}

	/**
	 * Генерирует новый токен подтверждения электронной почты.
	 * @param email - Адрес электронной почты пользователя.
	 * @returns Объект токена подтверждения.
	 */
	private async generateVerificationToken(email: string) {
		const token = uuidv4()
		const expiresIn = new Date(new Date().getTime() + 3600 * 1000)

		// const existingToken = await this.prismaService.token.findFirst({
		// 	where: {
		// 		email,
		// 		type: TokenType.VERIFICATION
		// 	}
		// })

		const existingTokenReq = await pool.query(`SELECT * FROM tokens WHERE email = $1 and token = $2`, [email, token]);

		if (existingTokenReq.rows[0]) {
			// await this.prismaService.token.delete({
			// 	where: {
			// 		id: existingToken.id,
			// 		type: TokenType.VERIFICATION
			// 	}
			// })

			// если вдруг такой токен уже есть с этим email
			await pool.query(`DELETE FROM tokens where id = $1 and type = $2`, [existingTokenReq.rows[0].id, 'VERIFICATION']);
		}

		// const verificationToken = await this.prismaService.token.create({
		// 	data: {
		// 		email,
		// 		token,
		// 		expiresIn,
		// 		type: TokenType.VERIFICATION
		// 	}
		// })

		const verificationTokenReq = await pool.query(
			`INSERT INTO tokens (email, token, expires_in, type) values ($1, $2, $3, $4) RETURNING *`,
			[email, token, expiresIn, 'VERIFICATION']
		);

		return verificationTokenReq.rows[0]
	}
}
