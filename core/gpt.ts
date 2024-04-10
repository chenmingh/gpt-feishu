import {ChatGPTAPI, ChatMessage} from 'chatgpt'
import { EventEmitter } from "events";

export class ChatGPT {

    private gptAPI: ChatGPTAPI;
    /** 发送状态 */
    private sending: boolean = false;
    /** 对话缓存 */
    sessionMap: Map<string, {id: string}> = new Map();
    /** 超时时间(秒) */
    timeout:number = 60 * 1000;

    private event: EventEmitter = new EventEmitter();

    public on = this.event.on;
    public emit = this.event.emit;

    constructor() {
        this.gptAPI = new ChatGPTAPI({
            //completionParams: { 'model': 'gpt-4' },
            apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxx",
            systemMessage: `如果一个人第一次和你交流,你的欢迎语是:你好,我是chatGPT,如果需要帮助,请对我说: "$帮助",注意,$符号不能省略`
        })
    }


    async sendMessage(userId: string, message: string) {
        this.sending = true;
        try {
            let res: ChatMessage;
            let session = this.getSessionId(userId);

            if (session) {
                res = await this.gptAPI.sendMessage(message, {
                    parentMessageId: session.id,
                    timeoutMs: this.timeout,
                })
            } else {
                res = await this.gptAPI.sendMessage(message, {
                    timeoutMs: this.timeout
                })
            }

            if (res.text) {
                this.inheritSession(userId, res.id);
                this.emit('message', userId, res);
            }

        } catch (error) {
            this.emit('error', userId, error);
        }
    }

    /**
     * 继承会话
     * @param userId 
     * @param id 
     */
    inheritSession(userId: string, id: string) {
        this.sessionMap.set(userId, {id: id});
    }

    /**
     * 获取会话id
     * @param userId 
     * @returns 
     */
    getSessionId(userId: string) {
        return this.sessionMap.get(userId);
    }

    /**
     * 获取id
     * @param userId 
     * @returns 
     */
    getId(userId: string) {
        let session = this.getSessionId(userId)
        if (session) {
            return `id:${session.id}`
        }  else {
            return `你还没和chatGPT对话`
        }
    }


    /** 结束会话 */
    endMessage(userId: string) {
        let id: string = this.getId(userId)
        this.sessionMap.delete(userId)
        return id;
    }

}