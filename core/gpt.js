"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGPT = void 0;
const chatgpt_1 = require("chatgpt");
const events_1 = require("events");
class ChatGPT {
    constructor() {
        /** 发送状态 */
        this.sending = false;
        /** 对话缓存 */
        this.sessionMap = new Map();
        /** 超时时间(秒) */
        this.timeout = 60 * 1000;
        this.event = new events_1.EventEmitter();
        this.on = this.event.on;
        this.emit = this.event.emit;
        this.gptAPI = new chatgpt_1.ChatGPTAPI({
            //completionParams: { 'model': 'gpt-4' },
            apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxx",
            systemMessage: `如果一个人第一次和你交流,你的欢迎语是:你好,我是chatGPT,如果需要帮助,请对我说: "$帮助",注意,$符号不能省略`
        });
    }
    async sendMessage(userId, message) {
        this.sending = true;
        try {
            let res;
            let session = this.getSessionId(userId);
            if (session) {
                res = await this.gptAPI.sendMessage(message, {
                    parentMessageId: session.id,
                    timeoutMs: this.timeout,
                });
            }
            else {
                res = await this.gptAPI.sendMessage(message, {
                    timeoutMs: this.timeout
                });
            }
            if (res.text) {
                this.inheritSession(userId, res.id);
                this.emit('message', userId, res);
            }
        }
        catch (error) {
            this.emit('error', userId, error);
        }
    }
    /**
     * 继承会话
     * @param userId
     * @param id
     */
    inheritSession(userId, id) {
        this.sessionMap.set(userId, { id: id });
    }
    /**
     * 获取会话id
     * @param userId
     * @returns
     */
    getSessionId(userId) {
        return this.sessionMap.get(userId);
    }
    /**
     * 获取id
     * @param userId
     * @returns
     */
    getId(userId) {
        let session = this.getSessionId(userId);
        if (session) {
            return `id:${session.id}`;
        }
        else {
            return `你还没和chatGPT对话`;
        }
    }
    /** 结束会话 */
    endMessage(userId) {
        let id = this.getId(userId);
        this.sessionMap.delete(userId);
        return id;
    }
}
exports.ChatGPT = ChatGPT;
