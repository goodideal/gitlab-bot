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
{{#total_commits_count}}> **共提交\`{{total_commits_count}}\`次：**{{/total_commits_count}}

{{#commits}}
> {{author.name}}: [{{title}}]({{{url}}})
{{/commits}}`,

        pipeline: 
`[[#{{pipelineId}}流水线]({{{pipelineUrl}}})] <font color="{{GB_statusColor}}">{{GB_statusString}}</font>，位于{{ref}}分支，由<font color="info">{{GB_sourceString}}</font>触发。
> 项目 [[{{projName}} | {{namespace}}]({{web_url}})]
> **流水线详情：**
> 操作人: {{name}}
> 总耗时: {{duration_formatted}}
> 共{{stages.length}}个阶段: {{stages_string}}
{{#mr}}> 合并详情: [{{title}}]({{url}})，\`{{source_branch}}\`合并至\`{{target_branch}}\`{{/mr}}
{{#commit}}> 提交详情: {{author.name}}[{{message}}]({{{url}}}){{/commit}}
{{#builds}}> 编译详情: {{/builds}}
{{#builds}}
> \`{{stage}}\`: [\`{{name}}\`]({{GB_buildUrl}}}) > <font color="{{GB_statusColor}}">{{GB_statusString}}</font>由\`{{name}}\`触发
{{/builds}}

`,
      },
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
