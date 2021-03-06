/*
        CC v3

 */
const TAG = " | app | "
require('dotenv').config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require('dotenv').config({path:"../../../.env"});
require('dotenv').config({path:"../../../../.env"});
let log = require("@pioneer-platform/loggerdog")()
const {redis,subscriber,publisher} = require("@pioneer-platform/default-redis")

/***********************************************
 //        V2 inports
 //***********************************************/

const easterEggCommands = require('../v2/easterEggs');
log.info(easterEggCommands)

const { getMarketData, chart1d, saveCF, getCF, delCF, help } = require('../v2/commands');

let rebalance = require('@pioneer-platform/pioneer-rebalance')
const Accounting = require('@pioneer-platform/accounting')
const accounting = new Accounting(redis)

const Tokenizer = require('sentence-tokenizer');
const tokenizer = new Tokenizer('reddit');

const rive = require('../nlp/rive.js')
rive.initialize()

// modules
//let request = require('./modules/request.js')
let views = require('../modules/views.js')

//mongo
let connection  = require("@pioneer-platform/default-mongo")
let slackOut = connection.get("slackOut");
let discordIn = connection.get("discordIn");

const defaultChannelNameDiscord = process.env['DISCORD_BOT_CHANNEL'] || 'markets'
const defaultChannelName = process.env['SLACK_CHANNEL_CCV3']
const defaultChannelId = process.env['SLACK_CHANNELID_CCV3']

const defaultChannelIdTele = process.env['TELEGRAM_DEFAULT_CHANNEL']

let params = {
    icon_emoji: ':coincap_v2:',
}


const integrations:any = {}
const urban = require('../modules/urban.js')
integrations['urban'] = urban
const coincapRive = require('../modules/coincap.js')
integrations['coincapRive'] = coincapRive

interface Data {
    user:string
    username:string
    channel:string
    text:string
}

/***********************************************
 //        Discord
 //***********************************************/

const Discord = require('discord.js');
const bot = new Discord.Client();

let discordChannel = process.env['DISCORD_BOT_CHANNEL']
let DISCORD_ADMIN_USERID = process.env['DISCORD_ADMIN_USERID']

