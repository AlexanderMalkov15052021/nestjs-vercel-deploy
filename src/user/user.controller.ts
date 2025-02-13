import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Req
} from '@nestjs/common'

import { UpdateUserDto } from './dto/update-user.dto'
import { UserService } from './user.service'

/**
 * Контроллер для управления пользователями.
 */
@Controller('users')
export class UserController {
	/**
	 * Конструктор контроллера пользователей.
	 * @param userService - Сервис для работы с пользователями.
	 */
	public constructor(private readonly userService: UserService) { }

	@Post('create')
	@HttpCode(HttpStatus.OK)
	public async login(@Req() req: Request, @Body() dto: UpdateUserDto) {
		return this.userService.create(req, dto)
	}
}
