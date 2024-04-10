"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feishu = void 0;
const node_sdk_1 = require("@larksuiteoapi/node-sdk");
const events_1 = require("events");
class Feishu {
    get EventDispatcher() {
        return this.eventDispatcher;
    }
    constructor(appId, appSecret, domain = node_sdk_1.Domain.Feishu) {
        this.event = new events_1.EventEmitter();
        this.on = this.event.on;
        this.emit = this.event.emit;
        this.client = new node_sdk_1.Client({
            appId,
            appSecret,
            appType: node_sdk_1.AppType.SelfBuild,
            domain,
        });
        this.eventDispatcher = new node_sdk_1.EventDispatcher({});
        this.eventDispatcher.register({
            'im.message.receive_v1': (data) => this.emit("message", data)
        });
    }
    async sendMessage(message) {
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
    async sendUserMessage(user_id, message) {
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
exports.Feishu = Feishu;
