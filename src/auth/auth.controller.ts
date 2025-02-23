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
import { Recaptcha } from '@nestlab/google-recaptcha'
import { Request, Response } from 'express'

import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { AuthProviderGuard } from './guards/provider.guard'
import { ProviderService } from './provider/provider.service'

/**
 * Контроллер для управления авторизацией пользователей.
 */
@Controller('auth')
export class AuthController {
	/**
	 * Конструктор контроллера аутентификации.
	 * @param authService - Сервис для аутентификации.
	 * @param configService - Сервис для работы с конфигурацией приложения.
	 * @param providerService - Сервис для работы с провайдерами аутентификации.
	 */
	public constructor(
		private readonly authService: AuthService,
		private readonly configService: ConfigService,
		private readonly providerService: ProviderService
	) { }

	/**
	 * Регистрация нового пользователя.
	 * @param dto - Объект с данными для регистрации пользователя.
	 * @returns Ответ от сервиса аутентификации.
	 */
	@Recaptcha()
	@Post('register')
	@HttpCode(HttpStatus.OK)
	public async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto)
	}

	@Post('proxy/register')
	@HttpCode(HttpStatus.OK)
	public async proxyRegister(@Req() req: Request) {
		return this.authService.proxyRegister(req)
	}

	/**
	 * Вход пользователя в систему.
	 * @param req - Объект запроса Express.
	 * @param dto - Объект с данными для входа пользователя.
	 * @returns Ответ от сервиса аутентификации.
	 */
	@Recaptcha()
	@Post('login')
	@HttpCode(HttpStatus.OK)
	public async login(@Req() req: Request, @Body() dto: LoginDto) {
		return this.authService.login(req, dto)
	}

	@Recaptcha()
	@Post('proxy/login')
	@HttpCode(HttpStatus.OK)
	public async proxyLogin(@Req() req: Request) {
		return this.authService.proxyLogin(req)
	}

	@HttpCode(HttpStatus.OK)
	@Get('tokens')
	public async getAllUsers() {
		return this.authService.getAllTokens()
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
	@UseGuards(AuthProviderGuard)
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

		return true;
		
	}

	@Post('/oauth/proxy/callback/:provider')
	@HttpCode(HttpStatus.OK)
	public async proxyCallback(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		return this.authService.proxyCallback(req, res)
	}

	/**
	 * Подключение пользователя к провайдеру аутентификации.
	 * @param provider - Название провайдера аутентификации.
	 * @returns URL для аутентификации через провайдера.
	 */
	@UseGuards(AuthProviderGuard)
	@Get('/oauth/connect/:provider')
	public async connect(@Param('provider') provider: string) {
		const providerInstance = this.providerService.findByService(provider)

		return {
			url: providerInstance.getAuthUrl()
		}
	}

	@Post('/oauth/proxy/connect/:provider')
	@HttpCode(HttpStatus.OK)
	public async proxyConnect(@Req() req: Request) {
		return this.authService.proxyConnect(req)
	}

	/**
	 * Завершение сессии пользователя.
	 * @param req - Объект запроса Express.
	 * @param res - Объект ответа Express.
	 * @returns Ответ от сервиса аутентификации.
	 */
	@Get('logout')
	@HttpCode(HttpStatus.OK)
	public async logout(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		return this.authService.logout(req, res)
	}

	@Post('proxy/logout')
	@HttpCode(HttpStatus.OK)
	public async proxyLogout() {
		return this.authService.proxyLogout()
	}
}
