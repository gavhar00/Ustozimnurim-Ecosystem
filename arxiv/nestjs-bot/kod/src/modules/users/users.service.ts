import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface TelegramIdentity {
  telegramId: bigint;
  username?: string;
  firstName?: string;
  languageCode?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates the user on first contact, or refreshes their profile fields
   * and lastActiveAt on every subsequent contact. This is the only place
   * in the app that writes identity fields — everything else reads.
   */
  async upsertFromTelegram(identity: TelegramIdentity): Promise<User> {
    return this.prisma.user.upsert({
      where: { telegramId: identity.telegramId },
      update: {
        username: identity.username,
        firstName: identity.firstName,
        languageCode: identity.languageCode,
        lastActiveAt: new Date(),
      },
      create: {
        telegramId: identity.telegramId,
        username: identity.username,
        firstName: identity.firstName,
        languageCode: identity.languageCode,
      },
    });
  }

  async findByTelegramId(telegramId: bigint): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }
}
