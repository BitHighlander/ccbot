
/*

        Redis pub/sub


 */
// log.infoger function
const TAG = 'Slack'
require('dotenv').config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require('dotenv').config({path:"../../../.env"});
require('dotenv').config({path:"../../../../.env"});
require('dotenv').config({path:"../../../../../.env"});

let log = require("@pioneer-platform/loggerdog")()
const {redis,subscriber,publisher} = require("@pioneer-platform/default-redis")

const Discord = require('discord.js');
const bot = new Discord.Client();

const botName = 'cappy'
const defaultChannelName = "markets"
const Tokenizer = require('sentence-tokenizer')
const tokenizer = new Tokenizer('reddit')


// app on_start
let usersByIndex:any = {}
let usersByName:any = {}
// let userAccounts = {}

let params = {
  icon_emoji: ':coincap_v2:',
}

let tag = " | slackbot | "
let msg:any
bot.login(process.env['DISCORD_BOT_TOKEN']);


bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});


// subscribe to redis
subscriber.subscribe('publish')
subscriber.on('message', async function (channel:any, payloadS:string) {
  try {
    if(msg.author && msg.author.id !== '865670112611008524'){
      let payload = JSON.parse(payloadS)
      log.info('payload: ', payload)
      log.info('msg author id: ', msg.author)
      log.info('msg author id: ', msg.author.id)
      if (!payload.channel) throw Error('101: invalid payload missing: channel')
      if (!payload.msg) throw Error('101: invalid payload missing: msg')
      if (!payload.view) throw Error('101: invalid payload missing: view')

      log.info('msg.channel.name: ', msg.channel.name)
      if(msg.channel.name === '📈markets' || msg.channel.name === 'markets'){
        log.info(tag,"WINNING!: ")
        log.info(tag,"msg.emojis",msg.emojis)
        //let emojiRef = "\:btc:"
        // let emojiRef = msg.guild.emojis.cache.find((emoji: { name: string; }) => emoji.name === 'btc');
        // emojiRef = "<:btc:595760361110634496>"
        // log.info(tag,"emojiRef: ",emojiRef)

        if(payload.view.text){
          msg.channel.send(payload.view.text);
        }
        if(payload.view.attachments){
          log.info("attachments: ",payload.view.attachments)
          msg.channel.send(payload.msg);
          if(payload.view.attachments[0].image_url){
            msg.channel.send(payload.view.attachments[0].image_url);
          }
        } else {
          log.error('Wrong channel: ',msg.channel.name)
        }
      }

    }
    // TODO if failed re-queue
  } catch (e) {
    console.error('Error: ', e)
  }
})

bot.on('message', async function (data:any) {
  try {
    msg = data
    const debug = true
    const verbose = true
    // log.info("data: ",data)
    log.info("data: ",data.author.id)
    // log.info("data: ",data.content)

    // const event = data.type


    //if (verbose) log.info('data-pre:', (data))
    // save event
    // if (data.type === 'reconnect_url') return false
    // if (data.type === 'presence_change') return false
    // if (data.type === 'user_typing') return false

    //


    // is message
    if (data.type === 'DEFAULT') {
      log.info('checkpoint1')
      //log.info("data.content: ",data.content)

      // save all messages seen
      // TODO this broken on prod, silent, death
      // let success = await slackInputs.insert(data)
      // if(debug) log.info("success: ",success)
      // if(debug) log.info("checkpoint2")

      tokenizer.setEntry(data.content)
      let output = tokenizer.getSentences()
      if (verbose) log.info('output: ', output)
      let tokens = tokenizer.getTokens(output)
      if (verbose) log.info('tokens: ', tokens)

      // publish to net
      let user = 'unknown'
      let slackInput = { channel:'any', data, user, tokens }

      if (debug) log.info('checkpoint3')
      //if (debug) log.info('slackInput: ', slackInput)
      let result = await publisher.publish('discord', JSON.stringify(slackInput))
      if (debug) log.info('publish result: ', result)

      // add to queue
      // redis.sadd(slackInput)

    }
    return
  } catch (e) {
    console.error('e', e)
    throw e
  }
})

let onExit = function(){
  process.exit(1)
}
setTimeout(onExit,30 * 60 * 1000)
