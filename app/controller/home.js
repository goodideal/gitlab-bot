'use strict';

const Controller = require('egg').Controller;
const { X_GITLAB_EVENT } = require('../imports/const');
class HomeController extends Controller {
  async index() {
    const { ctx, config } = this;
    const { path = '' } = ctx.params;

    this.logger.info('====> request headers: ', ctx.request.headers);
    this.logger.info('====> request body: ', ctx.request.body);

    // platform check
    const platform = process.env['PLATFORM'] || config.platform;
    this.logger.debug('platform: ', platform);
    if (config.supportPlatforms.indexOf(platform) === -1) {
      const errMsg = `====> platform "${platform}" is not supported, only support: ${config.supportPlatforms.join(
        ', '
      )}`;
      this.logger.error(errMsg);
      ctx.body = {
        error: errMsg,
      };
      return;
    }

    // webhookUrl check
    const webhookUrl =
      process.env['WEBHOOK_URL' + (path ? '_' + path.toUpperCase() : '')];

    this.logger.debug('webhookUrl: ', webhookUrl);

    // if webhookUrl not match, exit
    if (!webhookUrl) {
      this.logger.error('====> webhook url error, webhookUrl: ' + webhookUrl);
      ctx.body = {
        error: 'webhook url error, webhookUrl: ' + webhookUrl,
      };
      return;
    }
    let gitlabEvent = X_GITLAB_EVENT.push;

    // check x-gitlab-event
    if (ctx.request.headers['x-gitlab-event']) {
      gitlabEvent = ctx.request.headers['x-gitlab-event'];
      if (Object.values(X_GITLAB_EVENT).indexOf(gitlabEvent) === -1) {
        const errMsg = `====> x-gitlab-event "${gitlabEvent}" is not supported}`;
        this.logger.error(errMsg);
        ctx.body = {
          error: errMsg,
        };
        return;
      }
    }

    const message = await ctx.service.webhook.translateMsg(
      ctx.request.body,
      platform,
      gitlabEvent
    );

    if (!message) {
      this.logger.info('====> message is empty, suppressed.');
      ctx.body = {
        msg: '====> message is empty or not supported, suppressed.',
      };
      return;
    }

    const result = await ctx.curl(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=UTF-8',
      },
      // 自动解析 JSON response
      dataType: 'json',
      // 3 秒超时
      timeout: 3000,

      data: message,
    });

    ctx.body = {
      webhook_url: webhookUrl,
      webhook_message: message,
      status: result.status,
      headers: result.headers,
      package: result.data,
    };

    this.logger.info('response body: ', ctx.body);
  }
}

module.exports = HomeController;
