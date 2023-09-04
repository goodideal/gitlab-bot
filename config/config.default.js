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
`\`{{user_name}}\` {{GB_op}} [[{{project.name}}/{{{branch}}}]({{{project.web_url}}}/tree/{{{branch}}})].
{{#total_commits_count}}> **包含\`{{total_commits_count}}\`个提交：**{{/total_commits_count}}
{{#commits}}
> 》 \`{{author.name}}\`: [{{title}}]({{{url}}})
{{/commits}}

{{#project}}项目信息: [[{{name}} | {{namespace}}]({{web_url}})]{{/project}}
`,

        pipeline: 
`[[#{{GB_pipelineId}}流水线]({{{GB_pipelineUrl}}})] <font color="{{GB_statusColor}}">{{GB_statusString}}</font>，位于\`{{ref}}\`分支，由\`{{GB_sourceString}}\`触发。
> **流水线详情:**
> 总耗时: {{GB_duration}}
> 共{{stages.length}}个阶段: {{#stages}}{{.}} | {{/stages}}
> 操作人: {{user.name}}
{{#mr}}> **合并详情:** [{{title}}]({{url}}), \`{{source_branch}}\`合并至\`{{target_branch}}\`{{/mr}}
{{#commit}}> **提交详情:** \`{{author.name}}\`: [{{message}}]({{{url}}}){{/commit}}
> **编译详情**: 
{{#builds}}> \`{{stage}}\`: [\`{{name}}\`]({{GB_buildUrl}}}) > <font color="{{GB_statusColor}}">{{GB_statusString}} </font> ({{user.name}}触发)
{{/builds}}

{{#project}}项目信息: [[{{name}} | {{namespace}}]({{web_url}})]{{/project}}
`,
      },
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
