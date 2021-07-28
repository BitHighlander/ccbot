require("dotenv").config({path:'./../../.env'})
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

//modules
let rebalance = require('../lib')




// let balances = {
//     ETH: 1.8511246974486741,
//     LINK: 0,
//     ATOM: 4.012683,
//     PAX: 258.012683,
// }
//
//
// let portfolioTarget = { ETH: 25, ATOM: 25, LINK: 25, PAX: 25 }
//
// let limit = 1
// rebalance.getAction(balances,portfolioTarget,limit)
//     .then(function(resp){
//         console.log(resp)
//
//         if(resp.trade.pair !== "ETH_LINK") throw Error("Failed test")
//     })


// let balances = {
//     ETH: 1.8511246974486741,
//     LINK: 0,
//     ATOM: 4.012683,
//     PAX: 258.012683,
// }
//
//
// let portfolioTarget = { ETH: 25, ATOM: 25, LINK: 25, PAX: 25 }
//
// let limit = 1
// rebalance.getAction(balances,portfolioTarget,limit)
//     .then(function(resp){
//         console.log(resp)
//
//         if(resp.trade.pair !== "ETH_LINK") throw Error("Failed test")
//     })
//


// let balances = { ETH: 0.8826640217033197,
//     LINK: 0,
//     ATOM: 4.706069,
//     PAX: 258.02494014 }
//
// let portfolioTarget = { ETH: 25, ATOM: 25, LINK: 25, PAX: 25 }

let balances = {
    USDT: 1000,
}

let portfolioTarget = { DOGE: 100}

let limit = 1
rebalance.getAction(balances,portfolioTarget,limit)
    .then(function(resp){
        console.log(resp)

        //if(resp.trade.pair !== "ETH_LINK") throw Error("Failed test")
    })




// let balances = {
//     "BTC":1,
//     "LTC":5,
//     "BCH":10
// }

// let balances = {
//     ETH: 1.942937409448674,
//     EOS: 0,
//     AE: 0,
//     ANT: 0,
//     BAT: 0,
//     BNT: 0,
//     CVC: 0,
//     DAI: 10.7065781718445,
//     DGD: 0,
//     DNT: 0,
//     EDG: 0,
//     FIRST: 0,
//     FOX: 1,
//     FUN: 0,
//     GNO: 0,
//     GNT: 0,
//     HT: 0,
//     HUSD: 0,
//     ICN: 0,
//     KCN: 0,
//     LINK: 0,
//     MANA: 0,
//     MKR: 0,
//     MLN: 0,
//     MTL: 0,
//     NMR: 0,
//     OMG: 0,
//     PAX: 0,
//     PAXG: 0,
//     PAY: 0,
//     POLY: 0,
//     QTUM: 0,
//     RCN: 0,
//     REP: 0,
//     RLC: 0,
//     SAI: 0,
//     SALT: 0,
//     SNGLS: 0,
//     SNT: 0,
//     STORJ: 0,
//     SWT: 0,
//     TKN: 0,
//     TRST: 0,
//     TRX: 0,
//     TUSD: 0,
//     USDC: 0,
//     USDT: 0,
//     WINGS: 0,
//     //XAUT: 0,
//     ZIL: 0,
//     ZRX: 0
// }
//
// let portfolioTarget = {
//     ETH: 1.96,
//     EOS: 1.96,
//     AE: 1.96,
//     ANT: 1.96,
//     BAT: 1.96,
//     BNT: 1.96,
//     //CVC: 1.96,
//     //DAI: 1.96,
//     DGD: 1.96,
//     DNT: 1.96,
//     EDG: 1.96,
//     FIRST: 1.96,
//     FOX: 1.96,
//     FUN: 1.96,
//     GNO: 1.96,
//     GNT: 1.96,
//     HT: 1.96,
//     HUSD: 1.96,
//     ICN: 1.96,
//     KCN: 1.96,
//     LINK: 1.96,
//     MANA: 1.96,
//     MKR: 1.96,
//     MLN: 1.96,
//     MTL: 1.96,
//     NMR: 1.96,
//     OMG: 1.96,
//     PAX: 1.96,
//     PAXG: 1.96,
//     PAY: 1.96,
//     POLY: 1.96,
//     QTUM: 1.96,
//     RCN: 1.96,
//     REP: 1.96,
//     RLC: 1.96,
//     SAI: 1.96,
//     SALT: 1.96,
//     SNGLS: 1.96,
//     SNT: 1.96,
//     STORJ: 1.96,
//     SWT: 1.96,
//     TKN: 1.96,
//     TRST: 1.96,
//     TRX: 1.96,
//     TUSD: 1.96,
//     USDC: 1.96,
//     USDT: 1.96,
//     WINGS: 1.96,
//     XAUT: 1.96,
//     ZIL: 1.96,
//     ZRX: 1.96
// }

