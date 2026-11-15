import { Body, Controller, Headers, HttpCode, Logger, Post, UnauthorizedException } from '@nestjs/common';
import { BotService } from './bot.service';
import { AppConfigService } from '../config/app-config.module';

// grammY's Update type is intentionally not imported here: the webhook body
// is untyped JSON from Telegram's side, and BotService.bot.handleUpdate is
// the single place that actually validates/interprets its shape.
type RawTelegramUpdate = Record<string, unknown>;

const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

@Controller('telegram')
export class BotController {
  private readonly logger = new Logger(BotController.name);

  constructor(
    private readonly botService: BotService,
    private readonly config: AppConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() update: RawTelegramUpdate,
    @Headers(SECRET_HEADER) secretHeader: string | undefined,
  ): Promise<{ ok: true }> {
    if (secretHeader !== this.config.telegramWebhookSecret) {
      this.logger.warn('Rejected webhook call: missing/invalid secret token header');
      throw new UnauthorizedException();
    }

    // grammY's handleUpdate resolves once middleware has run; Telegram just
    // needs a fast 200 back, which the return below provides.
    await this.botService.bot.handleUpdate(
      update as unknown as Parameters<typeof this.botService.bot.handleUpdate>[0],
    );
    return { ok: true };
  }
}
