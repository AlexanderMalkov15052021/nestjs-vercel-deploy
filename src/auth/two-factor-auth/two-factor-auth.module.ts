import { Module } from '@nestjs/common'


import { TwoFactorAuthService } from './two-factor-auth.service'

@Module({
	providers: [TwoFactorAuthService]
})
export class TwoFactorAuthModule {}