//Value USD distro target
// let portfolioTarget = {
//     "BTC":33,
//     "LTC":33,
//     "BCH":33
// }



// let coins = Object.keys(balances)

// let run = async function(){
//     try{
//         //console.log(coincap)
//         let rates = await coincap.assets()
//         //console.log(rates)
//
//         let valuesUsd = {}
//         let totalValueUsd = 0
//         for(let i = 0; i < coins.length; i++){
//             let coin = coins[i]
//             //console.log("coin: ",coin)
//             let rateUsd =rates[coin].priceUsd
//             console.log(coin," rateUsD: ",rateUsd)
//             valuesUsd[coin] = balances[coin] * parseFloat(rateUsd)
//             totalValueUsd += valuesUsd[coin]
//         }
//
//         console.log("valuesUsd: ",valuesUsd)
//         console.log("totalValueUsd: ",totalValueUsd)
//         //get current percentages
//         let amountToTargetNative ={}
//         let amountToTargetsUSD ={}
//         let diffPercents = {}
//         for(let i = 0; i < coins.length; i++){
//             let coin = coins[i]
//             //console.log("coin: ",coin)
//             let percent = valuesUsd[coin] * 100 / totalValueUsd
//             console.log(coin,"percent: ",percent)
//             diffPercents[coin] = portfolioTarget[coin] - percent
//
//             //6 percent of coin out of total usd
//             let amountDiffUsd = diffPercents[coin] / 100 * totalValueUsd
//             console.log("amountDiffUsd: ",amountDiffUsd)
//             amountToTargetsUSD[coin]= amountDiffUsd
//             amountToTargetNative[coin] = parseFloat(amountDiffUsd) / parseFloat(rates[coin].priceUsd)
//         }
//
//         //
//         console.log("diffPercents: ", diffPercents)
//         console.log("amountToTargetsUSD: ", amountToTargetsUSD)
//         console.log("amountToTargetNative: ", amountToTargetNative)
//
//         //get actions
//         //sell 30.37 of btc for ltc
//         let amountBtc = diffPercents['LTC'] * 100 / parseFloat(rates['BTC'].priceUsd)
//         console.log("amountBtc: ",amountBtc)
//
//         //value usd
//         console.log("amountBtc: ",amountBtc * parseFloat(rates['BTC'].priceUsd))
//
//         //receive LTC
//         let amountLtc = diffPercents['LTC'] * 100 / parseFloat(rates['LTC'].priceUsd)
//         console.log("amountLtc: ",amountLtc)
//
//         //sell 4.69 pct of btc for bch
//         let amountBtc2 = diffPercents['BCH'] * 100 / parseFloat(rates['BTC'].priceUsd)
//         console.log("amountBtc2: ",amountBtc2)
//
//         //
//         let amountBch = diffPercents['BCH'] * 100 / parseFloat(rates['BCH'].priceUsd)
//         console.log("amountBch: ",amountBch)
//
//         //
//
//
//         //sell -36.12 of bitcoin
//         //buy 30.51 pct of ltc
//         //buy 4.60 pct of bch
//
//         //
//         // let amountUsdSale = amountToTargetsUSD['BTC'] * 100 / totalValueUsd
//         // console.log("amountUsdSale: ",amountUsdSale)
//
//         //
//
//
//         /*
//
//         BTC  rateUsD:  9351.2250683816116346
//         LTC  rateUsD:  67.2911147376205704
//         BCH  rateUsD:  384.0987746744774458
//         valuesUsd:  {
//           BTC: 9351.225068381611,
//           LTC: 336.45557368810285,
//           BCH: 3840.9877467447745
//           }
//         totalValueUsd:  13528.668388814489
//         BTC percent:  69.12154840097352
//         amountDiffUsd:  -4886.764500072831
//         LTC percent:  2.4869821923219324
//         amountDiffUsd:  4128.004994620678
//         BCH percent:  28.391469406704548
//         amountDiffUsd:  623.4728215640066
//         diffPercents:  {
//           BTC: -36.12154840097352,
//           LTC: 30.513017807678068,
//           BCH: 4.608530593295452
//            }
//
//          */
//
//
//         //options
//         // -36 percent over btc
//         // sell 30.5 pct for ltc
//         // sell 5.5 pct for bch
//
//
//         //same?
//         // sell x bitcoin for y ltc
//         // sell ltc for BCH
//
//         //verify target
//
//
//     }catch(e){
//         throw e
//     }
// }
// run()
