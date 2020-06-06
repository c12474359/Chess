export const MODEL_STATUS_USER = {
    ADD:1,
    REMOVE:2,
    READY:3,
    RESULT:4
}
export const CHESS_LOG = 'chessLog'
export const INIT_CHESS = 'initChess'
export const BOARD_REFRESH = 'board_refresh'
export function getUid(){
    const time = new Date().getTime();
    return `${time}-${(Math.random()*10000).toFixed(0)}`
}