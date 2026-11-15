import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module';
import { AttributionService } from './attribution.service';

@Module({
  imports: [ChannelsModule],
  providers: [AttributionService],
  exports: [AttributionService],
})
export class AttributionModule {}
