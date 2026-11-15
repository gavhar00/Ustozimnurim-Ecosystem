import { Test } from '@nestjs/testing';
import { UsersService } from '../../src/modules/users/users.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('upserts a user using telegramId as the natural key', async () => {
    prismaMock.user.upsert.mockResolvedValue({ id: 'u1', telegramId: 42n });

    await service.upsertFromTelegram({
      telegramId: 42n,
      username: 'nurim',
      firstName: 'Nurim',
      languageCode: 'uz',
    });

    expect(prismaMock.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { telegramId: 42n },
        create: expect.objectContaining({ telegramId: 42n, username: 'nurim' }),
        update: expect.objectContaining({ username: 'nurim' }),
      }),
    );
  });

  it('looks up a user by telegramId', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', telegramId: 42n });
    const result = await service.findByTelegramId(42n);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { telegramId: 42n } });
    expect(result).toEqual({ id: 'u1', telegramId: 42n });
  });
});
