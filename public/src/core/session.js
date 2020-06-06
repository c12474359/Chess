/* flow */
import log from '../utils/log'
import dep from '../utils/dep'
import {CHESS_LOG,INIT_CHESS, MODEL_STATUS_USER} from '../utils/strings'

export default class Session{
    dep:dep
    log:log
    name:String
    ws:?WebSocket
    isOpen:Boolean
    options:Object

    constructor(options){
        this.defaultOptions = {
            model:null
        }
        this.log = log.getInstance();
        this.dep = dep.getInstance();
        this.name = this.__proto__.constructor.name;
        this.options = Object.assign({},this.defaultOptions,options||{});
        this.ws = null;
        this.isOpen = false;
        this.init();
    }
    init(){
        const WebSocket = window.WebSocket;
        this.ws = new WebSocket(this.options.ws)
        this.ws.onopen = () => this.onOpen()
        this.ws.onerror = () => this.onError()
        this.ws.onmessage = (data) => this.onMessage(data)
        this.ws.onclose = () => this.onClose()
        //peer
        //增加事件
        this.dep.on('peerMessage',this.send)
        this.dep.on('pushStream',this.push)
        //获取视频
    }
    onOpen(){
        if(this.isOpen) return;
        this.isOpen = true;
        this.dep.emit('onopen');
        //注册信令
        this.sendMessage({type:'register'});
    }
    sendMessage(msg:Object){
        this.log.trace(`${this.name}::sendMessage->`,msg)
        const {uid,roomId} = this.options
        const data = Object.assign({uid,roomId},msg.data||{});
        msg.data = data;
        this.ws.send(JSON.stringify(msg));
    }
    onMessage(res:MessageEvent){
        const data =  res.data;
        const msg = JSON.parse(data);
        if(msg.data.error !== 0){
            this.log.error(`${this.name}::onMessage-> ${msg.type}:${msg.data.message}`);
            return;
        }
        switch(msg.type){
            case 'register':
                this.log.trace(`${this.name}::onMessage-> register ${msg.data.message}`);
                //发送信令查询用户
                this.sendMessage({type:'getGuestList'});
                break;
            case 'onGuestList':
                //根据列表创建peer
                const gl = msg.data.list || [];
                this.log.trace(`${this.name}::onMessage-> onGuestList ${gl.length}`);
                ///去创建peer
                gl.forEach(uid=>{
                    this.options.model.pushUser(uid)
                })
                break;
            case 'enter'://有新用户进入房间
                this.log.trace(`${this.name}::onMessage->用户（${msg.data.uid}）进入`);
                this.dep.emit(CHESS_LOG,`用户（${msg.data.uid}）进入`)
                this.options.model.pushUser(msg.data.uid)
                //去创建
                break;
            case 'exit':
                this.log.trace(`${this.name}::onMessage->用户离开（${msg.data.uid}）`);
                this.dep.emit(CHESS_LOG,`用户（${msg.data.uid}）离开`)
                this.options.model.removeUser(msg.data.uid)
                break;
            case 'notify':
                this.onNotifyMessage(msg.data);
                break;
        }
    }
    onNotifyMessage(data:Object){
        const {model} = this.options
        switch(data.action){
            case 'ready'://准备
                model.setRemoteReady(data)
                if(data.start){
                    model.local = data.start
                }
                break;
            case 'initChess':
                model.setMan(data.mans)
                break;
            case 'start':
                if(!model.init){
                   this.dep.emit(INIT_CHESS)
                   this.sendMessage({
                        type:'notify',
                        data:{
                            error:0,
                            action:'initChess',
                            mans:model.useMan
                        }
                   })
                }
                model.local.start = data.start//重置走棋状态
                if(data.hasOwnProperty('from')){
                    model.remote.from = data.from
                    model.local.from = (data.from+1)%2
                }
                if(data.hasOwnProperty('detail')){//有操作
                    model.setChange(data.detail)
                }
                //附加信息
                break
            case 'result'://认输
                this.dep.emit(MODEL_STATUS_USER.RESET,data)
                // model.resetData()
                break
        }
    }
    onError(err){
        this.log.error(`${this.name}::onError-> err:${err.toString()}`);
        this.dep.emit('onerror',this);
    }
    onClose(){
        this.log.trace(`${this.name}::onClose`);
        this.dep.emit('onclose',this);
    }
    destroy(){
        this.dep = null
        this.log = null
        this.ws.close(200,'关闭')
        this.ws.onopen = null
        this.ws.onerror = null
        this.ws.onmessage = null
        this.ws.onclose = null
        this.ws = null
        this.isOpen = false
    }
}