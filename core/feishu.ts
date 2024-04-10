import { Client, AppType, Domain, EventDispatcher } from '@larksuiteoapi/node-sdk';
import { EventEmitter } from "events";

export interface FeishuMessage {
    sender: {
        sender_id?: {
            union_id?: string;
            user_id?: string;
            open_id?: string;
        };
        sender_type: string;
        tenant_key?: string;
    };
    message: {
        message_id: string;
        root_id?: string;
        parent_id?: string;
        create_time: string;
        chat_id: string;
        chat_type: string;
        message_type: string;
        content: string;
        mentions?: Array<{
            key: string;
            id: {
                union_id?: string;
                user_id?: string;
                open_id?: string;
            };
            name: string;
            tenant_key?: string;
        }>;
    }
}


export class Feishu {

    private client: Client;
    private eventDispatcher: EventDispatcher;

    private event: EventEmitter = new EventEmitter();
    public on = this.event.on;
    public emit = this.event.emit;

    get EventDispatcher() {
        return this.eventDispatcher
    }

    constructor(appId: string, appSecret: string, domain: Domain = Domain.Feishu) {
        this.client = new Client({
            appId,
            appSecret,
            appType: AppType.SelfBuild,
            domain,
        })

        this.eventDispatcher = new EventDispatcher({})
        this.eventDispatcher.register({
            'im.message.receive_v1': (data: FeishuMessage) => this.emit("message", data)
        });
     
    }

    async sendMessage(message: any) {
        this.client.im.message.create({
            params: {
                receive_id_type: 'chat_id',
            },
            data: {
                //** 替换成飞书app */
                receive_id: 'oc_xxxxxxxxxxxxxxxx',
                content: JSON.stringify({ text: message }),
                msg_type: 'text',
            },
        });
    }

    /** 发送私聊消息 */
    async sendUserMessage(user_id: string, message: any) {
        this.client.im.message.create({
            params: {
                receive_id_type: 'open_id',
            },
            data: {
                receive_id: user_id,
                content: JSON.stringify({ text: message }),
                msg_type: 'text',
            },
        });
    }


}