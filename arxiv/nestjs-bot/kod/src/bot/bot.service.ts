import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { AppConfigService } from '../config/app-config.module';
import { UsersService } from '../modules/users/users.service';
import { OnboardingService } from '../modules/onboarding/onboarding.service';
import { AttributionService } from '../modules/attribution/attribution.service';
import { ChannelsService } from '../modules/channels/channels.service';
import { parseDeepLinkPayload } from '../modules/attribution/deep-link.util';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  public readonly bot: Bot;

  constructor(
    private readonly config: AppConfigService,
    private readonly users: UsersService,
    private readonly onboarding: OnboardingService,
    private readonly attribution: AttributionService,
    private readonly channels: ChannelsService,
  ) {
    this.bot = new Bot(this.config.telegramBotToken);
  }

  onModuleInit(): void {
    this.registerHandlers();
    this.bot.catch((err) => {
      this.logger.error(`Unhandled bot error: ${err.message}`, err.stack);
    });
    this.logger.log('grammY bot handlers registered (webhook mode — call setWebhook separately)');
  }

  private registerHandlers(): void {
    this.bot.command('start', (ctx) => this.handleStart(ctx));
  }

  private async handleStart(ctx: Context): Promise<void> {
    const from = ctx.from;
    if (!from) return;

    const user = await this.users.upsertFromTelegram({
      telegramId: BigInt(from.id),
      username: from.username,
      firstName: from.first_name,
      languageCode: from.language_code,
    });

    // grammY exposes the raw deep-link payload via ctx.match for command handlers.
    const payload = typeof ctx.match === 'string' ? ctx.match : undefined;
    await this.attribution.recordFromStartPayload(user.id, payload);

    const parsed = parseDeepLinkPayload(payload);
    const sourceAdapter = parsed ? this.channels.getAdapterByDeepLinkCode(parsed.channelCode) : undefined;

    const welcomeText = await this.onboarding.greet(user, sourceAdapter);
    await ctx.reply(welcomeText);
  }
}
