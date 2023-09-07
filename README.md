# Gitlab通知机器人

- [Gitlab通知机器人](#gitlab通知机器人)
    - [功能展示](#功能展示)
  - [系统对接](#系统对接)
    - [环境变量](#环境变量)
    - [与企业微信对接](#与企业微信对接)
    - [与飞书对接](#与飞书对接)
  - [应用部署运行](#应用部署运行)
    - [使用Docker部署](#使用docker部署)
    - [直接运行](#直接运行)
  - [与Gitlab集成](#与gitlab集成)


将`Gitlab`的`push`、`tag push`、`merge request`和`pipeline`推送到第三方IM平台的机器人，如企业微信、飞书等；

`1.0.0`: 采用内置代码，且仅支持企业微信；

`2.x.x`: 通过消息模板，可自行配置通知消息格式和字段，具体配置方式，参见[mustache官方文档](https://github.com/janl/mustache.js)

todo:

- [X] 使用mustache模板
- [X] 增加note通知
- [X] 增加system hook通知，参考 [gitlab system hook](https://docs.gitlab.com/ee/administration/system_hooks.html)
- [X] 支持飞书机器人
- [ ] 增加消息模板配置文件
- [ ] 支持按天统计数据


---

### 功能展示

具体见下图：

Gitlab push 代码推送

![alt gitlab-push-msg-1](./docs/gitlab-push-msg-1.png)

Gitlab push 新建分支

![alt gitlab-push-msg-2](./docs/gitlab-push-msg-2.png)

Gitlab push 删除分支

![alt gitlab-push-msg-3](./docs/gitlab-push-msg-3.png)

Gitlab push tag 推标签

![alt gitlab-push-tag-msg-1](./docs/gitlab-push-tag-msg-1.png)

Gitlab merge request 合并请求

![alt gitlab-mr-msg-1](./docs/gitlab-mr-msg-1.png)

Gitlab pipeline 流水线

![alt gitlab-pipeline-msg](./docs/gitlab-pipeline-msg-1.png)

## 系统对接

### 环境变量


- `PLATFORM`：`qywx | feishu`，默认为`qywx`，即：企业微信、飞书；
- `WEBHOOK_URL_XXX`：机器人webhook地址，具体配置参考[应用部署运行](#应用部署运行)；
- `SHOW_ORIGINAL`：`true | false`，默认为`false`，如果无模板，是否发送原消息体；

### 与企业微信对接

如何添加群机器人可自行百度，[企业微信群机器人配置说明](https://work.weixin.qq.com/api/doc/90000/90136/91770)。

### 与飞书对接

飞书群里添加机器人。[飞书群机器人配置说明](https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot)

![alt gitlab-feishu](./docs/gitlab-feishu.png)


飞书webhook地址示例：https://open.feishu.cn/open-apis/bot/v2/hook/UUID


## 应用部署运行

应用通过环境变量添加机器人webhook地址，`WEBHOOK_URL_`作为前缀，后面可接不同的推送组。

如环境变量`WEBHOOK_URL_PROJ`，`PROJ`则为推送组。推送组用于与`Gitlab`的集成时使用。

例如：
- 机器人的webhook地址为：https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=ABCDEFG
- 推送组为`PROJ`。

则环境变量设为：
```
WEBHOOK_URL_PROJ=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=ABCDEFG
```

一个应用可以添加多个推送组。

### 使用Docker部署

修改`docker-compose.yml`文件中的`WEBHOOK_URL`环境变量，添加`企业微信机器人`的`webhook`地址。

```bash
docker-compose up -d
```

通过`:7001`端口访问服务。

### 直接运行

首先系统安装了`node`运行环境。

```bash
WEBHOOK_URL_PROJ=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=ABCDEFG npm start
```

通过`:7001`端口访问服务。

## 与Gitlab集成

进到项目，`settings` => `integrations`。

URL填写服务的地址和端口号+推送组。

例如，服务器地址为：https://192.168.100.100:7001，推送组为PROJ。

URL填写：https://192.168.100.100:7001/proj

具体设置，参见下图：

![alt gitlab集成图片](./docs/gitlab-integration-1.png)