import { Client, Domain, EventDispatcher, WSClient } from '@larksuiteoapi/node-sdk';
import * as fs from 'fs';
import * as path from 'path';

export interface FeishuConfig {
  appId: string;
  appSecret: string;
}

export interface MessageEvent {
  message: {
    message_id: string;
    chat_id: string;
    sender: {
      sender_id: {
        user_id?: string;
        open_id?: string;
        union_id?: string;
      };
    };
    body: {
      content: string;
    };
  };
}

export class FeishuBot {
  private client: Client;
  private config: FeishuConfig;
  private eventHandlers: Map<string, (data: any) => Promise<any>> = new Map();
  private wsClient: WSClient | null = null;

  constructor(configPath: string = path.join(__dirname, '../../config/feishu.json')) {
    // 加载配置
    const configData = fs.readFileSync(configPath, 'utf-8');
    this.config = JSON.parse(configData);

    // 创建飞书客户端
    this.client = new Client({
      appId: this.config.appId,
      appSecret: this.config.appSecret,
      domain: Domain.Feishu,
    });
  }

  /**
   * 注册事件处理器
   */
  on(event: string, handler: (data: any) => Promise<any>): void {
    this.eventHandlers.set(event, handler);
  }

  /**
   * 启动 WebSocket 长连接
   */
  async start(): Promise<void> {
    console.log('🤖 启动飞书机器人...');

    this.wsClient = new WSClient({
      appId: this.config.appId,
      appSecret: this.config.appSecret,
    });

    // 创建事件分发器
    const eventDispatcher = new EventDispatcher({});

    // 注册消息事件处理
    eventDispatcher.register({
      'im.message.receive_v1': async (data: any) => {
        // 解析消息内容 - 飞书消息内容是 JSON 字符串
        let content = '';
        try {
          const contentObj = JSON.parse(data.message?.content || '{}');
          content = contentObj.text || '';
        } catch (e) {
          content = data.message?.content || '';
        }

        const messageId = data.message?.message_id || '';
        const chatId = data.message?.chat_id || '';
        const userId = data.message?.sender?.sender_id?.user_id ||
                       data.message?.sender?.sender_id?.open_id || '';

        console.log('📩 收到消息:', content, '| 用户:', userId, '| 会话:', chatId);

        const handler = this.eventHandlers.get('message');
        if (handler) {
          try {
            await handler({
              content,
              messageId,
              chatId,
              userId,
            });
          } catch (error) {
            console.error('❌ 消息处理错误:', error);
          }
        }
        return { code: 0 };
      },
    });

    // 启动 WebSocket 连接
    if (this.wsClient) {
      await this.wsClient.start({
        eventDispatcher,
      });
    }

    console.log('✅ 飞书机器人已启动，等待消息...');
  }

  /**
   * 发送消息
   */
  async sendMessage(receiveId: string, content: string, msgType: string = 'text'): Promise<void> {
    // 判断是群聊还是私聊
    const receiveIdType = receiveId.startsWith('oc_') || receiveId.startsWith('cli_') ? 'chat_id' : 'user_id';

    try {
      await this.client.im.message.create({
        params: { receive_id_type: receiveIdType },
        data: {
          receive_id: receiveId,
          content: JSON.stringify({ text: content }),
          msg_type: msgType,
        },
      });
    } catch (error) {
      console.error('❌ 发送消息失败:', error);
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string): Promise<any> {
    try {
      const response = await this.client.contact.user.get({
        path: { user_id: userId },
      } as any);
      return response.data;
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 停止服务
   */
  async stop(): Promise<void> {
    if (this.wsClient) {
      console.log('🛑 停止飞书机器人...');
      this.wsClient = null;
    }
  }
}

export default FeishuBot;