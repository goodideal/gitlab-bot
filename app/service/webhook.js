'use strict';

const Service = require('egg').Service;
const _ = require('lodash')
const moment = require('moment')
const S = require('string')

const OBJECT_KIND = {
  push: 'push',
  tag_push: 'tag_push',
  issue: 'issue', // 
  note: 'note', // part to do
  merge_request: 'merge_request',
  wiki_page: 'wiki_page', // 
  pipeline: 'pipeline',
  build: 'build', // todo
}

const REDIS_KEY = {
  pipeline: (id) => `gitlab.pipeline.${id}`,
}

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
      builds: builds
    }
  }
}

class WebhookService extends Service {
  async translateMsg(data) {
    const { object_kind } = data || {};
    if (!OBJECT_KIND[object_kind]) {
      return {};
    }

    let res = true
    const content = [];
    switch (object_kind) {
      case OBJECT_KIND.push:
        res = await this.assemblePushMsg(content, data)
        break;

      case OBJECT_KIND.pipeline:
        res = await this.assemblePipelineMsg(content, data)
        break;


      case OBJECT_KIND.merge_request:
        res = await this.assembleMergeMsg(content, data)
        break;

      case OBJECT_KIND.tag_push:
        res = await this.assembleTagPushMsq(content, data)
        break;
      case OBJECT_KIND.issue:
        res = await this.assembleIssueMsq(content, data);
        break;
      case OBJECT_KIND.wiki_page:
        res = await this.assembleWikiPageMsq(content, data);
        break;
      case OBJECT_KIND.note:
        res =  await this.assembleNoteMsq(content, data);
        break;
      default:
        res = false;
        break;
    }
    if (!res) return false

    return {
      msgtype: 'markdown',
      markdown: { content: content.join(' \n  ') },
    };
  }

  async assemblePushMsg(content, { user_name, ref, project, commits, total_commits_count, before, after }) {
    const { name: projName, web_url, path_with_namespace } = project || {};

    const branch = ref.replace('refs/heads/', '')
    let op = ''
    if (before === '0000000000000000000000000000000000000000') {
      // new branch
      op = '新建分支'
    } else if (after === '0000000000000000000000000000000000000000') {
      // remove brance
      op = '删除分支'
    } else {
      // others
      op = '将代码推至'
    }

    content.push(`\`${user_name}\`${op}[[${path_with_namespace}/${branch}](${web_url}/tree/${branch})]。`)
    content.push(`> 项目 [[${projName} | ${path_with_namespace}](${web_url})]\n`)
    total_commits_count && content.push(`**共提交${total_commits_count}次：**\n`)
    total_commits_count && content.push(this.generateListItem('', this.formatCommits(commits).text));

    return content
  }

  async assemblePipelineMsg(content, { object_attributes, merge_request: mr, user, project, commit, builds }) {
    const { id: pipelineId, ref, status, duration, source, stages } = object_attributes || {};
    const { name: projName, web_url, path_with_namespace } = project || {};
    const { name, username } = user || {};
    const pipelineUrl = web_url + '/pipelines/' + pipelineId

    // find any build not finished (success, failed, skipped)
    const createdBuilds = _.find(builds, { status: 'created' });
    const runningBuilds = _.find(builds, { status: 'running' });
    const pendingBuilds = _.find(builds, { status: 'pending' });
    this.logger.info('===> createdBuilds', createdBuilds)
    this.logger.info('===> runningBuilds', runningBuilds)
    this.logger.info('===> pendingBuilds', pendingBuilds)

    if (createdBuilds || runningBuilds || pendingBuilds) {
      // suppress msg
      return false
    }

    const { statusColor, statusString } = this.formatStatus(status)

    let sourceString;
    switch (source) {
      case 'push':
        sourceString = '推送操作'
        break
      case 'merge_request_event':
        sourceString = '合并操作'
        break
      case 'web':
        sourceString = '网页运行'
        break
      default:
        // gitlab 11.3 未支持source参数
        sourceString = `${name}`
    }

    content.push(`[[#${pipelineId}流水线](${pipelineUrl})] <font color="${statusColor}">${statusString}</font>，位于${ref}分支，由<font color="info">${sourceString}</font>触发。`)
    content.push(`> 项目 [[${projName} | ${path_with_namespace}](${web_url})]\n`)
    content.push('**流水线详情：**\n')

    name && content.push(this.generateListItem('操作人', `\`${name}\``))

    duration && content.push(this.generateListItem('总耗时', `${this.formatDuration(duration)}`))
    !_.isEmpty(stages) && content.push(this.generateListItem(`共${stages.length}个阶段`, `${stages.join(' / ')}`))
    !_.isEmpty(mr) && content.push(this.generateListItem('合并详情', `[${mr.title}](${mr.url})，\`${mr.source_branch}\`合并至\`${mr.target_branch}\``));
    !_.isEmpty(commit) && content.push(this.generateListItem('提交详情', `\n${commit.author.name}: [${S(commit.message).collapseWhitespace()}](${commit.url})`));
    !_.isEmpty(builds) && content.push(this.generateListItem(`编译详情`, `\n${this.formatBuilds(builds, username, web_url).join('\n')}`))

    return content
  }

