/**
 * edit by chenzhaofei on June  3
 */
const SocketServer = require('nodejs-websocket')
let map = new Map()//管理房间
const ws = SocketServer.createServer(conn=>{
    let roomInfo,uids
    conn.on('connect',res=>{
        console.log('连接成功',res)
    })
    conn.on('binary:',data=>{
        console.log(`binary${binary}`)
    })
    conn.on('text',data=>{
        const msg = JSON.parse(data)
        switch(msg.type){
            case 'register':
                const {uid,roomId} = msg.data //用户ID，客户端生成，结合时间生成的随机数字串,房间id，管理房间用户标识
                conn.desp = {uid,roomId}//连接对象增加用户和房间信息标识，用于广播查找
                roomInfo = map.get(roomId) || {}              //判断用户是否存在，如果存在可能为断线重连
                uids = roomInfo.uids || new Set()
                !uids.has(uid) ? uids.add(uid) : void 0
                roomInfo.uids = uids
                map.set(roomId,roomInfo)
                //返回注册成功信息
                conn.send(JSON.stringify({
                    type:'register',
                    data:{
                        error:0,
                        message:'ok'
                    }
                }))
                //发送广播，告诉同房间人员有人进入
                broadcast({
                    type:'enter',
                    data:{
                        error:0,
                        uid:uid,
                        roomId:roomId,
                    }
                })
                break
            case 'getGuestList':
                roomInfo = map.get(msg.data.roomId) || {}
                uids = roomInfo.uids || [];
                conn.send(JSON.stringify({
                    type:'onGuestList',
                    data:{
                        error:0,
                        list:[...uids]
                    }
                }))
                break;
            case 'notify':
                roomInfo = map.get(msg.data.roomId) || {}
                const ready = roomInfo.ready || new Set()
                roomInfo.ready = ready
                switch(msg.data.action)
                {
                    case 'ready':
                        roomInfo.ready.add(msg.data.uid)
                        if(roomInfo.ready.size === 2){
                            //高速一方可以走棋
                            const rand = Math.round(Math.random()*10)%2
                            const tid = [...roomInfo.ready][rand]
                            broadcast({
                                type:msg.type,
                                data:{
                                    error:0,
                                    action:'start',
                                    start:1  
                                }
                            },[tid])
                        }
                        break
                    case 'result':
                        //需要清空准
                        roomInfo.ready = new Set()
                }
                broadcast(msg)
                break

        }
    })
    conn.on('close',(code,res)=>{
        console.log('close')
        connExit(conn)
    })
    conn.on('error',err=>{
        console.log('error',err)
        // connExit(conn)
    })
})
const connExit = function(conn){
    broadcast({
        type:'exit',
        data:{
            error:0,
            ...conn.desp
        }
    })
    //从map中删除uid
    let roomInfo = conn.desp ? map.get(conn.desp.roomId) : void 0
    let {uids,ready} = roomInfo
    if(uids){
        uids.delete(conn.desp.uid)
    }
    if(ready){
        ready.delete(conn.desp.uid)
    }
}
const broadcast = function(msg,toUid){
    console.log(msg,toUid)
    let {uid,roomId} = msg.data
    const roomInfo = map.get(roomId) || {}
    const {uids} = roomInfo
    const {type,data} = msg
    ws.connections.forEach(connection=>{
        if(toUid){
            if(connection.desp&&toUid.includes(connection.desp.uid)){
                connection.send(JSON.stringify({
                    type,
                    data
                }))
            }
        }else if(connection.desp&&uids.has(connection.desp.uid)
            && uid !== connection.desp.uid
            ){
                connection.send(JSON.stringify({
                    type,
                    data
                }))
            }
    })
}

ws.listen(5000,()=>{
    console.log('ws listener on port 5000')
})
