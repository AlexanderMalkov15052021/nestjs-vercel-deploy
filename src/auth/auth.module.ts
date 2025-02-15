import {  Module } from '@nestjs/common'

import { UserService } from '../user/user.service'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { TwoFactorAuthService } from './two-factor-auth/two-factor-auth.service'

@Module({
	imports: [
		// ProviderModule.registerAsync({
		// 	imports: [ConfigModule],
		// 	useFactory: getProvidersConfig,
		// 	inject: [ConfigService]
		// }),
		// GoogleRecaptchaModule.forRootAsync({
		// 	imports: [ConfigModule],
		// 	useFactory: getRecaptchaConfig,
		// 	inject: [ConfigService]
		// }),
		// forwardRef(() => EmailConfirmationModule)
	],
	controllers: [AuthController],
	providers: [AuthService, UserService, TwoFactorAuthService],
	exports: [AuthService]
})
export class AuthModule {}
