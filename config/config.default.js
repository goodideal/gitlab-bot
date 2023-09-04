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
`\`{{user_name}}\` {{GB_op}} [[{{project.name}} | {{GB_branch}}分支]({{project.web_url}}/tree/{{GB_branch}})]
> 包含\`{{total_commits_count}}\`个提交, \`{{GB_changes.added}}\`新增 | \`{{GB_changes.modified}}\`修改 | \`{{GB_changes.removed}}\`删除
{{#commits}}
> 》 \`{{author.name}}\`: [{{title}}]({{url}})
{{/commits}}

{{#project}}项目信息: [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,

        pipeline: 
`[[#{{GB_pipelineId}}流水线 | {{ref}}分支]({{GB_pipelineUrl}})] <font color="{{GB_statusColor}}">{{GB_statusString}}</font>，由\`{{user.name}}\`通过\`{{GB_sourceString}}\`触发。
> **流水线详情:** 耗时\`{{GB_duration}}\`, {{object_attributes.stages.length}}个阶段 {{#object_attributes.stages}}{{.}} | {{/object_attributes.stages}}
> {{#merge_request}}**合并详情:** [{{title}}]({{url}}), \`{{source_branch}}\`合并至\`{{target_branch}}\`{{/merge_request}}
> {{#commit}}**提交详情:** \`{{author.name}}\`: [{{message}}]({{url}}){{/commit}}
> **编译详情**: 
{{#builds}}> 》 [{{stage}} /\`{{name}}\`-> <font color="{{GB_statusColor}}">{{GB_statusString}}</font> ({{user.name}})]({{GB_buildUrl}})
{{/builds}}

{{#project}}项目信息: [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,

        merge_request:
`{{GB_stateAction}} : \`{{user.name}}\`**{{GB_stateString}}{{#object_attributes}}**[[#{{iid}}合并请求 {{title}}]({{iid}})]，从\`{{source_branch}}\`合并至\`{{target_branch}}\`{{/object_attributes}}
> **MR详情:**
> 提交时间: {{GB_updated_at}}
> 提交详情: 
> {{#object_attributes.last_commit}}》 {{author.name}}: [{{title}}]({{url}}){{/object_attributes.last_commit}}

{{#project}}项目信息: [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        tag_push:
`\`{{user_name}}\`{{GB_op}}标签 [[{{project.name}} | {{GB_tag}}]({{web_url}}/-/tags/{{GB_tag}})]。
> 包含\`{{total_commits_count}}\`个提交, \`{{GB_changes.added}}\`新增 | \`{{GB_changes.modified}}\`修改 | \`{{GB_changes.removed}}\`删除
{{#commits}}
> 》 \`{{author.name}}\`: [{{title}}]({{url}})
{{/commits}}
`,
        issue:
`\`{{user.name}}\`<font color="{{GB_statusColor}}">{{GB_statusString}}</font> {{#object_attributes}}[[#{{id}}议题]({{url}})]{{/object_attributes}}
> **议题详情:**
{{#object_attributes}}> 标题: [{{title}}]({{url}})
> 描述: {{description}}
> 动作: {{action}}{{/object_attributes}}
> 责任人: {{#assignees}}\`{{name}}\`, {{/assignees}}
> 标签: {{#labels}}<font color="info">{{title}}</font>, {{/labels}}

{{#project}}项目信息: [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        wiki:
`\`{{user.name}}\` {{#object_attributes}}<font color="{{GB_action.actionColor}}">{{GB_action.actionString}}</font> WIKI页 [{{title}}](url)
> 内容: {{content}}{{/object_attributes}}

{{#project}}项目信息: [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        note:
`\`{{user.name}}\` 评论了 {{#object_attributes}} [{{note}}](url)
> **评论详情:**
> 类型: \`{{noteable_type}}\`{{/object_attributes}}
{{#merge_request}}> 标题: [{{title}}]({{url}})
> 分支: 从\`{{source_branch}}\`合并至\`{{target_branch}}\`
> 责任人: \`{{assignee.name}}\`{{/merge_request}}
{{#issue}}> 标题: [{{title}}]({{url}})
> 状态: \`{{state}}\`{{/issue}}
{{#commit}}> 提交: {{author.name}} : [{{message}}]({{url}}){{/commit}}
{{#snippet}}> 标题: [{{title}}]({{url}})
文件: {{file_name}}{{/snippet}}

{{#project}}项目信息: [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`
      },
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