  async assembleMergeMsg(content, { user, project, object_attributes }) {
    const { name } = user || {};
    const { iid: mrId, url: mrUrl, target_branch, source_branch, state, title, description, last_commit: commit, updated_at } = object_attributes || {};
    const { name: projName, web_url, path_with_namespace } = project || {};

    let stateString = '', stateEnding = '';
    // opened, closed, locked, or merged
    switch (state) {
      case 'opened':
        stateString = '开启了'
        stateEnding = '，**请项目管理员确认**'
        break

      case 'closed':
        stateString = '取消了'
        stateEnding = '，**请提交人仔细检查**'
        break

      case 'locked':
        stateString = '锁定了'
        break

      case 'merged':
        stateString = '确认了'
        break

    }

    content.push(`\`${name}\`**${stateString}**[[#${mrId}合并请求 ${title}](${mrUrl})]，\`${source_branch}\`合并至\`${target_branch}\`${stateEnding}。`)
    content.push(`> 项目 [[${projName} | ${path_with_namespace}](${web_url})]\n`)
    content.push('**MR详情：**\n')

    updated_at && content.push(this.generateListItem('提交时间', moment(updated_at).format('MM-DD HH:mm')))
    description && content.push(this.generateListItem('合并详情', description))
    !_.isEmpty(commit) && content.push(this.generateListItem('提交详情', `\n${commit.author.name}: [${S(commit.message).collapseWhitespace()}](${commit.url})`));

    return content
  }

  async assembleTagPushMsq(content, { ref, user_name, project, message, commits, total_commits_count, before, after }) {
    const { name: projName, web_url, path_with_namespace } = project || {};

    const tag = ref.replace('refs/tags/', '')
    let op = ''

    if (before === '0000000000000000000000000000000000000000') {
      // new 
      op = '新增'
    } else if (after === '0000000000000000000000000000000000000000') {
      // remove 
      op = '删除'
    }

    content.push(`\`${user_name}\`${op}标签[[${path_with_namespace}/${tag}](${web_url}/-/tags/${tag})]。`)
    content.push(`> 项目 [[${projName} | ${path_with_namespace}](${web_url})]\n`)

    message && content.push(this.generateListItem('说明', message));
    total_commits_count && content.push(`**共提交${total_commits_count}次：**\n`)
    total_commits_count && content.push(this.generateListItem('', this.formatCommits(commits).text));
    return content
  }

  async assembleIssueMsq(content, { user, project, repository, object_attributes, assignees, assignee, labels }) {
    const { id: issueId, title, state, action, description, url: issueUrl } = object_attributes || {};
    const { name: projName, web_url, path_with_namespace } = project || {};
    const { name, username } = user || {};

    const { statusColor, statusString } = this.formatStatus(state);

    content.push(`[[#${issueId}议题](${issueUrl})] 状态:<font color="${statusColor}">${statusString}</font>，由<font color="info">${name}</font>触发。`);
    content.push(`> 项目 [[${projName} | ${path_with_namespace}](${web_url})]\n`);

    content.push('**议题详情：**\n');

    name && content.push(this.generateListItem('操作人', `\`${name}\``));

    content.push(this.generateListItem('标题', title, issueUrl));


    let descriptios = [];

    if (description) {
      descriptios = description.split('\n');
    }
    content.push(this.generateListItem('议题描述', ' '));
    for (let index = 0; index < descriptios.length; index++) {
      const element = descriptios[index];
      content.push(`> ${element}`); 
    }

    action && content.push(this.generateListItem('动作', `\`${action}\``));

    let responsible = '无';
    if (assignees && assignees.length) {
      responsible = assignees[0].name;
    }

    content.push(this.generateListItem('责任人', `\`${responsible}\``));

    let labelsStr = [];

    if (labels) {
      for (let index = 0; index < labels.length; index++) {
        labelsStr.push(labels[index].title); 
      }
    }

    content.push(this.generateListItem('标签', '<font color="info">'+ labelsStr.join(',')+'</font>'));

    return content;

  }


