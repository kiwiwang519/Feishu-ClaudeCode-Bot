import { spawn, ChildProcess } from 'child_process';

export class ClaudeClient {
  private claudePath: string;

  constructor(claudePath: string = '/opt/homebrew/bin/claude') {
    this.claudePath = claudePath;
  }

  /**
   * 发送消息给 Claude CLI 并获取响应
   */
  async sendMessage(message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-p',           // print mode - 非交互模式
        '--print',      // 打印输出后退出
        '--output-format', 'text',
        '--no-session-persistence', // 不保存会话
        '--dangerously-skip-permissions', // 跳过权限检查
      ];

      // 构建系统提示，让 Claude 知道它是通过飞书对话的
      const systemPrompt = `你是 Claude Code，一个 AI 编程助手。请简洁地回答用户的问题。`;

      const fullPrompt = `${systemPrompt}\n\n用户消息: ${message}`;

      console.log('🤖 调用 Claude Code...');

      const proc = spawn(this.claudePath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          CLAUDE_CODE_SIMPLE: '1',
        },
      });

      let output = '';
      let errorOutput = '';

      proc.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      proc.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 || code === null) {
          console.log('✅ Claude Code 响应完成');
          resolve(output.trim());
        } else {
          console.error('❌ Claude Code 错误:', errorOutput);
          reject(new Error(`Claude 进程退出，代码: ${code}`));
        }
      });

      proc.on('error', (err) => {
        console.error('❌ Claude 启动失败:', err);
        reject(err);
      });

      // 发送消息到 stdin
      proc.stdin?.write(fullPrompt);
      proc.stdin?.end();
    });
  }

  /**
   * 流式响应
   */
  async sendMessageStream(message: string, onChunk: (chunk: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-p',
        '--print',
        '--output-format', 'text',
        '--no-session-persistence',
        '--dangerously-skip-permissions',
        '--include-partial-messages',
      ];

      const systemPrompt = `你是 Claude Code，一个 AI 编程助手。请简洁地回答用户的问题。`;
      const fullPrompt = `${systemPrompt}\n\n用户消息: ${message}`;

      console.log('🤖 调用 Claude Code (流式)...');

      const proc = spawn(this.claudePath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          CLAUDE_CODE_SIMPLE: '1',
        },
      });

      proc.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        onChunk(chunk);
      });

      proc.stderr?.on('data', (data: Buffer) => {
        console.error('Claude stderr:', data.toString());
      });

      proc.on('close', () => {
        console.log('✅ Claude Code 流式响应完成');
        resolve();
      });

      proc.on('error', reject);

      proc.stdin?.write(fullPrompt);
      proc.stdin?.end();
    });
  }
}

export default ClaudeClient;