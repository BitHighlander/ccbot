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

/***********************************************
 //        onCreate
 //***********************************************/

//subscribe to redis
subscriber.subscribe("slack");
subscriber.subscribe("telegram");
subscriber.subscribe("discord");
subscriber.subscribe("cli");

subscriber.on("message", async function (channel:any, payloadS:string)
{
    console.log({channel, payloadS})
    var tag = TAG+ " | sub_to_slack | "
    let debug = true
    try{
        log.info(tag,"payloadS: ",payloadS)
        let payload = JSON.parse(payloadS)
        log.info(tag,"payload: ",payload)

        if(channel === 'slack'){
            let data = payload.data
            let sentence = data.text
            let username = data.user
            let channel = payload.channel
            console.log({channel, defaultChannelId})
            // @ts-ignore
            if(channel === defaultChannelId){
                //log.debug(tag,"sentence: ",sentence)
                //let resp = await rive.respond(sentence)
                let session = "test"
                let response = await deliberate_on_input(session,data,username)
                if(response){
                    log.debug(tag,"response: ",response)
                    let message:any = {}
                    if(response.view){
                        message.msg = " view generated by API "
                        message.view = response.view
                    }else if(response.sentences.length > 0){
                        // create smart view
                        let smartView = await views.smart(response)
                        message.view = smartView.view
                        message.msg = smartView.msg
                    }
                    //array to view

                    //publish response
                    message.channel = defaultChannelName

                    log.debug(tag,"message: ",message)
                    let channel = "publish"
                    slackOut.insert(message)
                    console.log({message, channel})
                    publisher.publish(channel,JSON.stringify(message))
                }

            } else {
                console.log(tag," wrong channel: ",payload.channel," expecting: ",defaultChannelId)
            }
        }else if(channel === 'discord'){

            let data = payload.data
            data.text = data.content
            let sentence = data.content
            let username = data.user
            let channel = data.channel
            let session = "test"
            let response = await deliberate_on_input(session,data,username)
            if(response){
                log.debug(tag,"response: ",response)
                let message:any = {}
                if(response.view){
                    message.msg = " view generated by API "
                    message.view = response.view
                }else if(response.sentences.length > 0){
                    // create smart view
                    let smartView = await views.smart(response)
                    message.view = smartView.view
                    message.msg = smartView.msg
                }
                //array to view

                //publish response
                message.channel = defaultChannelName

                log.debug(tag,"message: ",message)
                let channel = "publish"
                slackOut.insert(message)
                console.log({message, channel})
                if(message && channel){
                    publisher.publish(channel,JSON.stringify(message))
                }
            }
        } else if(channel === 'telegram'){
            let data = {
                user:payload.user,
                text:payload.text
            }
            let sentence = payload.text
            let username = payload.user
            let channelOut = payload.channel
            console.log({channel, defaultChannelIdTele})
            if(true){
                //log.debug(tag,"sentence: ",sentence)
                //let resp = await rive.respond(sentence)
                let session = "test"
                let response = await deliberate_on_input(session, data,username)
                if(response){
                    log.debug(tag,"response: ",response)
                    let message:any = {}
                    if(response.view){
                        message.msg = " view generated by API "
                        message.view = response.view
                    }else if(response.sentences.length > 0){
                        // create smart view
                        let smartView = await views.smart(response)
                        message.view = smartView.view
                        message.msg = smartView.msg
                    }
                    //array to view

                    //publish response
                    message.channel = channelOut

                    log.debug(tag,"message: ",message)
                    let channel = "publish-telegram"
                    slackOut.insert(message)
                    console.log({message, channel})
                    publisher.publish(channel,JSON.stringify(message))
                }

            } else {
                console.log(tag," wrong channel: ",payload.channel," expecting: ",defaultChannelIdTele)
            }
        }



    }catch(e){
        console.error(tag,"Error: ",e)
    }
})


/***********************************************
 //        lib
 //***********************************************/


const deliberate_on_input = async function(session:any,data:any,username:any){
    const tag = " | deliberate_on_input | "
    try{
        let output:any = {}
        output.sentences = []
        log.info(tag,"session: ",session)
        log.info(tag,"data: ",data)
        log.info(tag,"username: ",username)

        //Who am I talking too?
        let userInfo = await redis.hgetall(data.user)

        if(!userInfo) await redis.hmset(data.user,data)
        userInfo = data
        log.debug(tag,"userInfo: ",userInfo)

        tokenizer.setEntry(data.text);
        const sentences = tokenizer.getSentences()
        log.info(tag,"sentences: ",sentences)

        const source = "slack"

        const tokens = tokenizer.getTokens(sentences)
        log.debug(tag,"tokens: ",tokens)

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
                    let assets;

                    log.info("tokens.length: ",tokens.length)

                    if (tokens.length == 3) {
                        assets = tokens[2];
                        log.info("assets: ",assets)
                        assets = assets.split(",");
                        log.info("assets: ",assets)

                        await saveCF(user, assets);
                    } else {
                        assets = await getCF(user);
                    }


                    let message;

                    if (tokens.length == 4 && tokens[1] == 'in') {
                        message = await getMarketData(assets, tokens[2]);
                    } else {
                        message = await getMarketData(assets);
                    }

                    output.sentences.push(message)
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

                let result = " beeboop"

                console.log(tag,"result:", result)
                output.sentences.push(JSON.stringify(result))

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
