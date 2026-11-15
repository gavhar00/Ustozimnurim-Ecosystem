import { Injectable } from '@nestjs/common';
import { OnboardingStep, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelAdapter } from '../channels/adapters/channel-adapter.interface';

/**
 * Phase 1 scope: only the entry step (NOT_STARTED -> WELCOMED) is
 * implemented, matching "implement onboarding foundation" — the full
 * goal-asking / first-value conversation flow (WELCOMED -> GOAL_ASKED ->
 * COMPLETED) is a later phase and intentionally not built here.
 */
@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Called from /start. Returns the welcome text to send. If the user has
   * already been welcomed before, returns a short "welcome back" instead of
   * repeating the full onboarding message.
   */
  async greet(user: User, sourceAdapter: ChannelAdapter | undefined): Promise<string> {
    if (user.onboardingStep !== OnboardingStep.NOT_STARTED) {
      return `Yana xush kelibsiz, ${user.firstName ?? 'do\'stim'}!`;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { onboardingStep: OnboardingStep.WELCOMED },
    });

    const intro = sourceAdapter?.getWelcomeMessage() ?? "Assalomu alaykum! Ustozim Nurimga xush kelibsiz.";
    return `${intro}\n\nHozircha shunchaki tanishib olamiz — keyingi bosqichlar tez orada qo'shiladi.`;
  }
}