  async assembleWikiPageMsq(content, { user, project, wiki, object_attributes }) {
    const { name: projName, web_url, path_with_namespace } = project || {};
    const { name, username } = user || {};
    const { title, message, action, url: wiki_url } = object_attributes || {};

    content.push(`[**WIKI**] [标题:${title}](${wiki_url})，由<font color="info">${name}</font>触发。`);
    content.push(`> 项目 [[${projName} | ${path_with_namespace}](${web_url})]\n`);

    content.push('**WIKI详情：**\n');

    name && content.push(this.generateListItem('操作人', `\`${name}\``));

    content.push(this.generateListItem('标题', title, wiki_url));
    content.push(this.generateListItem('信息', message || '无'));


    action && content.push(this.generateListItem('动作', `\`${action}\``));

    return content;


  }

  async assembleNoteMsq(content, data) {
    const { object_attributes } = data || {};
    if (object_attributes) {
      const { noteable_type } = object_attributes || {};
      switch (noteable_type) {
        case 'Issue':
          return this.assembleIssueNoteMsq(content, data);
          break;
        default:
          return false;
          break;
      }
    } else {
      return false;
    }

  }

  async assembleIssueNoteMsq(content, { user, project, object_attributes, issue}) {
    const { id: issueNoteId,  url: issueNoteUrl, note } = object_attributes || {};
    const { title, state, description } = issue || {};
    const { name: projName, web_url, path_with_namespace } = project || {};
    const { name, username } = user || {};

    const { statusColor, statusString } = this.formatStatus(state);

    content.push(`[[#${issueNoteId}议题笔记](${issueNoteUrl})] 议题状态:<font color="${statusColor}">${statusString}</font>，所属议题:[${title}](${issueNoteUrl})，由<font color="info">${name}</font>触发。`);
    content.push(`> 项目 [[${projName} | ${path_with_namespace}](${web_url})]\n`);

    content.push('**议题笔记详情：**\n');

    name && content.push(this.generateListItem('操作人', `\`${name}\``));

    content.push(this.generateListItem('议题标题', title, issueNoteUrl));

    let descriptios = [];

    if (description) {
      descriptios = description.split('\n');
    }
    content.push(this.generateListItem('议题描述', ' '));
    for (let index = 0; index < descriptios.length; index++) {
      const element = descriptios[index];
      content.push(`> ${element}`); 
    }
    

    let notes = [];

    if (note) {
      notes = note.split('\n');
    }
    content.push(this.generateListItem('笔记内容', ' '));
    for (let index = 0; index < notes.length; index++) {
        const element = notes[index];
        content.push(`> ${element}`); 
    }

    return content;
  }

  formatDuration(duration) {
    if (duration < 60) return duration + '秒'
    if (duration < 3600) return Math.round(duration / 60 - 0.5) + '分' + (duration % 60) + '秒'
    return duration + '秒'
  }

  formatBuilds(builds, username, web_url) {
    builds.reverse();
    return builds.map(build => {
      const { id, name, stage, user } = build
      const { statusColor, statusString } = this.formatStatus(build.status)
      const buildUrl = web_url + '/-/jobs/' + id
      const byWho = (username === user.username ? '' : `，由\`${user.name}\`触发`)
      return `\`${stage}\`: [\`${name}\`](${buildUrl}) > <font color="${statusColor}">${statusString}</font>${byWho}`
    })
  }

  formatDescription(description) {
    let descriptions = [];

    return descriptions;
  }

  formatStatus(status) {
    let statusColor = 'comment', statusString, isNotify = true;
    switch (status) {
      case 'failed':
        statusColor = 'warning'
        statusString = '执行失败'
        break
      case 'success':
        statusColor = 'info'
        statusString = '执行成功'
        break
      case 'running':
        statusString = '运行中'
        break
      case 'pending':
        statusColor = 'warning'
        statusString = '准备中'
        isNotify = false
        break
      case 'canceled':
        statusString = '已取消'
        break
      case 'skipped':
        statusString = '已跳过'
        break
      case 'manual':
        statusString = '需手动触发'
        break
      case 'opened':
        statusColor = 'info'
        statusString = '打开'
        break
      case 'closed':
        statusColor = 'info'
        statusString = '关闭'
        break
      default:
        statusString = `状态未知 (${status})`
    }

    return { statusColor, statusString }
  }

  formatCommits(commits) {
    const changes = { added: 0, modified: 0, removed: 0 };
    const result = {
      commits: commits.map(commit => {
        const { author, message, url, added, modified, removed } = commit;
        changes.added += added.length || 0;
        changes.modified += modified.length || 0;
        changes.removed += removed.length || 0;

        return `${author.name}: [${S(message).collapseWhitespace()}](${url})`
      }), changes,
    };

    result.text = `新增: \`${result.changes.added}\` `
      + `修改: \`${result.changes.modified}\` `
      + `删除: \`${result.changes.removed}\` \n `
      + result.commits.join('\n')


    return result
  }

  generateListItem(label, text, url) {
    if (label) label = label + ':'

    if (url) {
      return `>${label} [${text}](${url})`
    } else {
      return `>${label} ${text}`
    }
  }

}

module.exports = WebhookService;