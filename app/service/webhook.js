'use strict';

const Service = require('egg').Service;
const moment = require('moment');
const Mustache = require('mustache');

// set default lang
moment.locale('zh-cn');

// override default escape, remove \n and collapse whitespace
Mustache.escape = text =>
  text.toString().replace('\n', ' ').replace(/\s+/g, ' ');

const OBJECT_KIND = {
  push: 'push',
  tag_push: 'tag_push',
  issue: 'issue',
  note: 'note',
  merge_request: 'merge_request',
  wiki_page: 'wiki_page',
  pipeline: 'pipeline',
  build: 'build', // todo
};

const REDIS_KEY = {
  pipeline: id => `gitlab.pipeline.${id}`,
};

const REDIS_VAL = {
  pipeline: ({ pipelineId, stages, status, duration, builds }) => {
    return {
      type: 'pipeline',
      id: pipelineId,
      duration: duration,
      durationMin: Math.round(duration / 60 - 0.5),
      durationSec: duration % 60,
      status: status,
      stages: stages,
      builds: builds,
    };
  },
};

// all customized variables start with GB_
class WebhookService extends Service {
  async translateMsg(data) {
    const { object_kind } = data || {};
    if (!OBJECT_KIND[object_kind]) {
      return {};
    }

    let res = true;
    const content = [];
    switch (object_kind) {
      case OBJECT_KIND.push:
        res = await this.assemblePushMsg(content, data);
        break;

      case OBJECT_KIND.pipeline:
        res = await this.assemblePipelineMsg(content, data);
        break;

      case OBJECT_KIND.merge_request:
        res = await this.assembleMergeMsg(content, data);
        break;

      case OBJECT_KIND.tag_push:
        res = await this.assembleTagPushMsq(content, data);
        break;
      case OBJECT_KIND.issue:
        res = await this.assembleIssueMsq(content, data);
        break;
      case OBJECT_KIND.wiki_page:
        res = await this.assembleWikiPageMsq(content, data);
        break;
      case OBJECT_KIND.note:
        res = await this.assembleNoteMsq(content, data);
        break;
      default:
        res = false;
        break;
    }
    if (!res) return false;

    return {
      msgtype: 'markdown',
      markdown: { content: content.join(' \n  ') },
    };
  }

  async assemblePushMsg(content, data) {
    const { ref, commits = {}, before, after } = data;
    const GB_branch = ref.replace('refs/heads/', '');
    let GB_op = '';
    if (before === '0000000000000000000000000000000000000000') {
      // new branch
      GB_op = '新建分支';
    } else if (after === '0000000000000000000000000000000000000000') {
      // remove brance
      GB_op = '删除分支';
    } else {
      // others
      GB_op = '将代码推至';
    }

    const template = this.getTemplateByPlatform('qywx');

    this.logger.debug('template: ', template.push);
    this.logger.debug('content: ', content);

    const push = Mustache.render(template.push, {
      ...data,
      GB_op,
      GB_branch,
      GB_changes: this.getChangesFromCommits(commits),
    });

    return content.push(push);
  }

  async assemblePipelineMsg(content, data) {
    const { object_attributes = {}, user = {}, project = {}, builds } = data;
    const { id: GB_pipelineId, status, duration, source } = object_attributes;
    const { name } = user;
    const { web_url } = project;
    const GB_pipelineUrl = web_url + '/pipelines/' + GB_pipelineId;
    const GB_builds = []; //{ stage: '', builds: [] }

    builds.map(build => {
      // add status color and string
      build.GB_status = this.formatStatus(build.status);

      // add tigger user and url
      build.GB_user = build.user.name === name ? '' : build.user.name;
      build.GB_url = web_url + '/-/jobs/' + build.id;

      // format duration
      build.GB_duration = build.duration
        ? moment.duration(build.duration, 'seconds').humanize()
        : null;

      const stageBuilds = GB_builds.find(o => o.stage === build.stage);

      if (stageBuilds) {
        stageBuilds.builds.push(build);
      } else {
        GB_builds.push({
          stage: build.stage,
          builds: [build],
        });
      }
    });

    // find any build not finished (success, failed, skipped)
    const suppressBuilds = builds.find(
      o =>
        o.status === 'created' ||
        o.status === 'running' ||
        o.status === 'pending'
    );
    this.logger.info('===> suppressBuilds', suppressBuilds);

    if (suppressBuilds) {
      // suppress msg
      return false;
    }

    let GB_sourceString;
    switch (source) {
      case 'push':
        GB_sourceString = '推送操作';
        break;
      case 'merge_request_event':
        GB_sourceString = '合并操作';
        break;
      case 'web':
        GB_sourceString = '网页运行';
        break;
      default:
        // gitlab 11.3 未支持source参数
        GB_sourceString = `${name}`;
    }
    const template = this.getTemplateByPlatform('qywx');
    const pipeline = Mustache.render(template.pipeline, {
      ...data,
      GB_pipelineId,
      GB_pipelineUrl,
      GB_status: this.formatStatus(status),
      GB_sourceString,
      GB_duration: moment.duration(duration, 'seconds').humanize(),
      GB_builds,
    });
    return content.push(pipeline);
  }

