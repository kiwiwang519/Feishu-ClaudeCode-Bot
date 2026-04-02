import { FeishuBot } from './feishu';
import { ClaudeClient } from './claude';
import * as fs from 'fs';
import * as path from 'path';

// 配置路径
const CONFIG_PATH = path.join(__dirname, '../config/feishu.json');

// 检查配置文件
if (!fs.existsSync(CONFIG_PATH)) {
  console.error('❌ 配置文件不存在，请复制 config/feishu.example.json 为 config/feishu.json 并填入配置');
  process.exit(1);
}

// 初始化飞书机器人
const feishu = new FeishuBot(CONFIG_PATH);

// 初始化 Claude 客户端
const claude = new ClaudeClient();

// 已处理的消息ID集合（防止重复处理）
const processedMessages = new Set<string>();

// 消息处理
feishu.on('message', async (data) => {
  const { content, messageId, chatId, userId } = data;

  // 检查是否已处理过这条消息
  if (messageId && processedMessages.has(messageId)) {
    console.log(`⏭️ 跳过重复消息: ${messageId}`);
    return;
  }

  // 记录消息ID
  if (messageId) {
    processedMessages.add(messageId);
    // 保持集合大小，防止内存泄漏
    if (processedMessages.size > 1000) {
      const arr = Array.from(processedMessages);
      processedMessages.clear();
      arr.slice(-500).forEach(id => processedMessages.add(id));
    }
  }

  console.log(`📩 来自用户 ${userId}: ${content}`);

  if (!content.trim()) {
    return;
  }

  // 发送"正在思考"消息
  await feishu.sendMessage(chatId, '🤔 正在思考...');

  try {
    // 调用 Claude
    const response = await claude.sendMessage(content);

    // 发送响应
    await feishu.sendMessage(chatId, response || '抱歉，我无法生成有效的响应。');
  } catch (error) {
    console.error('❌ Claude 调用失败:', error);
    await feishu.sendMessage(chatId, `❌ 抱歉，处理您的请求时出错: ${error}`);
  }
});

// 启动
async function main() {
  try {
    await feishu.start();
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 优雅退出
process.on('SIGINT', async () => {
  console.log('\n🛑 收到退出信号，正在关闭...');
  await feishu.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 收到终止信号，正在关闭...');
  await feishu.stop();
  process.exit(0);
});

main();