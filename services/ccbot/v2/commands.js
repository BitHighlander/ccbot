const { getMarketDataForSymbols, getHistoryForSymbol } = require('./coincapApi');
//const AWS = require('aws-sdk');
const asciichart = require('asciichart');

// AWS.config.update({ region: 'eu-west-1' })
// const dynamodb = new AWS.DynamoDB();
const {redis,subscriber,publisher} = require("@pioneer-platform/default-redis")
let log = require("@pioneer-platform/loggerdog")()

const connection  = require("@pioneer-platform/default-mongo")
const usersDB = connection.get('usersCCbot')
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({user: 1}, {unique: true})

const getMarketData = async (symbols, inCurrencySymbol = 'usd') => {
  const marketDatas = await getMarketDataForSymbols(symbols);

  let unit = '$';
  let divisor = 1;
  let precision = 5;
  let currency24hr;
  let currencyStartPrice;
  let currencyEndPrice;

  if (inCurrencySymbol !== 'usd') {
    const currencyData = await getMarketDataForSymbols([inCurrencySymbol]);
    currency24hr = parseFloat(currencyData[0].changePercent24Hr);

    currencyEndPrice = parseFloat(currencyData[0].priceUsd);
    divisor = currencyEndPrice;
    unit = `:${inCurrencySymbol}:`

    currencyStartPrice = currencyEndPrice / (1 + (currency24hr / 100));

    if (inCurrencySymbol === 'btc') {
      precision = 7;
    }
  }

  const messages = marketDatas.map((marketData, i) => {
    if (Array.isArray(marketData)) {
      marketData = marketData[0];
    }

    if (marketData === undefined) {
      return `${symbols[i]} not found :rip:`;
    }

    isXRP = marketData.symbol === 'XRP';

    //const symbol = isXRP ? '*X:poopfire:P*' : `https://assets.coincap.io/assets/icons/${marketData.symbol.toLowerCase()}@2x.png`;
    //get emoji symbol


    const symbol = isXRP ? '*X:poopfire:P*' : `${marketData.symbol.toLowerCase()}`;
    let emoji = isXRP ? ':poop:' : `:${marketData.symbol.toLowerCase()}:`;
    // Fix BAT emoji
    if (emoji === ':bat:') {
      emoji = ':bat_:'
    } else if (emoji === ':grin:') {
      emoji = ':grinmw:'
    } else if (emoji === ':dash:') {
      emoji = ':dash_:'
    }

    const endPrice = parseFloat(marketData.priceUsd);
    let percent24Hr = parseFloat(marketData.changePercent24Hr)

    const startPrice = endPrice / (1 + (percent24Hr / 100));

    const value = endPrice / divisor;

    if (inCurrencySymbol !== 'usd') {
      const startRatio = startPrice / currencyStartPrice;
      const endRatio = endPrice / currencyEndPrice;
      // console.log(startPrice, currencyStartPrice)

      percent24Hr = (endRatio - startRatio) / startRatio * 100;
    }

    // Figure out 24% chnage emoji based on value.
    let changeEmoji = percent24Hr >= 50 ? ':moon:' : percent24Hr >= 20 ? ':coincap_v2:' : percent24Hr >= 0 ? ':chart_with_upwards_trend:' : percent24Hr <= -50 ? ':this_is_fine:' : percent24Hr <= -20 ? ':rekt:' : ':chart_with_downwards_trend:';
    changeEmoji = isXRP ? ':sadpoop:' : changeEmoji;

    return `${symbol} ${emoji} ${unit}${value.toFixed(precision)} ${changeEmoji} ${percent24Hr.toFixed(2)}%`
  });

  const message = messages.join("\n");
  return message;
}

const chart1d = async (symbol) => {
  const history = await getHistoryForSymbol(symbol);
  const marketData = await getMarketData([symbol])

  historyPrices = history.map(p => p.priceUsd);
  const chart = "```\n" + asciichart.plot(historyPrices, { height: 8, offset: 2 }) + "\n```"
  return marketData + "\n" + chart;
};

const saveCF = async (user, assets, username) => {
  let tag = " | saveCF | "
  try{
    log.info(tag, "input: ",{user,assets,username})
    for(let i = 0; i < assets.length; i++){
      let asset = assets[i]
      await redis.sadd(user+":altfolio",asset)
    }

    //get members
    let portfolio = await redis.smembers(user+":altfolio")

    //save to mongo
    //get user from mongo
    let userInfo = await usersDB.findOne({user})
    log.info(tag, "userInfo: ",userInfo)
    if(userInfo){
      log.info(tag, "update user portfolio: ")
      //for each symbol NOT in mongo
      for(let i = 0; i < portfolio.length; i++){
        let asset =  portfolio[i]
        if(userInfo.portfolio.indexOf(asset) === -1){
          //save
          await usersDB.update({user},{ $addToSet: { "portfolio":asset } })
        }
      }
    } else {
      let userInfo = {
        user,
        username,
        portfolio,
      }
      log.info(tag,"userInfo: ",userInfo)
      let saveMongo = await usersDB.insert(userInfo)
      log.info(tag,"saveMongo: ",saveMongo)
    }

    return true
  }catch(e){
    log.error(e)
    throw e
  }
};

const getCF = async (user,username) => {
  let tag = " | getCF | "
  try{
    log.info(tag, "input: ",{user})

    let cf = await redis.smembers(user+":altfolio")

    //get members
    let portfolio = await redis.smembers(user+":altfolio")

    //save to mongo
    //get user from mongo
    let userInfo = await usersDB.findOne({user})
    log.info(tag, "userInfo: ",userInfo)
    if(userInfo){
      log.info(tag, "update user portfolio: ")
      //for each symbol NOT in mongo
      for(let i = 0; i < portfolio.length; i++){
        let asset =  portfolio[i]
        if(userInfo.portfolio.indexOf(asset) === -1){
          //save
          await usersDB.update({user},{ $addToSet: { "portfolio":asset } })
        }
      }
    } else {
      let userInfo = {
        user,
        username,
        portfolio,
      }
      log.info(tag,"userInfo: ",userInfo)
      let saveMongo = await usersDB.insert(userInfo)
      log.info(tag,"saveMongo: ",saveMongo)
    }

    return cf
  }catch(e){
    log.error(e)
    throw e
  }
};

const delCF = async (user) => {
  let tag = " | delCF | "
  try {
    log.info(tag, "input: ", { user })
    await redis.del(user + ":altfolio")

    const cf = await redis.smembers(user + ":altfolio")
    for(let i = 0; i < cf.length; i++) {
      redis.srem(user + ":altfolio", cf[i])
    }
    return true
  } catch (error) {
    log.error(`Error deleting coinfolio for ${user}.`)
    log.error(`Error  name: ${error.name}  message: ${error.message}`)
  }
}

const help = () => {
  return `
*Main Command*
  \`ccv2 [coin1,coin2,coin3...coinN]\` (no spaces between coins)

*Coinfolio*
  Save your coinfolio
    \`ccv2 cf [coin1,coin2,coin3...coinN]\`
  Query your coinfolio
    \`ccv2 cf\`
  Delete you coinfolio
    \`cc delete\`  
`
}

module.exports = {
  getMarketData,
  delCF,
  saveCF,
  getCF,
  chart1d,
  help
};
