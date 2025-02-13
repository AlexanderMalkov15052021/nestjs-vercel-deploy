import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator'

/**
 * DTO для обновления данных пользователя.
 */
export class UpdateUserDto {
	/**
	 * Имя пользователя.
	 * @example Иван
	 */
	@IsString({ message: 'Имя должно быть строкой.' })
	@IsNotEmpty({ message: 'Имя обязательно для заполнения.' })
	name: string

	/**
	 * Имя пользователя.
	 * @example Иванов
	 */
	@IsString({ message: 'Имя должно быть строкой.' })
	@IsNotEmpty({ message: 'Имя обязательно для заполнения.' })
	surname: string

}
