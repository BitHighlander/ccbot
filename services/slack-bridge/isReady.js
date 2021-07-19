/*
    Liveness probe G1

    Goals:
        *


 */
const TAG = " | liveness | "
require("dotenv").config({path:'./../../.env'})
const log = require('@foxcookieco/pioneer-loggerdog-client')()
let connection  = require("@foxcookieco/pioneer-mongo-default-env")
const {subscriber, publisher, redis} = require('@foxcookieco/pioneer-default-redis')
let usersDB = connection.get('users')
let txsDB = connection.get('transactions')

//Primary
// let network = require("@foxcookieco/pioneer-cosmos-network")
// network.init()
// let wallet = require("@foxcookieco/pioneer-cosmos-wallet")
// wallet.init()

const check_liveness = async function(){
    let tag = TAG + " | check_liveness | "
    try{

        //can connect to redis
        let redisInfo = await redis.info()
        log.debug(tag,"redisInfo: ",redisInfo)
        if(!redisInfo) throw Error("102: Redis not working! empty response")

        //let status = await network.isOnline()
        //log.info(tag,"status: ",status)
        // if(!status.gaiad) throw Error("102: unable to connect to gaiad")
        // if(!status.gaiaCli) throw Error("103: unable to connect to gaiaCli")

        //can connect to mongo
        // let balance = await wallet.getBalance()
        // log.info(tag,"balance: ",balance)

        process.exit(0)
    }catch(e){
        log.error(tag,"error: ",e)
        process.exit(1)
    }
}
check_liveness()
