import * as http from 'http';
import { Feishu, FeishuMessage } from './core/feishu';
import { ChatGPT } from './core/gpt';
import { adaptDefault } from '@larksuiteoapi/node-sdk';
import { ChatGPTError, ChatMessage } from 'chatgpt';
// import minimist from 'minimist';


const feishu = new Feishu("xxxxxxxx", "xxxxxxxxxx");
const chatgpt = new ChatGPT();

async function createrServer(host: string, port: number) {


    feishu.on('message', onFeiShuMessage);

    chatgpt.on('message', onChatGPTMessage);
    chatgpt.on('error', onChatGPTError);

    const server = http.createServer((req, res) => {
        let data: any = [];

        req.on('data', (chunk) => {
            data.push(chunk);
        })

        req.on('end', async () => {
            let str = data.toString();
            if (str.includes("challenge") && str.includes("token")) {
                res.end(str)
            } else {
                res.end();
            }
        })
    });


    server.on('request', adaptDefault('/webhook/event', feishu.EventDispatcher));
    server.listen(port, host);

}


async function onChatGPTMessage(userId: string, data: ChatMessage) {
    if (userId == "group") {
        feishu.sendMessage(data.text)
    } else {
        feishu.sendUserMessage(userId, data.text)
    }
}

async function onChatGPTError(userId: string, error: ChatGPTError) {
    if (error.statusCode) {
        feishu.sendUserMessage(userId, {text: error.statusText})
        return
    }
}

async function onFeiShuMessage(data: FeishuMessage) {
    if (data.message.message_type === 'text' && data.message.chat_type == 'p2p') {
        let userId = data.sender.sender_id?.open_id || "";
        //检查是不是指令
        let msgText = JSON.parse(data.message.content).text;
        if (msgText.includes("$继承会话")) {
            //获取cID和pID
            if (msgText.includes(",") && msgText.split(",").length == 2) {
                let id = msgText.split(",")[1];
                chatgpt.inheritSession(userId, id)
                feishu.sendUserMessage(userId, { text: `已恢复id:${id} 的会话` })
            }
            this.sendUserMessage(userId, { text: `无法解析命令,正确的命令格式: $继承会话,id, 例如 "$继承会话,id66666"` })
        } else {
            switch (msgText) {
                case "$帮助":
                    feishu.sendUserMessage(userId, { text: "$结束会话 :结束当前的会话上下文,chatGPT会忘掉你之前说过的内容重新与你会话" })
                    feishu.sendUserMessage(userId, { text: "$获取会话ID :获得当前会话的id,用于恢复会话,PS! 注意! 每与chatGPT说一句话,id都会改变,获取到的id只表示截止到目前的对话状态,恢复也只能恢复到当前状态" })
                    feishu.sendUserMessage(userId, { text: `$继承会话,id :使用之前获取的id来恢复会话,例如 "$继承会话,id66666"` })
                    feishu.sendUserMessage(userId, {
                        text: `================
一些提示:
会话:和chatGPT进行交流的一次完整过程,由无数个对话组成
对话:和chatGPT进行一问一答的一次交流
chatGPT单次的会话记忆有一定上限,超过上限,旧的对话信息就会被忘记
================`
                    })
                    break;
                case "$获取会话ID":
                    feishu.sendUserMessage(userId, { text: `请记录以下ID,用于恢复当前会话, ${chatgpt.getId(userId)}` })
                    break;
                case "$结束会话":
                    let id = chatgpt.endMessage(userId)
                    feishu.sendUserMessage(userId, { text: `已结束当前会话,如需恢复会话,请使用当前会话id:${id}` })
                    break;
                default:
                    feishu.sendUserMessage(userId, { text: "收到,正在请求chatGPT........" })
                    chatgpt.sendMessage(userId, msgText)
                    break;
            }
        }
    }
}



function main() {
    // const args = minimist(process.argv.slice(2));
    // console.log(args)
    createrServer("0.0.0.0", 8080);
}



main()




