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

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    showOriginal: false,
    supportPlatforms: ['qywx', 'feishu'],
    platform: 'qywx',
    response: {
      qywx: {
        path: 'markdown.content',
        body: {
          msgtype: 'markdown',
          markdown: {
            content: '',
          },
        },
      },
      feishu: {
        path: 'card.elements.0.content',
        body: {
          msg_type: 'interactive',
          card: {
            elements: [
              {
                tag: 'markdown',
                content: '',
              },
            ],
            header: {
              template: 'blue',
              title: {
                content: 'Gitlab机器人通知',
                tag: 'plain_text',
              },
            },
          },
        },
      },
      default: {},
    },
    template: {
      qywx: {
        push: `\`{{user_name}}\` {{GB_op}} [[{{project.name}} | {{GB_branch}}分支]({{project.web_url}}/tree/{{GB_branch}})]
> 》 包含\`{{total_commits_count}}\`个提交， 新增\`{{GB_changes.added}}\` | 修改\`{{GB_changes.modified}}\` | 删除\`{{GB_changes.removed}}\`
{{#commits}}
> - \`{{author.name}}\`： [{{title}}]({{url}})
{{/commits}}

{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,

        pipeline: `[[#{{GB_pipelineId}}流水线 | {{object_attributes.ref}}分支]({{GB_pipelineUrl}})] <font color="{{GB_status.color}}">{{GB_status.str}}</font>，由\`{{user.name}}\`通过\`{{GB_sourceString}}\`触发。
> **流水线详情：** 耗时\`{{GB_duration}}\`，{{object_attributes.stages.length}}个阶段 {{#object_attributes.stages}}{{.}} | {{/object_attributes.stages}}
> {{#merge_request}}**合并详情：** [{{title}}]({{url}})，\`{{source_branch}}\`合并至\`{{target_branch}}\`{{/merge_request}}
> {{#commit}}**提交详情：** \`{{author.name}}\`： [{{message}}]({{url}}){{/commit}}
> **编译详情**： 
{{#GB_builds}}> 》 \`{{stage}}\`： 
{{#builds}}> - [\`{{name}}\`{{#GB_duration}}({{GB_duration}}){{/GB_duration}} -> <font color="{{GB_status.color}}">{{GB_status.str}}{{#failure_reason}}，{{failure_reason}}{{/failure_reason}}</font> {{#GB_user}}({{GB_user}}){{/GB_user}}]({{GB_url}})
{{/builds}}
{{/GB_builds}}

{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,

        merge_request: `{{#GB_stateAction}}{{GB_stateAction}} ：{{/GB_stateAction}}\`{{user.name}}\`**{{GB_stateString}}{{#object_attributes}}**[[#{{iid}}合并请求 {{title}}]({{iid}})]，从\`{{source_branch}}\`合并至\`{{target_branch}}\`{{/object_attributes}}
> **MR详情：**
> 提交时间： {{GB_updated_at}}
> 提交详情： 
> {{#object_attributes.last_commit}}》 {{author.name}}： [{{title}}]({{url}}){{/object_attributes.last_commit}}

{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        tag_push: `\`{{user_name}}\`{{GB_op}}标签 [[{{project.name}} | {{GB_tag}}]({{web_url}}/-/tags/{{GB_tag}})]。
> 包含\`{{total_commits_count}}\`个提交，\`{{GB_changes.added}}\`新增 | \`{{GB_changes.modified}}\`修改 | \`{{GB_changes.removed}}\`删除
{{#commits}}
> 》 \`{{author.name}}\`： [{{title}}]({{url}})
{{/commits}}
{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        issue: `\`{{user.name}}\`<font color="{{GB_state.color}}">{{GB_state.str}}</font> {{#object_attributes}}[[#{{id}}议题]({{url}})]{{/object_attributes}}
> **议题详情：**
{{#object_attributes}}> 标题： [{{title}}]({{url}})
> 描述： {{description}}
> 动作： {{action}}{{/object_attributes}}
> 责任人： {{#assignees}}\`{{name}}\`，{{/assignees}}
> 标签： {{#labels}}<font color="info">{{title}}</font>，{{/labels}}

{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        wiki: `\`{{user.name}}\` {{#object_attributes}}<font color="{{GB_action.actionColor}}">{{GB_action.actionString}}</font> WIKI页 [{{title}}](url)
> 内容： {{content}}{{/object_attributes}}

{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        note: `\`{{user.name}}\` 评论了 {{#object_attributes}} [{{note}}](url)
> **评论详情：**
> 类型： \`{{noteable_type}}\`{{/object_attributes}}
{{#merge_request}}> 标题： [{{title}}]({{url}})
> 分支： 从\`{{source_branch}}\`合并至\`{{target_branch}}\`
> 责任人： \`{{assignee.name}}\`{{/merge_request}}
{{#issue}}> 标题： [{{title}}]({{url}})
> 状态： \`{{state}}\`{{/issue}}
{{#commit}}> 提交： {{author.name}} ： [{{message}}]({{url}}){{/commit}}
{{#snippet}}> 标题： [{{title}}]({{url}})
文件： {{file_name}}{{/snippet}}

{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        project_action: `{{owner_name}} 做了 \`{{event_name}}\` 操作
> 项目路径：{{path_with_namespace}}`,
        //         repository_action： `{{user_name}} 做了 \`{{event_name}}\` 操作
        // {{#project}}> 项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}`,
        user_action: '`{{event_name}}`： {{name}}({{username}} {{email}})',
      },
      feishu: {
        push: `**{{user_name}}** {{GB_op}} [[{{project.name}} | {{GB_branch}}分支]({{project.web_url}}/tree/{{GB_branch}})]
> 包含**<font color="green">{{total_commits_count}}</font>**个提交，新增 **<font color="green">{{GB_changes.added}}</font>** | 修改 **<font color="grey">{{GB_changes.modified}}</font>** | 删除 **<font color="red">{{GB_changes.removed}}</font>**
{{#commits}}
> - **<font color="green">{{author.name}}</font>**： [{{title}}]({{url}})
{{/commits}}
{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,

        pipeline: `[[#{{GB_pipelineId}}流水线 | {{object_attributes.ref}}分支]({{GB_pipelineUrl}})] **<font color="{{GB_status.color}}">{{GB_status.str}}</font>**，由**{{user.name}}**通过**{{GB_sourceString}}**触发。
> **流水线详情**： 耗时**<font color="green">{{GB_duration}}</font>**，{{object_attributes.stages.length}}个阶段 {{#object_attributes.stages}}{{.}} | {{/object_attributes.stages}}
> {{#merge_request}}**合并详情：** [{{title}}]({{url}})，'{{source_branch}}' 合并至 '{{target_branch}}'{{/merge_request}}
> {{#commit}}**提交详情：** {{author.name}}：[{{message}}]({{url}}){{/commit}}
> **编译详情**： 
{{#GB_builds}}> **{{stage}}**： 
{{#builds}}>   - [**{{name}}**{{#GB_duration}}({{GB_duration}}){{/GB_duration}}]({{GB_url}}) -> <font color="{{GB_status.color}}">{{GB_status.str}}{{#failure_reason}}，{{failure_reason}}{{/failure_reason}}</font> {{#GB_user}}({{GB_user}}){{/GB_user}}
{{/builds}}
{{/GB_builds}}
{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,

        merge_request: `{{#GB_stateAction}}{{GB_stateAction}} ：{{/GB_stateAction}}**{{user.name}}**{{GB_stateString}}{{#object_attributes}}**[[#{{iid}}合并请求 {{title}}]({{iid}})]，从 '{{source_branch}}' 合并至 '{{target_branch}}'{{/object_attributes}}
> **MR详情：**
> 提交时间： {{GB_updated_at}}
> 提交详情： 
> {{#object_attributes.last_commit}}》 {{author.name}}： [{{title}}]({{url}}){{/object_attributes.last_commit}}
{{#project}}项目信息:[[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        tag_push: `**{{user_name}}** {{GB_op}} 标签 [[{{project.name}} | {{GB_tag}}]({{web_url}}/-/tags/{{GB_tag}})]。
> 包含**<font color="green">{{total_commits_count}}</font>**个提交，新增 **<font color="green">{{GB_changes.added}}</font>** | 修改 **<font color="grey">{{GB_changes.modified}}</font>** | 删除 **<font color="red">{{GB_changes.removed}}</font>**
{{#commits}}
> - **<font color="green">{{author.name}}</font>**： [{{title}}]({{url}})
{{/commits}}
{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        issue: `**{{user.name}}**<font color="{{GB_state.color}}">{{GB_state.str}}</font>** {{#object_attributes}}[[#{{id}}议题]({{url}})]{{/object_attributes}}
> **议题详情：**
{{#object_attributes}}> 标题： [{{title}}]({{url}}) 
> 描述： {{description}}
> 动作： {{action}}{{/object_attributes}}
> 责任人： {{#assignees}}**<font color="green">{{name}}</font>**，{{/assignees}}
> 标签： {{#labels}}<font color="green">{{title}}</font>**，{{/labels}}
{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        wiki: `**{{user.name}}** {{#object_attributes}}<font color="{{GB_action.actionColor}}">{{GB_action.actionString}}</font>** WIKI页 [{{title}}](url)
> 内容： {{content}}{{/object_attributes}}
{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        note: `**{{user.name}}** 评论了 {{#object_attributes}} [{{note}}](url)
> **评论详情：**
> 类型： **<font color="green">{{noteable_type}}</font>**{/object_attributes}}
{{#merge_request}}> 标题： [{{title}}]({{url}})
> 分支： 从 '{{source_branch}}' 合并至 '{{target_branch}}'
> 责任人： **<font color="green">{{assignee.name}}**</font>{{/merge_request}}
{{#issue}}> 标题： [{{title}}]({{url}})
> 状态： **<font color="green">{{state}}**</font>{{/issue}}
{{#commit}}> 提交： {{author.name}} ： [{{message}}]({{url}}){{/commit}}
{{#snippet}}> 标题： [{{title}}]({{url}})
文件： {{file_name}}{{/snippet}}
{{#project}}项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}
`,
        project_action: `{{owner_name}} 做了 **<font color="green">{{event_name}}</font>** 操作
> 项目路径：{{path_with_namespace}}`,
        //         repository_action： `{{user_name}} 做了 **<font color="green">{{event_name}}</font>** 操作
        // {{#project}}> 项目信息： [[{{name}} / {{namespace}}]({{web_url}})]{{/project}}`,
        user_action: '`{{event_name}}`： {{name}}({{username}} {{email}})',
      },
      default: {
        push: '',
        pipeline: '',
        merge_request: '',
        tag_push: '',
        issue: '',
        wiki: '',
        note: '',
        project_action: '',
        user_action: '',
      },
    },
    color: {
      qywx: {
        red: 'warning',
        green: 'info',
        grey: 'comment',
      },
      feishu: {
        red: 'red',
        green: 'green',
        grey: 'grey',
      },
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
