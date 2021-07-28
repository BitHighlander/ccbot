
/*

    TODO
        Move numbers to http://numbrojs.com/manipulate.html
        stop using :any you scrub

 */

let TAG = " | rebalance | "

//modules
let coincap = require("@pioneer-platform/coincap")
let log = require("@pioneer-platform/loggerdog")()

//


module.exports = {
    // init: function (url:any) {
    //     ANYCOIN_URL = url
    //     return true
    // },
    getAction:function(portfolio:any,target:any,limit:number){
        return get_action(portfolio,target,limit)
    },
 }


//lib
let get_asymmetrys = function (coins:any,valuesUsd:any,totalValueUsd:any,target:any,rates:any) {
    let tag = TAG + ' | get_asymmetrys | '
    try {

        //get asymmetrys
        let amountToTargetNative:any = {}
        let amountToTargetsUSD:any = {}
        let diffPercents:any = {}
        let asymmetrys = []
        for(let i = 0; i < coins.length; i++){
            let coin = coins[i]
            log.info(tag,"coin: ",coin)
            let percent = 0
            log.info(coin,"valuesUsd[coin]: ",valuesUsd[coin])
            if(valuesUsd[coin]){
                percent = valuesUsd[coin] * 100 / totalValueUsd
            }
            log.info(coin,"percent: ",percent)
            log.info(coin,"target[coin]: ",target[coin])
            if(!target[coin]) target[coin] = 0
            diffPercents[coin] =  percent - target[coin]
            log.info(coin,"diffPercents[coin]: ",diffPercents[coin])

            //6 percent of coin out of total usd
            let amountDiffUsd = diffPercents[coin] / 100 * totalValueUsd
            log.info(tag,"amountDiffUsd: ",amountDiffUsd)
            amountToTargetsUSD[coin]= amountDiffUsd
            amountToTargetNative[coin] = amountDiffUsd / parseFloat(rates[coin].priceUsd)
            asymmetrys.push({
                coin,
                asymmetry:diffPercents[coin],
                amountNative:Math.abs(amountToTargetNative[coin]),
                amountUsd:Math.abs(amountToTargetsUSD[coin])
            })
        }

        log.info("asymmetrys: ",asymmetrys)
        return asymmetrys
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_valuesUsd = function (portfolio:any,rates:any) {
    let tag = TAG + ' | get_asymmetrys | '
    try {

        let coins = Object.keys(portfolio)

        let valuesUsd:any = {}
        let totalValueUsd = 0
        for(let i = 0; i < coins.length; i++){
            let coin = coins[i]
            //log.debug(tag,"coin: ",coin)
            if(!rates[coin] || !rates[coin].priceUsd){
                log.error(tag," Missing rate data for "+coin)
                rates[coin] = 0
            }
            let rateUsd = rates[coin].priceUsd
            log.debug(coin," rateUsD: ",rateUsd)
            valuesUsd[coin] = portfolio[coin] * parseFloat(rateUsd)
            totalValueUsd += valuesUsd[coin]
        }

        return valuesUsd
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_total_value_USD = function (portfolio:any,rates:any) {
    let tag = TAG + ' | get_total_value_USD | '
    try {

        let coins = Object.keys(portfolio)

        let valuesUsd:any = {}
        let totalValueUsd = 0
        for(let i = 0; i < coins.length; i++){
            let coin = coins[i]
            //log.debug(tag,"coin: ",coin)
            if(!rates[coin] || !rates[coin].priceUsd){
                log.error(tag," Missing rate data for "+coin)
                rates[coin] = {priceUsd:0}
            }
            let rateUsd =rates[coin].priceUsd
            log.debug(coin," rateUsD: ",rateUsd)
            valuesUsd[coin] = portfolio[coin] * parseFloat(rateUsd)
            totalValueUsd += valuesUsd[coin]
        }

        return totalValueUsd
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

// let find_best_action = function (actions:any,state:any,target:any,rates:any) {
//     let tag = TAG + ' | find_best_action | '
//     try {
//         log.info(tag,"actions: ",actions)
//         log.info(tag,"state: ",state)
//
//         // for(let i = 0; i < actions.length; i++){
//         //     let action = actions[0]
//         //
//         //     //get resulting state if applied
//         //     let newState = apply_event(state,action)
//         //     log.info(tag,"newState: ",newState)
//         //
//         //     //value usds
//         //     let newUsdValues = get_valuesUsd(newState,rates)
//         //     log.info(tag,"newUsdValues: ",newUsdValues)
//         //
//         //     //is target
//         //
//         //     //amountUsd
//         // }
//
//
//         //heuristics
//         //prefer target hit
//         //prefer largest amount usd
//         //prefer lowest fee
//
//
//
//         return actions[0]
//     } catch (e) {
//         console.error(tag, 'Error: ', e)
//         throw e
//     }
// }


//find best action
let find_best_action = function (coins:any,valuesUsd:any,state:any,totalValueUsd:any,target:any,rates:any,targetUsd:any) {
    let tag = TAG + ' | get_asymmetrys | '
    try {
        let asymmetrys:any = get_asymmetrys(coins,valuesUsd,totalValueUsd,target,rates)
        log.debug(tag,"asymmetrys: ",asymmetrys)

        let actions = []
        let surpluses = []
        let deficits = []
        for(let i = 0; i < asymmetrys.length; i++){
            let asymmetry = asymmetrys[i]
            if(asymmetry.asymmetry > 0){
                //overage
                surpluses.push(asymmetry)
            } else {
                deficits.push(asymmetry)
            }
        }

        //sort deficits by amount
        deficits.sort((a:any, b:any) => parseFloat(a.amountUsd) - parseFloat(b.amountUsd));
        log.info(tag,"deficits: ",deficits)

        //fix highest deficit with largest overage
        let largestDeficit = deficits[deficits.length - 1]

        //find largest overage
        surpluses.sort((a:any, b:any) => parseFloat(a.amountUsd) - parseFloat(b.amountUsd));
        log.info(tag,"surpluses: ",surpluses)

        //fix highest deficit with largest overage
        let largestSurplus = surpluses[surpluses.length - 1]

        log.info(tag,"largestSurplus: ",largestSurplus.coin," amount: ",largestSurplus.amountUsd)
        log.info(tag,"largestDeficit: ",largestDeficit.coin," amount: ",largestDeficit.amountUsd)


        //if surplus > deficit
        if(largestSurplus.amountUsd >= largestDeficit.amountUsd){
            log.info(tag," Surplus is greater then deficit. fixing deficit")
            //fix deficit 100pct from suplus coin
            let amountDeficitUsd = largestDeficit.amountUsd

            let amountNativeInput = amountDeficitUsd / rates[largestSurplus.coin].priceUsd
            let amountNativeOutput = amountDeficitUsd / rates[largestDeficit.coin].priceUsd

            let amountUsdInput = amountNativeInput * rates[largestSurplus.coin].priceUsd
            let amountUsdOutput = amountNativeOutput * rates[largestDeficit.coin].priceUsd

            let summary = " Surplus is greater then deficit. fixing deficit" + " trading "+amountNativeInput+" ("+largestSurplus.coin+") for "+amountNativeOutput+" ("+largestDeficit.coin+")"
            log.info(tag,"summary: ",summary)

            // let amountIn = Math.abs(largestSurplus.amountNative)
            // let valueUsdOut = amountIn * parseFloat(rates[largestSurplus.coin].priceUsd)
            // let amountOut = valueUsdOut / parseFloat(rates[possibleHome.coin].priceUsd)

            let action = {
                summary,
                pair:largestSurplus.coin+"_"+largestDeficit.coin,
                amountIn:amountNativeInput,
                amountOut:amountNativeOutput,
                valueUsdIn:amountUsdInput,
                valueUsdOut:amountUsdOutput
            }
            log.info(tag,"action")
            actions.push(action)
        } else{
            log.info(tag," Surplus is less then deficit. unable to fix deficit")
        }


        //if deficit > surplus
        if(largestDeficit.amountUsd >= largestSurplus.amountUsd){
            log.info(tag," Surplus is less then deficit. sending entire surplus")
            //send total surplus
            let amountSurplusUsd = largestDeficit.amountUsd

            let amountNativeInput = amountSurplusUsd / rates[largestSurplus.coin].priceUsd
            let amountNativeOutput = amountSurplusUsd / rates[largestDeficit.coin].priceUsd

            let amountUsdInput = amountNativeInput * rates[largestSurplus.coin].priceUsd
            let amountUsdOutput = amountNativeOutput * rates[largestDeficit.coin].priceUsd

            let summary = " Surplus is less then deficit. sending entire surplus" + " trading "+amountNativeInput+" ("+largestDeficit.coin+") for "+amountNativeOutput+" ("+largestSurplus.coin+")"
            log.info(tag,"summary: ",summary)

            // let amountIn = Math.abs(largestSurplus.amountNative)
            // let valueUsdOut = amountIn * parseFloat(rates[largestSurplus.coin].priceUsd)
            // let amountOut = valueUsdOut / parseFloat(rates[possibleHome.coin].priceUsd)

            let action = {
                summary,
                pair:largestSurplus.coin+"_"+largestDeficit.coin,
                amountIn:amountNativeInput,
                amountOut:amountNativeOutput,
                valueUsdIn:amountUsdInput,
                valueUsdOut:amountUsdOutput
            }
            log.info(tag,"action")
            actions.push(action)
        } else {
            log.info(tag," Surplus is more then deficit.")
        }

        return actions
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}



let apply_event = function (state:any,action:any) {
    let tag = TAG + ' | apply_event | '
    try {
        log.info(tag," checkpoint")
        let newState:any = {}
        log.info(tag,"state: ",state)

        let coinsInState = Object.keys(state)
        log.info(tag,"coinsInState: ",coinsInState)
        for(let i = 0; i < coinsInState.length; i++){
            let coin = coinsInState[i]
            newState[coin] = parseFloat(state[coin])
        }
        log.info(tag,"newState: ",newState)

        //action
        let coins = action.pair.split("_")
        let coinIn = coins[0]
        let coinOut = coins[1]
        log.debug(tag,"coinIn: ",coinIn)
        log.debug(tag,"coinOut: ",coinOut)

        //amount is abs
        let amountIn = action.amountIn
        log.info(tag,"amountIn: ",amountIn)
        log.info(tag,"amountIn: ",typeof(amountIn))

        let amountOut = action.amountOut
        log.info(tag,"amountOut: ",amountOut)
        log.info(tag,"amountOut: ",typeof(amountOut))

        //credit ltc
        log.info(tag,"newState[coinOut]: ",newState[coinOut])
        log.info(tag,"amountOut: ",amountOut)
        log.info(tag,"amountOut: ",amountOut + newState[coinOut])
        newState[coinOut] = newState[coinOut] + amountOut

        //debit btc
        newState[coinIn] = newState[coinIn] - amountIn


        //debit fee


        return newState
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}

let get_target_usd = function (coins:any,totalValueUsd:any,target:any,rates:any) {
    let tag = TAG + ' | get_asymmetrys | '
    try {

        //get asymmetrys
        let targetUsd:any = {}

        for(let i = 0; i < coins.length; i++){
            let coin = coins[i]

            //optimal amount usd
            log.info(tag," coin: ",coin)
            log.info(tag," target[coin]: ",target[coin])
            log.info(tag," totalValueUsd: ",totalValueUsd)
            let amountUsd = (target[coin] * totalValueUsd) / 100
            targetUsd[coin] = amountUsd || 0
        }


        return targetUsd
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}


let get_action = async function (portfolio:any,target:any,limit:number) {
    let tag = TAG + ' | get_actions | '
    try {

        if(Object.keys(portfolio).length !== Object.keys(portfolio).length){
            log.error(tag,"portfolio: ",portfolio)
            log.error(tag,"target: ",target)
            throw Error("Invalid inputs! missing coins")
        }

        //log.debug(coincap)
        let rates = await coincap.assets()

        let totalValueUsd = get_total_value_USD(portfolio,rates)

        //targetUsd
        let coins_target = Object.keys(target)
        let coins_current = Object.keys(portfolio)
        let coins = coins_target.concat(coins_current)
        log.info(tag," totalValueUsd: ",totalValueUsd)
        log.info(tag," coins: ",coins)
        log.info(tag," target: ",target)

        let targetUsd = get_target_usd(coins,totalValueUsd,target,rates)
        log.info(tag," targetUsd: ",targetUsd)

        //let actions:any = []

        let states:any = []
        //states.push(portfolio)

        let trades:any = []

        log.debug(tag,"step: 0")

        let state = portfolio
        states.push(state)

        let valuesUsd:any = get_valuesUsd(state,rates)
        log.info(tag," valuesUsd: ",valuesUsd)

        let actions = await find_best_action(coins,valuesUsd,state,totalValueUsd,target,rates,targetUsd)
        let action = actions[0]
        trades.push(action)

        let newState:any = await apply_event(state,action)

        let valuesUsdNew:any = get_valuesUsd(newState,rates)

        //
        // // //while imbalanced
        // let isSearching = true
        // let i = 0
        // while(i < limit){
        //     i++
        //
        //     //find action
        //     let coins = Object.keys(state)
        //     let valuesUsd:any = get_valuesUsd(state,rates)
        //
        //     log.info(tag,i + " valuesUsd: ",valuesUsd)
        //     log.info(tag,i + " totalValueUsd: ",totalValueUsd)
        //     log.info(tag,i + " state: ",state)
        //
        //     let actions = await find_best_action(coins,valuesUsd,state,totalValueUsd,target,rates,targetUsd)
        //     log.info(tag,"actions: ",actions)
        //
        //     // let action = find_best_action(actions,state,target,rates)
        //     // log.info(tag,"action: ",action)
        //     let action = actions[0]
        //
        //     trades.push(action)
        //
        //     //apply action
        //     let newState:any = await apply_event(state,action)
        //     state = newState
        //
        //     //if usd is less that 100$
        //     //@ts-ignore
        //     if(action.valueUsdIn > 100){
        //         actions.push(action)
        //
        //         //apply action
        //         let newState:any = await apply_event(states,action)
        //         log.info(tag,"newState: ",newState)
        //         //states.push(newState)
        //     }else{
        //         //isBalanced?
        //         isSearching = false
        //     }
        //
        // }

        //solution
        let solution:any = {
            current:valuesUsd,
            after:valuesUsdNew,
            //states,
            trade:action
        }


        //create solutions
        //pick solution


        return solution
    } catch (e) {
        console.error(tag, 'Error: ', e)
        throw e
    }
}
