/* @flow */
import LogProxy from "../utils/log"
import Dep from "../utils/dep"
import {MODEL_STATUS_USER,BOARD_REFRESH, CHESS_LOG} from '../utils/strings'
export default class Model{
    userList:Set
    log:LogProxy
    dep:Dep
    remote:Object//保存对方信息状态
    local:Object//保存本地信息状态
    rawChessMans:Array<Object>//原始数据
    useMan:Array<Array<Object>>
    init:Boolean

    constructor(options){
        this.defaultOpions = {

        }
        this.options = Object.assign(this.defaultOpions,options||{})
        this.name = this.__proto__.constructor.name
        this.userList = new Set()
        this.log = LogProxy.getInstance()
        this.dep = Dep.getInstance()
        /*
            from 0表示红，1表示黑
            status:0,未激活，1激活
            pos：棋子位置
         */
        this.rawChessMans = [
            {text: "将",from:0,status:0,value:6},
            {text: "仕",from:0,status:0,value:5},
            {text: "仕",from:0,status:0,value:5},
            {text: "相",from:0,status:0,value:4},
            {text: "相",from:0,status:0,value:4},
            {text: "马",from:0,status:0,value:3},
            {text: "马",from:0,status:0,value:3},
            {text: "车",from:0,status:0,value:2},
            {text: "车",from:0,status:0,value:2},
            {text: "炮",from:0,status:0,value:1},
            {text: "炮",from:0,status:0,value:1},
            {text: "兵",from:0,status:0,value:0},
            {text: "兵",from:0,status:0,value:0},
            {text: "兵",from:0,status:0,value:0},
            {text: "兵",from:0,status:0,value:0},
            {text: "兵",from:0,status:0,value:0},
            {text: "帅",from:1,status:0,value:6},
            {text: "士",from:1,status:0,value:5},
            {text: "士",from:1,status:0,value:5},
            {text: "象",from:1,status:0,value:4},
            {text: "象",from:1,status:0,value:4},
            {text: "馬",from:1,status:0,value:3},
            {text: "馬",from:1,status:0,value:3},
            {text: "車",from:1,status:0,value:2},
            {text: "車",from:1,status:0,value:2},
            {text: "炮",from:1,status:0,value:1},
            {text: "炮",from:1,status:0,value:1},
            {text: "卒",from:1,status:0,value:0},
            {text: "卒",from:1,status:0,value:0},
            {text: "卒",from:1,status:0,value:0},
            {text: "卒",from:1,status:0,value:0},
            {text: "卒",from:1,status:0,value:0}
        ]
        // this.resetData()
    }
    resetData(){
        this.remote = {status:false,from:-1,leave:16}
        this.local = {status:false,from:-1,start:0,isPlaying:false,leave:16}//from使用子类型
        this.init = false
        this.useMan = []
        this.dep.emit(BOARD_REFRESH)
    }
    pushUser(uid){
        if(this.userList.has(uid)){
            this.log.warn(`${this.name}::pushUser->exist(${uid})`)
            return
        }
        this.userList.add(uid)
        this.dep.emit(MODEL_STATUS_USER.ADD,uid)
    }
    removeUser(uid){
        if(!this.userList.has(uid)){
            this.log.warn(`${this.name}::pushUser->not exist(${uid})`)
            return
        }
        this.userList.delete(uid)
        this.dep.emit(MODEL_STATUS_USER.REMOVE,uid)
    }
    setRemoteReady(data){
        console.log(data)
        this.remote.status = data.status
        this.dep.emit(MODEL_STATUS_USER.READY,data)
    }
    setMan(mans){
        this.log.trace(`${this.name}::setMan->`,mans)
        this.init = true
        this.local.isPlaying = true
        this.useMan = mans
        this.dep.emit(BOARD_REFRESH)
    }
    setChange(data){
        data.forEach(value=>{
            const {r,c,nr,nc,s} = value
            if(s === 1){
                this.useMan[r][c].status = 1
                this.dep.emit(CHESS_LOG,`对方翻开了${this.useMan[r][c].from === this.local.from ? '您的' : '自己的'}【${this.useMan[r][c].text}】`)
            }
            if(s === 2){//消掉的子
                const  {from,text} = this.useMan[r][c]
                if(from === this.local.from) this.local.leave--
                if(from === this.remote.from) this.remote.leave--
                this.dep.emit(CHESS_LOG,`对方兑掉了${from === this.local.from ? '您的' : '自己的'}【${text}】`)
                this.useMan[r][c] = 0
            }
            if(s === 3){//被吃
                let {text} = this.useMan[nr][nc]
                const t2 = this.useMan[r][c].text
                this.useMan[nr][nc] = this.useMan[r][c]
                this.useMan[r][c] = 0
                if(!text) {
                    this.dep.emit(CHESS_LOG,`对方移动了【${t2}】`)
                }else{
                    this.dep.emit(CHESS_LOG,`对方吃掉了您的【${text}】`)
                    this.local.leave--
                }
            }
           
        })
        if(this.local.leave === this.remote.leave && this.local.leave === 0){
            this.dep.emit(MODEL_STATUS_USER.RESULT,{success:2})
        }else if(this.local.leave === 0){
            this.dep.emit(MODEL_STATUS_USER.RESULT,{success:0})
        }else if(this.local.remote === 0){
            this.dep.emit(MODEL_STATUS_USER.RESULT,{success:1})
        }
        this.log.trace(`${this.name}::leave->local(${this.local.leave}),remote(${this.remote.leave})`)
        this.dep.emit(BOARD_REFRESH)
    }
    initChess(row,col){//初始化
        if(this.init) return
        this.init = true
        let tmp=[]
        for(let i=0;i<this.rawChessMans.length;i++){
            tmp.push(i)
        }
        let i = tmp.length,rand,man,idx,r,c
        this.useMan = new Array(row*2+1).fill(0)//72个位置
        this.useMan = this.useMan.map(value=>{
            return new Array(col).fill(0)
        })
        while(i--){
            rand = Math.floor(Math.random()*i)
            idx = tmp.splice(rand,1)[0]
            man = Object.assign({},this.rawChessMans[idx])
            r = row+1+Math.floor(i/col)
            c = i%col
            this.useMan[r][c] = man
        }
        
    }
}