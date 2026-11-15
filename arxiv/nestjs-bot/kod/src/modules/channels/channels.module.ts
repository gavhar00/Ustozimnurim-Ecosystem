import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { ChannelsService } from './channels.service';
import { CHANNEL_ADAPTERS } from './adapters/channel-adapter.interface';
import { UstozimNurimAdapter } from './adapters/ustozim-nurim.adapter';
import { SahifalarAdapter } from './adapters/sahifalar.adapter';
import { CommunityAdapter } from './adapters/community.adapter';
import { QuranoyAdapter } from './adapters/quranoy.adapter';

@Module({
  imports: [AppConfigModule],
  providers: [
    UstozimNurimAdapter,
    SahifalarAdapter,
    CommunityAdapter,
    QuranoyAdapter,
    {
      provide: CHANNEL_ADAPTERS,
      useFactory: (
        un: UstozimNurimAdapter,
        sf: SahifalarAdapter,
        co: CommunityAdapter,
        qr: QuranoyAdapter,
      ) => [un, sf, co, qr],
      inject: [UstozimNurimAdapter, SahifalarAdapter, CommunityAdapter, QuranoyAdapter],
    },
    ChannelsService,
  ],
  exports: [ChannelsService],
})
export class ChannelsModule {}
