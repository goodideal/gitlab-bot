/* eslint valid-jsdoc: "off" */

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
    // myAppName: 'egg',
    template: {
      push: `{{{user_name}}} {{{op}}} [[{{{path_with_namespace}}}/{{{branch}}}]({{{web_url}}}/tree/{{{branch}}})].
> 项目 [[{{{projName}}} | {{{path_with_namespace}}}]({{{web_url}}})]
{{{#total_commits_count}}}
**共提交{{{total_commits_count}}}次：**
> {{{/total_commits_count}}}
{{#commits}}
> {{{author.name}}} [{{message}}]({{{url}}})
{{/commits}}`,
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};