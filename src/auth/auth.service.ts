import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { hash, verify } from 'argon2'
import { Request, Response } from 'express'

import { UserService } from '../user/user.service'

import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { EmailConfirmationService } from './email-confirmation/email-confirmation.service'
import { ProviderService } from './provider/provider.service'
import { TwoFactorAuthService } from './two-factor-auth/two-factor-auth.service'
import { pool } from '../db/pool.module'
import { AuthMethod, User } from '../libs/common/types'

/**
 * Сервис для аутентификации и управления сессиями пользователей.
 */
@Injectable()
export class AuthService {
	/**
	 * Конструктор сервиса аутентификации.
	 * @param userService - Сервис для работы с пользователями.
	 * @param configService - Сервис для работы с конфигурацией приложения.
	 * @param providerService - Сервис для работы с провайдерами аутентификации.
	 * @param emailConfirmationService - Сервис для работы с подтверждением email.
	 * @param twoFactorAuthService - Сервис для работы с двухфакторной аутентификацией.
	 */
	public constructor(
		private readonly userService: UserService,
		private readonly configService: ConfigService,
		private readonly providerService: ProviderService,
		private readonly emailConfirmationService: EmailConfirmationService,
		private readonly twoFactorAuthService: TwoFactorAuthService
	) { }

	/**
	 * Регистрирует нового пользователя.
	 * @param dto - Объект с данными для регистрации пользователя.
	 * @returns Объект с сообщением об успешной регистрации.
	 * @throws ConflictException - Если пользователь с таким email уже существует.
	 */
	public async register(dto: RegisterDto) {
		const isExists = await this.userService.findByEmail(dto.email)

		if (isExists) {
			throw new ConflictException(
				'Регистрация не удалась. Пользователь с таким email уже существует. Пожалуйста, используйте другой email или войдите в систему.'
			)
		}

		const reqNewUser = await pool.query(
			`INSERT INTO users (email, password, display_name, picture, method, is_verified) values ($1, $2, $3, $4, $5, $6) RETURNING *`,
			[
				dto.email,
				await hash(dto.password),
				dto.name,
				'',
				'CREDENTIALS',
				false
			]
		);

		// const newUser = await this.userService.create(
		// 	dto.email,
		// 	dto.password,
		// 	dto.name,
		// 	'',
		// 	AuthMethod.CREDENTIALS,
		// 	false
		// )

		await this.emailConfirmationService.sendVerificationToken(reqNewUser.rows[0].email);

		return {
			message:
				'Вы успешно зарегистрировались. Пожалуйста, подтвердите ваш email. Сообщение было отправлено на ваш почтовый адрес.'
		}
	}

