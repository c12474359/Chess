/* @flow */
import ChessBoard from './core/chessboard'
import Session from './core/session'
import Model from './core/model'
import {getUid} from './utils/strings'
import {MODEL_STATUS_USER,CHESS_LOG,INIT_CHESS,BOARD_REFRESH} from './utils/strings'
import Dep from './utils/dep'
const uid = getUid()

require('./css/index.scss')

function init(){
    const dep = Dep.getInstance()//事件中心，通过监听model数据变化，修改UI
    dep.on(MODEL_STATUS_USER.ADD,(uid)=>{//添加用户信息到列表
        addUser(uid)
    })
    dep.on(MODEL_STATUS_USER.REMOVE,(uid)=>{//删除用户信息到列表
        removeUser(uid)
    })
    dep.on(MODEL_STATUS_USER.READY,data=>{//准备
        if(model.local.status){
            log('开始...')
            // board.initChess()
        }
    })
    dep.on(MODEL_STATUS_USER.RESULT,data=>{//准备
        const r = data.success === 0 ? "您输了" 
        : data.success === 2 ? "和棋" :'您赢了'
        log(`上一把${r}`)
        alert(r)
        model.resetData()
        const bt = document.getElementById('0')
        bt.removeAttribute('disabled')
    })
    dep.on(INIT_CHESS,data=>{
        board.initChess()
    })
    dep.on(BOARD_REFRESH,()=>{
        board.refresh()
    })
    dep.on(CHESS_LOG,data=>{
        log(data)
    })
    const model = new Model()
    const canvas = document.getElementById('canvas')
    const session = new Session({
        ws:'ws://127.0.0.1:5000',
        uid,
        roomId:1000,
        model
    })
    const board = new ChessBoard({
        canvas,
        model,
        session,
        width:300,
        height:400
    })
    model.resetData()//初始化数据
    ///为按钮增加事件
    const tools = document.getElementById('tools')
    tools.addEventListener('click',(evt)=>{
        const target = evt.target
        switch(target.id){
            case '0':
                //检查对方是否准备
                if(!model.remote.status){
                    log(`等待对方准备...`)
                }else{//双方都准备好了，开始
                    log('开始...')
                }
                model.local.status = true//本地状态修改为已准备
                session.sendMessage({
                    type:'notify',
                    data:{
                        error:0,
                        action:'ready',
                        status:true
                    }
                })
                target.setAttribute('disabled',true)
                break;
            case '1':
                //开始了才可以认输 
                if(model.local.isPlaying){
                    session.sendMessage({
                        type:'notify',
                        data:{
                            error:0,
                            action:'result',
                            success:1
                        }
                    })
                    model.resetData()
                    const bt = document.getElementById('0')
                    bt.removeAttribute('disabled')
                }else{
                    log(`还未开始`)
                }
                break;
        }
    })
}
const logArr:Array<String> = []
function log(msg:String){
    const logC = document.getElementById('log')
    logArr.unshift(`<span>${msg}</span>`)
    while(logArr.length > 10){
        logArr.pop()
    }
    logC.innerHTML = logArr.join('')
}
function addUser(newVal){
    const user =  document.getElementById('user')
    let txt = `<span>【${newVal === uid ? '我' : '游客'}】${newVal}</span>`
    if(newVal === uid){
        user.innerHTML  = txt + user.innerHTML
    }else{
        user.innerHTML  = user.innerHTML + txt
    }
}
function removeUser(rid){
    const user =  document.getElementById('user')
    let txt = `<span>【${rid === uid ? '我' : '游客'}】${rid}</span>`
    user.innerHTML = user.innerHTML.replace(txt,'');
}
init()

