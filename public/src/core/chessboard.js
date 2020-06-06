/* @flow */
import LogProxy from '../utils/log'
import Dep from '../utils/dep'
import {MODEL_STATUS_USER,CHESS_LOG} from '../utils/strings'

export default class Chessboard{
    log:LogProxy//统一处理console
    canvaClick:Function
    isPlay:Boolean
    dep:Dep

    constructor(options){
        size:Number
        startX:Number//画布开始坐标x
        startY:Number//画布开始坐标y
        ctx:CanvasRenderingContext2D
        this.defaultOptions = {
            row:4,
            col:8,
            width:200,
            height:200,
            canvas:null,
            model:null
        }
        this.options = Object.assign(this.defaultOptions,options||{})
        this.log = LogProxy.getInstance()
        this.dep = Dep.getInstance()
        this.name = this.__proto__.constructor.name
        this.isPlay = false
        this.tip = ['一','二','三','四','五','六','七','八','九']
        this.init()
    }
    init(){
        //计算最小方格
        this.ctx = this.options.canvas.getContext("2d");
        const {row,col,width,height} = this.options
        const totalSize = height/width > col/(row*2+1) ? width : height
        this.size = Math.floor(totalSize / 8)
        this.startX = (width - this.size*col)/2 
        this.startY = (height - this.size*(row*2+1))/2
        this.log.trace(`${this.name}::init startX(${this.startX}),startY(${this.startY}),size(${this.size})`)
        //绘制棋盘
        this.canvaClick = data => this.clickCanvas(data)
        this.options.canvas.addEventListener("click",this.canvaClick);
    }
    drawBackGround(){
        this.log.info(`${this.name}::drawBackGround`)
        const x = this.startX,y = this.startY,size = this.size,{col,row} = this.options
        const w = size*col
        const h = size*(row*2+1)
        this.ctx.clearRect(x,y,w,h)
        const gradient = this.ctx.createLinearGradient(0,0,w,h)
        gradient.addColorStop(0,'#8d4d22')
        gradient.addColorStop(0.2,'#ca904a')
        gradient.addColorStop(0.8,'#ca904a')
        gradient.addColorStop(1,'#8d4d22')
        this.ctx.fillStyle = gradient
        this.ctx.strokeStyle="#8d4d22";
        this.ctx.rect(x,y,w,h)
        this.ctx.fill()
        this.ctx.stroke()
        this.ctx.beginPath();
        for(let i=1;i<row*2+1;i++){
            this.ctx.moveTo(x,y+size*i)
            this.ctx.lineTo(x+w,y+size*i)
        }
        this.ctx.fillStyle="#8d4d22";
        this.ctx.font="14px 宋体";
        this.ctx.textBaseline = 'middle'
        this.ctx.textAlign = 'center'
        for(let i=0;i<col;i++){
            this.ctx.fillText(`${this.tip[i]}`,x+size*i+size/2,y-10)
            this.ctx.fillText(`${col-i}`,x+size*i+size/2,y+h+10)
        }
        this.ctx.fill()
        for(let i=1;i<col;i++){
            //绘制线
            this.ctx.moveTo(x+size*i,y)
            this.ctx.lineTo(x+size*i,y+size*row)
            this.ctx.moveTo(x+size*i,y+size*(row+1))
            this.ctx.lineTo(x+size*i,y+h)
        }
        //绘制中间图
        this.ctx.moveTo(x+size*(col-2)/2,y)
        this.ctx.lineTo(x+size*(col+2)/2,y+size*2)
        this.ctx.moveTo(x+size*(col+2)/2,y)
        this.ctx.lineTo(x+size*(col-2)/2,y+size*2)

        this.ctx.moveTo(x+size*(col-2)/2,y+h)
        this.ctx.lineTo(x+size*(col+2)/2,y+h-size*2)
        this.ctx.moveTo(x+size*(col+2)/2,y+h)
        this.ctx.lineTo(x+size*(col-2)/2,y+h-size*2)
        //绘制文字
        this.ctx.stroke()
        this.ctx.fillStyle="black";
        this.ctx.font="20px Georgia";
        this.ctx.textBaseline = 'middle'
        this.ctx.textAlign = 'center'
        this.ctx.fillText("楚河",(x+w/2)/2,y+h/2)
        this.ctx.translate(x+w*3/4, y+h/2);
        this.ctx.rotate(Math.PI)
        this.ctx.font="20px Georgia";
        this.ctx.fillText("汉界",0,0)
        this.ctx.rotate(-Math.PI)
        this.ctx.translate(-x-w*3/4,-y-h/2);
        this.ctx.fill()
        // this.ctx.clearRect(x,y,w,h)
        ///绘制棋子
        if(this.options.model.local.isPlaying){
            const mans = this.options.model.useMan
            let man,mx,my
            let manGradient
            for(let i = 0;i<mans.length;i++){
                for(let j=0;j<mans[i].length;j++){
                    if(mans[i][j] === 0) continue
                    man = mans[i][j]
                    mx = x+j*size+size/2
                    my = y+i*size+size/2
                    this.ctx.beginPath();
                    manGradient = this.ctx.createRadialGradient(mx,my,0,mx,my,size/2)
                    manGradient.addColorStop(0,'#f4bb6a')
                    manGradient.addColorStop(0.6,'#fee899')
                    manGradient.addColorStop(0.9,'#8d4d22')
                    this.ctx.fillStyle = manGradient
                    this.ctx.arc(mx,my,size/2-2,0,Math.PI*2);
                    this.ctx.fill()
                    if(man.status === 1){//正面
                        this.ctx.fillStyle= man.from === 0 ? 'red' : "black";
                        this.ctx.font="20px 隶书";
                        this.ctx.textBaseline = 'middle'
                        this.ctx.textAlign = 'center'
                        this.ctx.fillText(man.text,mx,my)
                    }
                    if(this.nowMan && this.nowMan[0] === i && this.nowMan[1] === j){
                        this.ctx.stroke()
                    }
                }
            }
        }
    }
    initChess(){
        const {model,row,col} = this.options
        model.local.isPlaying = true
        model.initChess(row,col)
        this.refresh()
    }
    refresh(){
        this.drawBackGround()
    }
    clickCanvas(evt){
        const {isPlaying,start} = this.options.model.local
        this.log.trace(`${this.name}::clickCanvas->`,isPlaying,start)
        if(!isPlaying || !!!start) return
        const {layerX,layerY} = evt
        const point = {
            x:layerX - this.startX,
            y:layerY-this.startY
        }
        const col = Math.floor(point.x/this.size)
        const row = Math.floor(point.y/this.size)
        this.resetChess(row,col)
    }
    processChess(r,c,s){
        const {model,session}  = this.options
        const {useMan} = model
        let detail = []
        switch(s)
        {
            case 1:
                break;
            case 2:
                const t1 = useMan[r][c].text
                const t2 = useMan[this.nowMan[0]][this.nowMan[1]].text
                useMan[r][c] = 0
                useMan[this.nowMan[0]][this.nowMan[1]] = 0
                detail.push({
                    r:this.nowMan[0],
                    c:this.nowMan[1],
                    s:2
                })
                detail.push({
                    r:r,
                    c:c,
                    s:2
                })
                model.local.leave--
                model.remote.leave--
                this.dep.emit(CHESS_LOG,`您和对方兑了【${t1}:${t2}】`)
                break
            case 3:
                const {text} = useMan[r][c]
                useMan[r][c] = useMan[this.nowMan[0]][this.nowMan[1]]
                useMan[this.nowMan[0]][this.nowMan[1]] = 0
                if(!text) {
                    this.dep.emit(CHESS_LOG,`您移动了【${t2}】`)
                }else{
                    this.dep.emit(CHESS_LOG,`您吃掉了对方的【${text}】`)
                    model.remote.leave--
                }
                detail.push({
                    r:this.nowMan[0],
                    c:this.nowMan[1],
                    nr:r,
                    nc:c,
                    s:3
                })
                break
        }
        if(detail.length>0){
            session.sendMessage({
                type:'notify',
                data:{
                    error:0,
                    action:'start',
                    start:1,
                    detail:detail
                }
            })
            model.local.start = 0
            //检查是否结束
            if(model.local.leave === model.remote.leave && model.local.leave === 0){
                this.dep.emit(MODEL_STATUS_USER.RESULT,{success:2})
            }else if(model.local.leave === 0){
                this.dep.emit(MODEL_STATUS_USER.RESULT,{success:0})
            }else if(model.remote.leave === 0){
                this.dep.emit(MODEL_STATUS_USER.RESULT,{seccess:1})
            }
            this.log.trace(`${this.name}::leave->local(${model.local.leave}),remote(${model.remote.leave})`)
        }
    }
    resetChess(r,c){
        //点击位置是否有子
        const {model,session}  = this.options
        const {useMan} = model
        const {from} = model.local
        let s_msg
        if(this.nowMan && r !== 4){//走棋
            let detail = []//操作
            //特殊处理炮
            const v1 = useMan[this.nowMan[0]][this.nowMan[1]].value
            /*计算两字距离 */
            let [lr,lc] = this.nowMan
            if(lr>4) lr--
            let nr = r
            if(nr>4) nr--
            const dis = Math.abs(nr-lr) + Math.abs(c-this.nowMan[1])
            if(dis === 1){
                if(useMan[r][c] === 0){//空位
                    detail = this.processChess(r,c,3)
                }else if(useMan[r][c].from !== useMan[this.nowMan[0]][this.nowMan[1]].from
                    && useMan[r][c].status === 1){//是否可以兑子
                    const v2 = useMan[r][c].value
                    if(v1 === v2){//想等，兑子
                        detail = this.processChess(r,c,2)
                    }else if(v1 !== 1){//不等计算大小
                        if((v1 === 0 && v2 === 6)
                        || (v1 > v2 && !(v1 === 6 && v2 === 0))){
                            detail = this.processChess(r,c,3)
                        }
                    } 
                }
            }else if(v1 === 1 
                && useMan[r][c] !== 0
                && useMan[r][c].from !== from
                && useMan[r][c].status === 1){
                //计算是否可吃
                let num = 0,start = 0,end = 0,i
                if(r === this.nowMan[0]){
                    start = Math.min(c,this.nowMan[1])
                    end =Math.max(c,this.nowMan[1])
                    for(i=start+1;i<end;i++){
                        if(useMan[r][i] !== 0){
                            num++
                        }
                    }
                }else if(c === this.nowMan[1]){
                    start = Math.min(r,this.nowMan[0])
                    end = Math.max(r,this.nowMan[0])
                    for(i=start+1;i<end;i++){
                        if(useMan[i][c] !== 0){
                            num++
                        }
                    }
                }
                if(num === 1){//可以吃
                    detail = this.processChess(r,c,3)
                }
            }
            this.nowMan = null
            this.refresh()
        }else if(useMan[r][c] !== 0){//存在棋子
            this.log.trace(`${this.name}::resetChess->`,useMan[r][c])
            if(useMan[r][c].status === 0){//未翻开则翻开
                model.local.start = 0
                useMan[r][c].status = 1
                //如果自己还没确定子from，
                const s_msg = {
                    type:'notify',
                    data:{
                        error:0,
                        action:'start',
                        start:1,
                        detail:[
                            {r:r,c:c,s:1}
                        ]
                    }
                }
                if(model.local.from === -1){
                    this.log.trace(`${this.name}::setLocalFrom:${useMan[r][c].from},remote:${(useMan[r][c].from+1)%2}`)
                    model.local.from = useMan[r][c].from
                    model.remote.from = (useMan[r][c].from+1)%2
                    s_msg.data.from = model.local.from
                }
                this.dep.emit(CHESS_LOG,`您翻开了${useMan[r][c].from === model.local.from ? '自己的' : '对方的'}【${useMan[r][c].text}】`)
                session.sendMessage(s_msg)
                this.refresh()
           }else if(useMan[r][c].from === model.local.from){//是自己的子
                this.nowMan = [r,c]
                this.refresh()
           }else{
               this.log.trace(`${this.name}::选择的不是自己的字，无操作`)
           }
        }else{

        }
    }
}