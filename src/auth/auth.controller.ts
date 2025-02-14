import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	Req,
	Res,
	UseGuards
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'

import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

/**
 * Контроллер для управления авторизацией пользователей.
 */
@Controller('auth')
export class AuthController {
	/**
	 * Конструктор контроллера аутентификации.
	 * @param authService - Сервис для аутентификации.
	 * @param providerService - Сервис для работы с провайдерами аутентификации.
	 */
	public constructor(
		private readonly authService: AuthService,
	) { }

	/**
	 * Регистрация нового пользователя.
	 * @param dto - Объект с данными для регистрации пользователя.
	 * @returns Ответ от сервиса аутентификации.
	 */
	@Post('register')
	@HttpCode(HttpStatus.OK)
	public async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto)
	}

	/**
	 * Вход пользователя в систему.
	 * @param req - Объект запроса Express.
	 * @param dto - Объект с данными для входа пользователя.
	 * @returns Ответ от сервиса аутентификации.
	 */
	@Post('login')
	@HttpCode(HttpStatus.OK)
	public async login(@Req() req: Request, @Body() dto: LoginDto) {
		return this.authService.login(req, dto)
	}

	/**
	 * Обработка колбэка от провайдера аутентификации.
	 * @param req - Объект запроса Express.
	 * @param res - Объект ответа Express.
	 * @param code - Код авторизации, полученный от провайдера.
	 * @param provider - Название провайдера аутентификации.
	 * @returns Перенаправление на страницу настроек.
	 * @throws BadRequestException - Если код авторизации не был предоставлен.
	 */
	@Get('/oauth/callback/:provider')
	public async callback(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@Query('code') code: string,
		@Param('provider') provider: string
	) {
		if (!code) {
			throw new BadRequestException(
				'Не был предоставлен код авторизации.'
			)
		}

		await this.authService.extractProfileFromCode(req, provider, code)

		return res.redirect('')
	}

	/**
	 * Подключение пользователя к провайдеру аутентификации.
	 * @param provider - Название провайдера аутентификации.
	 * @returns URL для аутентификации через провайдера.
	 */
	@Get('/oauth/connect/:provider')
	public async connect(@Param('provider') provider: string) {

		return {
		}
	}

	/**
	 * Завершение сессии пользователя.
	 * @param req - Объект запроса Express.
	 * @param res - Объект ответа Express.
	 * @returns Ответ от сервиса аутентификации.
	 */
	@Post('logout')
	@HttpCode(HttpStatus.OK)
	public async logout(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		return this.authService.logout(req, res)
	}
}
