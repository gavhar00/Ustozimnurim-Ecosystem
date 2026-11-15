import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module';
import { UsersModule } from '../modules/users/users.module';
import { OnboardingModule } from '../modules/onboarding/onboarding.module';
import { AttributionModule } from '../modules/attribution/attribution.module';
import { ChannelsModule } from '../modules/channels/channels.module';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';

@Module({
  imports: [AppConfigModule, UsersModule, OnboardingModule, AttributionModule, ChannelsModule],
  controllers: [BotController],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