let msg:any
if(!process.env['DISCORD_BOT_TOKEN']) throw Error("env DISCORD_BOT_TOKEN required!")
bot.login(process.env['DISCORD_BOT_TOKEN']);

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', async function (message:any) {
    let tag = " | discord message | "
    try {
        // log.info("message: ",message)
        log.info("user: ",message.author.id)
        log.info("channel: ",message.channel.name)
        log.info("content: ",message.content)

        //known user?
        if(message.channel.name && message.content && message.author.id){
            let data:Data = {
                channel:message.channel.name,
                user:message.author.id,
                username:message.author.username,
                text:message.content
            }
            let session = 'discord'
            let responses = await deliberate_on_input(session,data,data.username)
            log.info('responses: ',responses)
            if(data.channel === discordChannel){
                //save in mongo for scoring later
                let publish = []
                //parse output
                for(let i = 0; i < responses.sentences.length; i++){
                    let response = responses.sentences[i]
                    tokenizer.setEntry(response);
                    //replace emojis and reformat
                    const sentences = tokenizer.getSentences()
                    log.info(tag,"sentences: ",sentences)
                    const tokens = tokenizer.getTokens(sentences)
                    log.info(tag,"tokens: ",tokens)

                    for(let j = 0; j < tokens.length; j++){
                        let token = tokens[j]
                        log.info(tag,"token: ",token)
                        //if has :
                        if(token.indexOf(":") >= 0){
                            //strip emoji
                            let tokenSplit = token.split(':')
                            log.info(tag,"tokenSplit: ",tokenSplit)
                            let emojiString = tokenSplit[1]

                            // let emojiString = token.split(':').pop().split(':')[0]; // returns 'two'
                            log.info(tag,"emojiString: ",emojiString)

                            //lookup magic id
                            let emojiId = await message.guild.emojis.cache.find((emoji: { name: string; }) => emoji.name === emojiString);
                            log.info(tag,"emojiId: ",emojiId)

                            if(!emojiId){
                                publish.push(token)
                            } else {
                                //replace in token
                                let emojiDiscord = "<:"+emojiString+":"+emojiId+">"
                                let tokenTranslated = token.replace(emojiString,emojiDiscord)
                                publish.push(tokenTranslated)
                            }
                        } else {
                            publish.push(token)
                        }
                    }
                    if(publish.length === 5){
                        //custom window 1 coin
                        //tokens to view view
                        log.info(tag,"publish: ",publish)
                        const exampleEmbed = new Discord.MessageEmbed()
                            .setColor("#0099ff")
                            .setAuthor(
                                ""+publish[0].toUpperCase()+"",
                                "https://assets.coincap.io/assets/icons/"+publish[0]+"@2x.png",
                                "https://coincap.io/assets/"+publish[0]+""
                            )
                            .addFields(
                                { name: "Price", value: publish[2], inline: true },
                                { name: "Change", value: publish[3]+" "+publish[4], inline: true, setColor: '#0099ff' },
                            )
                            .setTimestamp()
                            .setFooter("CoinCap", "https://iconape.com/wp-content/png_logo_vector/coincap.png");
                        message.channel.send(exampleEmbed);

                    } else {

                        //tokens to sentence
                        const searchRegExp = new RegExp(',', 'g');
                        const replaceWith = ' ';
                        //publish
                        message.channel.send(publish.toString().replace(searchRegExp, replaceWith));
                    }
                }

                //display views
                if(responses.views && responses.views.length > 0){
                    //
                    for(let i = 0; i < responses.views.length; i++){
                        let view = responses.views[i]
                        //debug
                        // message.channel.send(JSON.stringify(view));

                        switch(view.type) {
                            case 'percentages':
                                // code block
                                let allFieldsPercentages:any = []
                                let targets = Object.keys(view.data)
                                for(let i = 0; i < targets.length; i++){
                                    let coin = targets[i]
                                    let entry = {
                                        name:coin,
                                        value:view.data[coin],
                                        inline: true,
                                        setColor: '#ff002b'
                                    }
                                    allFieldsPercentages.push(entry)
                                }

                                //view to discord
                                const exampleEmbedPercent = new Discord.MessageEmbed()
                                    .setColor("#0099ff")
                                    .setAuthor(
                                        'Your Target portfolio percentages'
                                    )
                                    .addFields(
                                        allFieldsPercentages
                                    )
                                    .setTimestamp()
                                    .setFooter("CoinCap", "https://iconape.com/wp-content/png_logo_vector/coincap.png");


                                message.channel.send(exampleEmbedPercent);
                                break;
                            case 'balances':
                                // code block
                                let allFields:any = []
                                let coins = Object.keys(view.data)
                                for(let i = 0; i < coins.length; i++){
                                    let coin = coins[i]
                                    //allFields[coin] = view.data[coin]
                                    let entry = {
                                        name:coin,
                                        value:await accounting.balance(data.user+":balances",coin),
                                        inline: true,
                                        setColor: '#ff002b'
                                    }
                                    allFields.push(entry)
                                }

                                //view to discord
                                const exampleEmbed = new Discord.MessageEmbed()
                                    .setColor("#0099ff")
                                    .setAuthor(
                                        'Your Account Balances'
                                    )
                                    .addFields(
                                        allFields
                                    )
                                    .setTimestamp()
                                    .setFooter("CoinCap", "https://iconape.com/wp-content/png_logo_vector/coincap.png");


                                message.channel.send(exampleEmbed);
                                break;
                            case 'cf':
                                // code block
                                let allFields2:any = []
                                log.info(tag,"view.data: ",view.data)
                                let split = view.data.split('\n')
                                log.info(tag,"split: ",split)

                                const exampleEmbedHeader = new Discord.MessageEmbed()
                                    .setColor("#0099ff")
                                    .setAuthor(
                                        data.username+" Altfolio"
                                    )
                                    .setTimestamp()
                                    .setFooter("CoinCap", "https://iconape.com/wp-content/png_logo_vector/coincap.png");
                                message.channel.send(exampleEmbedHeader);

                                let addData = []
                                for(let i = 0; i < split.length; i++){
                                    let coinData = split[i]
                                    log.info(tag,"coinData: ",coinData)
                                    let coin = coinData.split(' ')[0]

                                    tokenizer.setEntry(coinData);
                                    const sentences = tokenizer.getSentences()
                                    log.info(tag,"sentences: ",sentences)
                                    const tokens = tokenizer.getTokens(sentences)
                                    log.info(tag,"tokens: ",tokens)

                                    //lookup magic id
                                    let emojiId = await message.guild.emojis.cache.find((emoji: { name: string; }) => emoji.name === coin);
                                    log.info(tag,"emojiId: ",emojiId)

                                    //
                                    let emojiDiscord
                                    if(emojiId){
                                        emojiDiscord = "<:"+coin+":"+emojiId+">"
                                    }
                                    coinData = coinData.replace(coin,'')
                                    let entry = {
                                        name:emojiDiscord || coin,
                                        value:coinData,
                                        setColor: '#ff002b'
                                    }
                                    addData.push(entry)

                                    const exampleEmbed = new Discord.MessageEmbed()
                                        .setColor("#0099ff")
                                        .setAuthor(
                                            ""+coin.toUpperCase()+"",
                                            "https://assets.coincap.io/assets/icons/"+coin+"@2x.png",
                                            "https://coincap.io/assets/"+coin+""
                                        )
                                        .addFields(
                                            { name: "Price", value: tokens[2], inline: true },
                                            { name: "Change", value: tokens[3]+" "+tokens[4], inline: true, setColor: '#0099ff' },
                                        )
                                    message.channel.send(exampleEmbed);

                                }
                                break;
                            default:
                            // code block
                        }
                    }
                }
            }
        }
        return
    } catch (e) {
        console.error('e', e)
        throw e
    }
})



