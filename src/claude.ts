import { Anthropic } from '@anthropic-ai/sdk';

export class ClaudeClient {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 环境变量未设置');
    }

    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * 发送消息给 Claude 并获取响应
   */
  async sendMessage(message: string): Promise<string> {
    console.log('🤖 调用 Claude API...');

    try {
      const response = await this.client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'MiniMax-M2.5',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      });

      // 提取文本内容
      const textContent = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('');

      console.log('✅ Claude 响应完成');
      return textContent || '抱歉，我无法生成有效的响应。';
    } catch (error) {
      console.error('❌ Claude API 调用失败:', error);
      throw error;
    }
  }

  /**
   * 使用流式响应
   */
  async sendMessageStream(message: string, onChunk: (chunk: string) => void): Promise<void> {
    console.log('🤖 调用 Claude API (流式)...');

    try {
      const stream = await this.client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'MiniMax-M2.5',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          onChunk(chunk.delta.text);
        }
      }

      console.log('✅ Claude 流式响应完成');
    } catch (error) {
      console.error('❌ Claude API 流式调用失败:', error);
      throw error;
    }
  }
}

export default ClaudeClient;