  async assembleMergeMsg(content, data) {
    const { object_attributes = {} } = data;
    const { updated_at, state } = object_attributes;

    let GB_stateString = '',
      GB_stateAction = '';
    // opened, closed, locked, or merged
    switch (state) {
      case 'opened':
        GB_stateString = '开启了';
        GB_stateAction = '**请项目管理员确认**';
        break;

      case 'closed':
        GB_stateString = '取消了';
        GB_stateAction = '**请提交人仔细检查**';
        break;

      case 'locked':
        GB_stateString = '锁定了';
        break;

      case 'merged':
        GB_stateString = '确认了';
        break;

      default:
    }

    const template = this.getTemplateByPlatform('qywx');
    const merge_request = Mustache.render(template.merge_request, {
      ...data,
      GB_stateAction,
      GB_stateString,
      GB_updated_at: moment(updated_at).format('MM-DD HH:mm'),
    });

    return content.push(merge_request);
  }

  async assembleTagPushMsq(content, data) {
    const { ref, commits, before, after } = data;

    const GB_tag = ref.replace('refs/tags/', '');
    let GB_op = '';

    if (before === '0000000000000000000000000000000000000000') {
      // new
      GB_op = '新增';
    } else if (after === '0000000000000000000000000000000000000000') {
      // remove
      GB_op = '删除';
    }

    const template = this.getTemplateByPlatform('qywx');
    const tag_push = Mustache.render(template.tag_push, {
      ...data,
      GB_tag,
      GB_op,
      GB_changes: this.getChangesFromCommits(commits),
    });

    return content.push(tag_push);
  }

  async assembleIssueMsq(content, data) {
    const { object_attributes = {} } = data;
    const { state } = object_attributes;

    const template = this.getTemplateByPlatform('qywx');
    const issue = Mustache.render(template.issue, {
      ...data,
      GB_state: this.formatStatus(state),
    });
    return content.push(issue);
  }

  async assembleWikiPageMsq(content, data) {
    const { object_attributes = {} } = data;
    const { action } = object_attributes;

    const template = this.getTemplateByPlatform('qywx');
    const issue = Mustache.render(template.wiki, {
      ...data,
      GB_action: this.formatAction(action),
    });
    return content.push(issue);
  }

  async assembleNoteMsq(content, data) {
    const { object_attributes = {} } = data;
    const { action } = object_attributes;

    const template = this.getTemplateByPlatform('qywx');
    const note = Mustache.render(template.note, {
      ...data,
      GB_action: this.formatAction(action),
    });
    return content.push(note);
  }

  formatStatus(status) {
    let color = 'comment',
      str,
      isNotify = true;
    switch (status) {
      case 'failed':
        color = 'warning';
        str = '执行失败';
        break;
      case 'success':
        color = 'info';
        str = '执行成功';
        break;
      case 'running':
        str = '运行中';
        break;
      case 'pending':
        color = 'warning';
        str = '准备中';
        isNotify = false;
        break;
      case 'canceled':
        str = '已取消';
        break;
      case 'skipped':
        str = '已跳过';
        break;
      case 'manual':
        str = '需手动触发';
        break;
      case 'opened':
        color = 'info';
        str = '开启';
        break;
      case 'closed':
        color = 'info';
        str = '关闭';
        break;
      default:
        str = `状态未知 (${status})`;
    }

    return { color, str };
  }

  formatAction(action) {
    let actionColor = 'comment',
      actionString;
    switch (action) {
      // Release
      case 'create':
        actionColor = 'info';
        actionString = '创建';
        break;
      case 'update':
        actionColor = 'info';
        actionString = '更新';
        break;
      // Emoji
      case 'award':
        actionColor = 'info';
        actionString = '授予';
        break;
      case 'revoke':
        actionColor = 'info';
        actionString = '回收';
        break;
      // Issue and Merge request
      case 'open':
        actionColor = 'info';
        actionString = '打开';
        break;
      case 'close':
        actionColor = 'info';
        actionString = '关闭';
        break;
      case 'approved':
        actionColor = 'info';
        actionString = '已通过';
        break;
      case 'unapproved':
        actionColor = 'info';
        actionString = '未通过';
        break;
      case 'approval':
        actionColor = 'info';
        actionString = '批准';
        break;
      case 'unapproval':
        actionColor = 'info';
        actionString = '未批准';
        break;
      case 'merge':
        actionColor = 'info';
        actionString = '合并';
        break;
      default:
        actionString = `动作未知 (${action})`;
    }

    return { actionColor, actionString };
  }

  getChangesFromCommits(commits) {
    const changes = { added: 0, modified: 0, removed: 0 };
    commits.map(commit => {
      const { added = [], modified = [], removed = [] } = commit;
      changes.added += added.length || 0;
      changes.modified += modified.length || 0;
      changes.removed += removed.length || 0;
    });

    return changes;
  }

  getTemplateByPlatform(platform) {
    const { template } = this.config;

    if (!template[platform]) {
      this.logger.error(`can't find ${platform} in template`);
      return template.default;
    }

    return template[platform];
  }
}

module.exports = WebhookService;
