import { Controller, Post, Body, Headers, Param, Req } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { X_GITLAB_EVENT } from '../const';
import { Config } from '../config';
import { FastifyRequest } from 'fastify';

@Controller('webhook')
export class WebhookController {
  private logger;

  constructor(
    private readonly webhookService: WebhookService,
    @Req() request: FastifyRequest,
  ) {
    this.logger = request.log;
  }

  @Post(':path')
  async handleWebhook(
    @Param() params: any,
    @Body() body: any,
    @Headers() headers: any,
  ) {
    const { path } = params;
    this.logger.info('====> Received headers:', headers);
    this.logger.info('====> Received body:', body);

    // check platform
    const platform = process.env['PLATFORM'] || Config.platform;
    this.logger.info('platform: ', platform);

    if (Config.supportPlatforms.indexOf(platform) === -1) {
      const errMsg = `====> platform "${platform}" is not supported, only support: ${Config.supportPlatforms.join(', ')}`;
      this.logger.error(errMsg);
      return { message: errMsg };
    }

    // check webhookUrl
    const pushGroup = path.toUpperCase();
    const webhookUrl =
      process.env['WEBHOOK_URL' + (path ? '_' + pushGroup : '')];

    this.logger.debug('`====> webhookUrl: ', webhookUrl);

    let gitlabEvent = X_GITLAB_EVENT.push;

    // check x-gitlab-event
    if (headers['x-gitlab-event']) {
      gitlabEvent = headers['x-gitlab-event'];
      if (Object.values(X_GITLAB_EVENT).indexOf(gitlabEvent) === -1) {
        const errMsg = `====> x-gitlab-event "${gitlabEvent}" is not supported}`;
        this.logger.error(errMsg);
        return { message: errMsg };
      }
    }

    await this.webhookService.translateMsg(
      body,
      platform,
      gitlabEvent,
      pushGroup,
    );
    return { message: 'Webhook processed successfully' };
  }
}
