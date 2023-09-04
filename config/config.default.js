'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1576723863361_2114';

  config.security = {
    csrf: {
      enable: false,
    },
  };
  config.logger = {
    level: 'DEBUG',
  };
  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    platform: ['qywx'],
    response: {
      qywx: {
        content: 'markdown.content',
        body: {
          msgtype: 'markdown',
          markdown: {
            content: '',
          },
        },
      },
      feishu: {
        content: 'card',
        body: {
          msg_type: 'interactive',
          card: {},
        },
      },
    },
    template: {
      qywx: {
        push: 
`\`{{user_name}}\` {{GB_op}} [[{{project.name}} | {{GB_branch}}分支]({{project.web_url}}}/tree/{{GB_branch}})]
> 包含\`{{total_commits_count}}\`个提交, \`{{GB_changes.added}}\`新增 | \`{{GB_changes.modified}}\`修改 | \`{{GB_changes.removed}}\`删除
{{#commits}}
> 》 \`{{author.name}}\`: [{{title}}]({{{url}}})
{{/commits}}

{{#project}}项目信息: [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,

        pipeline: 
`[[#{{GB_pipelineId}}流水线 | {{ref}}分支]({{{GB_pipelineUrl}}})] <font color="{{GB_statusColor}}">{{GB_statusString}}</font>，由\`{{user.name}}\`通过\`{{GB_sourceString}}\`触发。
> **流水线详情:** 耗时\`{{GB_duration}}\`, {{stages.length}}个阶段 {{#stages}}{{.}} | {{/stages}}
> {{#merge_request}}**合并详情:** [{{title}}]({{url}}), \`{{source_branch}}\`合并至\`{{target_branch}}\`{{/merge_request}}
> {{#commit}}**提交详情:** \`{{author.name}}\`: [{{message}}]({{{url}}}){{/commit}}
> **编译详情**: 
{{#builds}}> 》 [{{stage}} > \`{{name}}\` : <font color="{{GB_statusColor}}">{{GB_statusString}}</font> ({{user.name}})]({{GB_buildUrl}}})
{{/builds}}

{{#project}}项目信息: [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
      },
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