	/**
	 * Выполняет вход пользователя в систему.
	 * @param req - Объект запроса Express.
	 * @param dto - Объект с данными для входа пользователя.
	 * @returns Объект с пользователем после успешного входа.
	 * @throws NotFoundException - Если пользователь не найден.
	 * @throws UnauthorizedException - Если пароль неверный или email не подтвержден.
	 */
	public async login(req: Request, dto: LoginDto) {
		console.log(dto);
		console.log(dto.email);
		const user = await this.userService.findByEmail(dto.email)

		// passwd(123456) = "$argon2id$v=19$m=65536,t=3,p=4$JZQ85cVd7xTOefoYC7NF9A$fUoHl3vJrcRBE4wevWwg1XFCwVV5NuK6XCGK+yAyBlY"

		if (!user || !user.password) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверьте введенные данные'
			)
		}

		const isValidPassword = await verify(user.password, dto.password)

		if (!isValidPassword) {
			throw new UnauthorizedException(
				'Неверный пароль. Пожалуйста, попробуйте еще раз или восстановите пароль, если забыли его.'
			)
		}

		if (!user.is_verified) {
			await this.emailConfirmationService.sendVerificationToken(
				user.email
			)
			throw new UnauthorizedException(
				'Ваш email не подтвержден. Пожалуйста, проверьте вашу почту и подтвердите адрес.'
			)
		}

		if (user.is_two_factor_enabled) {
			if (!dto.code) {
				await this.twoFactorAuthService.sendTwoFactorToken(user.email)

				return {
					message:
						'Проверьте вашу почту. Требуется код двухфакторной аутентификации.'
				}
			}

			await this.twoFactorAuthService.validateTwoFactorToken(
				user.email,
				dto.code
			)
		}

		return this.saveSession(req, user)
	}

	public async proxyLogin(req: Request, dto: LoginDto) {

		const body = req.body;

		const serverReq = await fetch(`${process.env.APPLICATION_URL}/auth/login` as string, {
			method: 'POST',
			body: JSON.stringify(body)
		});

		// const bodyReq = await serverReq.json();

		const cookie = serverReq.headers.get('set-cookie');

		console.log("serverReq: ", serverReq);
		console.log("cookie: ", cookie);
		console.log("body: ", body);

		return { cookie }
	}

	public async getAllTokens() {

		const userReq = await pool.query(`SELECT * FROM tokens`);

		if (!userReq.rows.length) {
			throw new NotFoundException(
				'Токены не найдены. Таблица пуста.'
			)
		}

		return userReq.rows;
	}

	/**
	 * Извлекает профиль пользователя из кода авторизации провайдера.
	 * @param req - Объект запроса Express.
	 * @param provider - Название провайдера аутентификации.
	 * @param code - Код авторизации провайдера.
	 * @returns Объект с пользователем после успешной аутентификации.
	 */
	public async extractProfileFromCode(
		req: Request,
		provider: string,
		code: string
	) {
		const providerInstance = this.providerService.findByService(provider)
		const profile = await providerInstance.findUserByCode(code)

		// const account = await this.prismaService.account.findFirst({
		// 	where: {
		// 		id: profile.id,
		// 		provider: profile.provider
		// 	}
		// })

		const accountReq = await pool.query(`SELECT * FROM accounts WHERE id = $1 and provider = $2`, [profile.id, profile.provider]);

		let user: any = accountReq.rows[0]?.userId
			? await this.userService.findById(accountReq.rows[0].userId)
			: null

		if (user) {
			return this.saveSession(req, user)
		}

		// checking for a user

		// const foundUser = await this.prismaService.user.findUnique({
		// 	where: {
		// 		email: profile.email
		// 	},
		// 	include: {
		// 		accounts: true
		// 	}
		// });

		const foundUserReq = await pool.query(`SELECT * FROM users WHERE email = $1`, [profile.email]);

		if (foundUserReq.rows[0]) {
			user = foundUserReq.rows[0];
		}
		else {
			user = await this.userService.create(
				profile.email,
				'',
				profile.name,
				profile.picture,
				AuthMethod[profile.provider.toUpperCase()],
				true
			);
		}

		if (!accountReq.rows[0]) {
			// await this.prismaService.account.create({
			// 	data: {
			// 		userId: user.id,
			// 		type: 'oauth',
			// 		provider: profile.provider,
			// 		accessToken: profile.access_token,
			// 		refreshToken: profile.refresh_token,
			// 		expiresAt: profile.expires_at
			// 	}
			// })

			await pool.query(
				`INSERT INTO accounts (user_id, type, provider, access_token, refresh_token, expires_at) values ($1, $2, $3, $4, $5, $6) RETURNING *`,
				[user.id, 'oauth', profile.provider, profile.access_token, profile.refresh_token, profile.expires_at]
			)

		}

		return this.saveSession(req, user)
	}

	/**
	 * Завершает текущую сессию пользователя.
	 * @param req - Объект запроса Express.
	 * @param res - Объект ответа Express.
	 * @returns Промис, который разрешается после завершения сессии.
	 * @throws InternalServerErrorException - Если возникла проблема при завершении сессии.
	 */
	public async logout(req: Request, res: Response): Promise<void> {
		return new Promise((resolve, reject) => {
			req.session.destroy(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Не удалось завершить сессию. Возможно, возникла проблема с сервером или сессия уже была завершена.'
						)
					)
				}
				res.clearCookie(
					this.configService.getOrThrow<string>('SESSION_NAME')
				)
				resolve()
			})
		})
	}

	/**
	 * Сохраняет сессию пользователя.
	 * @param req - Объект запроса Express.
	 * @param user - Объект пользователя.
	 * @returns Промис, который разрешается после сохранения сессии.
	 * @throws InternalServerErrorException - Если возникла проблема при сохранении сессии.
	 */
	public async saveSession(req: Request, user: User) {
		return new Promise((resolve, reject) => {
			req.session.userId = user.id

			req.session.save(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Не удалось сохранить сессию. Проверьте, правильно ли настроены параметры сессии.'
						)
					)
				}

				resolve({
					user
				})
			})
		})
	}
}