/***********************************************
 //        lib
 //***********************************************/


const deliberate_on_input = async function(session:any,data:Data,username:string){
    const tag = " | deliberate_on_input | "
    try{
        let output:any = {}
        output.views = []
        output.sentences = []
        log.info(tag,"session: ",session)
        log.info(tag,"data: ",data)
        log.info(tag,"username: ",username)
        log.info(tag,"data: ",data.text)

        //Who am I talking too?
        // let userInfo = await redis.hgetall(data.user)
        // if(!userInfo) await redis.hmset(data.user,data)
        // userInfo = data
        // log.debug(tag,"userInfo: ",userInfo)

        let userInfo = {
            username,
            state:'0'
        }

        if(!data.text) throw Error("Invalid data!: ")
        tokenizer.setEntry(data.text);
        const sentences = tokenizer.getSentences()
        log.info(tag,"sentences: ",sentences)


        const tokens = tokenizer.getTokens(sentences)
        log.debug(tag,"tokens: ",tokens)

        //admin
        if(tokens[0] === "hi" && data.user === DISCORD_ADMIN_USERID){
            output.sentences.push('hello admin!')
        }

        //admin override give balance
        if(tokens[0] === "credit" && data.user === DISCORD_ADMIN_USERID){
            //TODO
        }

        //balances
        if(tokens[0] === 'balance' || tokens[0] === 'balances'){
            let allBalances = await redis.hgetall(data.user+":balances")
            log.info(tag,"allBalances: ",allBalances)
            if(Object.keys(allBalances).length === 0){
                let balanceNewOut = await(accounting.credit(data.user+":balances",1000,'USDT'))
                output.sentences.push('New User detected! Free moniez given 1000 USDT')
            } else {
                //build balance view
                output.views.push({
                    type:'balances',
                    data:allBalances
                })
                output.sentences.push('View your current balances')
            }
        }

        //percentages
        if(tokens[0] === 'percentages' || tokens[0] === 'percentage'){
            let allBalances = await redis.hgetall(data.user+":percentages")
            if(Object.keys(allBalances).length === 0){
                //
                output.sentences.push('You must set your altfolio percentages.')
                output.sentences.push('usage: setPercent *asset *amount')
                output.sentences.push('example: setPercent DOGE 100')
            } else {
                //build balance view
                output.views.push({
                    type:'percentages',
                    data:allBalances
                })
            }
        }

        //rebalance
        if(tokens[0] === 'rebalance' || tokens[0] === 'rebalancer'){
            let allBalances = await redis.hgetall(data.user+":percentages")
            if(Object.keys(allBalances).length === 0){
                //
                output.sentences.push('You must set your altfolio percentages.')
                output.sentences.push('usage: setPercent *asset *amount')
                output.sentences.push('example: setPercent DOGE 100')
            }else{
                //perform re-balance

                //current balances
                let allBalances = await redis.hgetall(data.user+":balances")
                let targets = await redis.hgetall(data.user+":percentages")
                log.info(tag,"targets: ",targets)
                log.info(tag,"allBalances: ",allBalances)
                let allBalancesNative:any = {}
                let positions = Object.keys(allBalances)
                for(let i = 0; i < positions.length; i++){
                    let coin = positions[i]
                    allBalancesNative[coin] = await(accounting.balance(data.user+":balances",coin))
                }

                //current targets
                let limit = 1
                let result = await rebalance.getAction(allBalancesNative,targets,limit)
                log.info(tag,"result: ",result)

                // output.sentences.push("performing mock trade: "+result.trade.pair)
                output.sentences.push("summary: "+result.trade.summary)
                let pair = result.trade.pair.split("_")
                //debit amount in
                let balanceNew = await(accounting.debit(data.user+":balances",result.trade.amountIn,pair[0]))
                // output.sentences.push("balanceNew: "+pair[0]+ " "+balanceNew)
                //credit amountOut
                //debit amount in
                let balanceNewOut = await(accounting.credit(data.user+":balances",result.trade.amountOut,pair[1]))
                // output.sentences.push("balanceNewOut: "+pair[1]+ " "+balanceNewOut)

                let allBalancesFinal = await redis.hgetall(data.user+":balances")
                log.info(tag,"final balances: ",allBalancesFinal)

                //let result = await perform_rebalance(data.user,allBalances,targets)
                let allBalances2 = await redis.hgetall(data.user+":balances")
                output.views.push({
                    type:'balances',
                    data:allBalances2
                })
            }
        }

        //setPercent
        if(tokens[0] === 'setPercent' || tokens[0] === 'setPercentage' || tokens[0] === 'setpercent'){
            let coin = tokens[1]
            let percentage = tokens[2]
            if(coin && percentage){
                let saved = await redis.hset(data.user+":percentages",coin,percentage)
                output.sentences.push('saved: '+saved)
            } else {
                output.sentences.push('invalid command')
                output.sentences.push('usage: \n setPercent *asset *amount')
                output.sentences.push('example: \n setPercent DOGE 100')
            }
        }

        //cc bot OG
        if(tokens[0] === "cc" || tokens[0] === "ccv2" || tokens[0] === "Cc"){
            //cc bot
            let firstToken = tokens[1]

            log.info("in length: ",tokens.length)
            log.info("in asset: ",tokens[3])
            if (easterEggCommands(firstToken) !== undefined) {
                // await sendResult(event, easterEggCommands(firstToken));
                // return finish;
                const message = easterEggCommands(firstToken)
                log.info(message)
                output.view = message
                //output.sentences.push(message.text)
            } else {
                if(tokens[1] === 'help'){
                    log.info("cc bot commands: ")
                    output.sentences.push(help())
                } else if (firstToken === 'delete' || firstToken === 'del') {
                    const user = data.user;
                    await delCF(user)
                    output.sentences.push("Dumpings your shitcoins")
                }else if (firstToken === 'stable' || firstToken === 'stablecoin') {
                    const assets = ['usdt','tusd','gusd','dai','usdc','pax']
                    const message = await getMarketData(assets);
                    output.sentences.push(message)
                } else if (firstToken === 'privacy') {
                    const assets = ['xmr','zec','grin','beam', 'dash', 'btcp', 'kmd', 'xvg']
                    const message = await getMarketData(assets);
                    output.sentences.push(message)
                } else if (firstToken === 'food') {
                    const assets = ['food','sub','wings','chips','brd','salt','grlc']
                    const message = await getMarketData(assets);
                    output.sentences.push(message)
                } else if (firstToken === 'animal' || firstToken === 'animals') {
                    const assets = ['doge','kmd','rvn','drgn','prl']
                    const message = await getMarketData(assets);
                    output.sentences.push(message)
                } else if (firstToken === 'shitcoins') {
                    const assets = ['x','tron','bsv']
                    const message = await getMarketData(assets);
                    output.sentences.push(message)
                } else if (firstToken === 'awesome') {
                    const assets = ['meesh','fox','btc']
                    const message = await getMarketData(assets);
                    output.sentences.push(message)
                } else if (firstToken === 'cf') {
                    const user = data.user;
                    // log.info(tag,"CF user: ",user)
                    let assets;

                    log.info("tokens.length: ",tokens.length)

                    if (tokens.length == 3) {
                        assets = tokens[2];
                        log.info("assets: ",assets)
                        assets = assets.split(",");
                        log.info("assets: ",assets)

                        await saveCF(user, assets, username);
                    } else {
                        assets = await getCF(user,username);
                    }


                    let message;

                    if (tokens.length == 4 && tokens[1] == 'in') {
                        message = await getMarketData(assets, tokens[2]);
                    } else {
                        message = await getMarketData(assets);
                    }

                    let view = {
                        username,
                        type:'cf',
                        data:message,
                    }
                    output.views.push(view)
                    // message = "user: "+user+" "+message
                    // output.sentences.push(message)
                } else if (firstToken === 'chart') {
                    const message = await chart1d(tokens[2]);
                    output.sentences.push(message)
                }else if (tokens.length === 4 && tokens[2] === 'in') {
                    log.info("************** WINNING *********")
                    const assets = tokens[1].split(",");
                    log.info("**** assets: ",assets)
                    log.info("in asset: ",tokens[3])
                    const message = await getMarketData(assets, tokens[3]);

                    output.sentences.push(message)
                } else {
                    log.info("************** LOSSS *********")
                    const assets = tokens[1].split(",");

                    const message = await getMarketData(assets);
                    output.sentences.push(message)
                }
            }

        } else {
            let state = null
            if(userInfo.state) state = parseInt(userInfo.state)

            switch (state){
                case 1:
                    log.info("State 1")
                    await redis.hset(data.user,"state",0)

                    break
                case 2:
                    log.info("State 2 learn")
                    // a command was handled and action taken
                    output.sentences.push("Ok, lets learn something")
                    //save?
                    break
                case null:
                    log.info("State 3 learn")

                    let response2 = await rive.respond(sentences[0])
                    if(response2 != "ERR: No Reply Matched"){
                        output.sentences.push(response2)
                    }
                    //ignore
                    break
                default:
                    log.info("State 4 learn")
                    let response = await rive.respond(sentences[0])
                    if(response != "ERR: No Reply Matched"){
                        output.sentences.push(response)
                    }
                    break
            }
        }

        for (let i = 0; i < output.sentences.length; i++) {
            log.debug(tag,"output: ",output[i])
            //if contains a CMD: assume command
            log.debug(tag,"sentences: ",output.sentences[i])
            if(output.sentences[i] && output.sentences[i] != true && output.sentences[i].indexOf("CMD:") >= 0){
                //
                log.debug(tag,"split: ",output.sentences[i].split(":"))
                const command = output.sentences[i].split(":")[1]
                log.debug(tag,"command: ",command)

                //
                tokenizer.setEntry(command);
                const commandSentences = tokenizer.getSentences()
                log.debug(tag,"commandSentences: ",commandSentences)
                const commandTokens = tokenizer.getTokens(command)
                log.debug(tag,"commandTokens: ",commandTokens)

                //TODO command modules
                // let result = " beeboop"
                //
                // console.log(tag,"result:", result)
                // output.sentences.push(JSON.stringify(result))

            }
        }

        //remove commands
        for (let i = 0; i < output.sentences.length; i++) {
            if(output.sentences[i] != true && output.sentences[i].indexOf("CMD:") >= 0){
                output.sentences.splice(i, 1);
            }
        }


        return output
    }catch(e){
        console.error(e)
    }
}
