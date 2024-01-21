import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [WebhookModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
