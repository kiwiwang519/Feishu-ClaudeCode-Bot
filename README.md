# Feishu Claude Bot

通过飞书 WebSocket 长连接连接 Claude Code 的机器人。

## 功能特性

- 🔌 **WebSocket 长连接**：使用飞书 WebSocket 接收消息，无需公网域名
- 🤖 **Claude Code 集成**：直接调用 Claude CLI 进行对话
- 💬 **消息收发**：支持飞书单聊和群聊消息

## 快速开始

### 1. 克隆项目

```bash
cd claudecode/projects
```

### 2. 安装依赖

```bash
cd feishu-claude-bot
npm install
```

### 3. 配置飞书应用

1. 前往 [飞书开放平台](https://open.feishu.cn/app) 创建"企业自建应用"
2. **开启能力**：左侧菜单栏「添加应用能力」-> 开启「机器人」
3. **事件订阅**：
   - 「订阅方式」选择 👉 **使用长连接接收事件**
   - 「添加事件」勾选：`接收消息 (im.message.receive_v1)`
4. **权限申请**：
   - `获取与发送单聊、群组消息` (im:message)
   - `以应用的身份发消息` (im:message:send_as_bot)
   - `获取群组信息` (im:chat)
   - `获取用户发给机器人的单聊消息` (im:message:readonly)
   - `获取用户基本信息` (contact:user.base:readonly)
5. **发布版本**：进入「版本管理与发布」，创建版本并提交发布

### 4. 配置本地密钥

复制配置文件并填入凭证：

```bash
cp config/feishu.example.json config/feishu.json
```

编辑 `config/feishu.json`，填入你的飞书应用凭证：

```json
{
  "appId": "cli_xxxxxxxxxxxx",
  "appSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### 5. 启动

```bash
# 开发模式 (ts-node)
npm run dev

# 生产模式
npm run build
npm start
```

### 6. 测试

打开飞书，向你的机器人发送一条消息，开始对话！

## 项目结构

```
feishu-claude-bot/
├── src/
│   ├── index.ts      # 入口文件
│   ├── feishu.ts     # 飞书 WebSocket 连接
│   └── claude.ts    # Claude 客户端
├── config/
│   └── feishu.example.json  # 配置模板
├── package.json
├── tsconfig.json
└── README.md
```

## 注意事项

- 确保 Claude CLI 已安装且在 PATH 中（默认 `/opt/homebrew/bin/claude`）
- 机器人需要发布版本后才能在飞书中使用
- 消息响应需要 3 秒内处理完成