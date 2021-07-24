
/*
    Discord Bridge
        Redis pub/sub


 */
// log.infoger function
const TAG = 'Discord'
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

const Tokenizer = require('sentence-tokenizer')
const tokenizer = new Tokenizer('reddit')

let discordChannel = process.env['DISCORD_BOT_CHANNEL']
let botUserId = process.env['BOT_USER_ID'] || '865670112611008524'

let msg:any
if(!process.env['DISCORD_BOT_TOKEN']) throw Error("env DISCORD_BOT_TOKEN required!")
bot.login(process.env['DISCORD_BOT_TOKEN']);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});


// subscribe to redis
subscriber.subscribe('publish')
subscriber.on('message', async function (channel:any, payloadS:string) {
  let tag = TAG + ' message '
  try {
    if(msg.author && msg.author.id !== '865670112611008524' && msg.author.id !== botUserId){
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
        // log.info(tag,"**** emojiRef: ",emojiRef)
        // emojiRef = "<:btc:595760361110634496>"
        // log.info(tag,"emojiRef: ",emojiRef)

        //if message display it
        if(payload.msg){
          let publish = []
          log.info("Publish View: ")
          tokenizer.setEntry(payload.msg);
          //replace emojis and reformat
          const sentences = tokenizer.getSentences()
          log.info(tag,"sentences: ",sentences)
          const tokens = tokenizer.getTokens(sentences)
          log.info(tag,"tokens: ",tokens)

          for(let i = 0; i < tokens.length; i++){
            let token = tokens[i]
            log.info(tag,"token: ",token)

            //if has :
            if(token.indexOf(":") >= 0){
              //strip emoji
              let tokenSplit = token.split(':')
              log.info(tag,"tokenSplit: ",tokenSplit)
              // let pop = tokenSplit.pop()
              // log.info(tag,"pop: ",pop)
              // let tokenSplit2 = pop.split(':')
              // log.info(tag,"tokenSplit2: ",tokenSplit2)
              let emojiString = tokenSplit[1]


              // let emojiString = token.split(':').pop().split(':')[0]; // returns 'two'
              log.info(tag,"emojiString: ",emojiString)

              //lookup magic id
              let emojiId = await msg.guild.emojis.cache.find((emoji: { name: string; }) => emoji.name === emojiString);
              log.info(tag,"emojiId: ",emojiId)

              if(!emojiId){
                publish.push(token)
              }else{
                //replace in token
                let emojiDiscord = "<:"+emojiString+":"+emojiId+">"
                let tokenTranslated = token.replace(emojiString,emojiDiscord)
                publish.push(tokenTranslated)
              }
            } else {
              publish.push(token)
            }
          }

          const search = ',';
          const searchRegExp = new RegExp(search, 'g'); // Throws SyntaxError
          const replaceWith = ' ';
          msg.channel.send(publish.toString().replace(searchRegExp, replaceWith));
        }


        if(payload.view.text){
          let publish = []
          //TODO
          log.info("Publish View: TEXT")

          // msg.channel.send(publish.toString());
        }

        if(payload.view.attachments){
          log.info("attachments: ",payload.view.attachments)
          // msg.channel.send(payload.msg);
          if(payload.view.attachments[0].image_url){
            //msg.channel.send(payload.view.attachments[0].image_url);

            const attachment = new Discord.MessageEmbed()
                .setColor("#0099ff")
                .setAuthor(
                    payload.view.attachments[0].image_url,
                )
                .addFields(
                    { name: "easter egg", value: payload.msg, inline: true },
                )
                .setTimestamp()
                .setFooter("ccBot: ", payload.view.attachments[0].image_url);
            msg.channel.send(attachment);

          }
        } else {
          log.error('Wrong channel: ',msg.channel.name)
        }
      }

    }
    msg = null
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
    data.user = data.author.id
    let user = data.author.id

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

      let slackInput = { channel:'any', data, user, tokens }

      log.info('slackInput: ',slackInput)
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
