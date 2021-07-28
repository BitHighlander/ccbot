/*
      update tx's by address worker

      Start

 */
require('dotenv').config()
require('dotenv').config({path:"../../../.env"})
require('dotenv').config({path:"./../../.env"})
require('dotenv').config({path:"../../../../.env"})

// console.log(process.env)

let packageInfo = require("../package.json")
const TAG = " | "+packageInfo.name+" | "
const log = require('@pioneer-platform/loggerdog')()

const {redis}  = require("@pioneer-platform/default-redis")
const coincap = require("@pioneer-platform/coincap")
const connection  = require("@pioneer-platform/default-mongo")
const usersDB = connection.get('usersCCbot')
usersDB.createIndex({id: 1}, {unique: true})
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({user: 1}, {unique: true})

const cron = require('node-cron');

let push_report = async function(work:any,balance:string){
    let tag = TAG+" | push_balance_event | "
    try{
        //

    }catch(e){
        log.error(tag,e)
    }
}

let get_valuesUsd = function (portfolio:any,rates:any) {
    let tag = TAG + ' | get_asymmetrys | '
    try {

        let coins = Object.keys(portfolio)

        let valuesUsd:any = {}
        let totalValueUsd:any = 0
        for(let i = 0; i < coins.length; i++){
            let coin = coins[i]
            //log.debug(tag,"coin: ",coin)
            if(!rates[coin] || !rates[coin].priceUsd){
                log.error(tag," Missing rate data for "+coin)
                rates[coin] = {priceUsd:0}
            }
            let rateUsd = rates[coin].priceUsd || 0
            log.debug(coin," rateUsD: ",rateUsd)
            valuesUsd[coin] = portfolio[coin] * parseFloat(rateUsd)
            totalValueUsd += valuesUsd[coin]
        }

        return {valuesUsd,totalValueUsd}
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let score_altfolios = async function(){
    let tag = TAG+" | score_altfolios | "
    let work
    try{
        //get all users
        let allUsers = await usersDB.find()

        let timeScored = new Date().getTime()

        for(let i = 0; i < allUsers.length; i++){
            let user = allUsers[i]
            log.info(tag,"user: ",user)
            //get balances for username
            let balances = await redis.hgetall(user.user+":balances")
            log.info(tag,"balances: ",balances)
            if(Object.keys(balances).length === 0){
                //credit user 1000$
                balances['USDT'] = 1000
            }

            //rates
            let rates = await coincap.assets()
            let valuesUsdNew = get_valuesUsd(balances,rates)
            log.info(tag,"valuesUsdNew: ",valuesUsdNew)
            //get USD value
            let USDValue = parseInt(valuesUsdNew.totalValueUsd)
            //save to leaderboard
            await redis.zadd("leaderboard",USDValue,user.user)
        }
        //last update
        redis.set("last_leaderboard_update",timeScored)
        //leaderboard
        let allValues = await redis.zrangebyscore("leaderboard","-inf","+inf", "WITHSCORES")
        console.log("allValues: ",allValues)

        //TODO
        //push_report

    } catch(e) {
        log.error(tag,"e: ",e)
        log.error(tag,"e: ",e.message)
    }
}

//start working on install
log.info(TAG," score_altfolios started! ","")
score_altfolios()
// cron.schedule('0 20 * * 1-5', () => {
//     audit_assets()
//     log.info("Winning! ****************** ")
//     log.info('running at a time every day');
// });
