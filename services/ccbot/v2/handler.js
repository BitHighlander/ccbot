const { sendResult, invite } = require('./slack');
const easterEggCommands = require('./easterEggs');
const { getMarketData, chart1d, delCF, saveCF, getCF, help } = require('./commands');
const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-west-1' })
const sns = new AWS.SNS();

const finish = { statusCode: 200, body: '' };

module.exports.handleSlackMessage = async (event, context) => {
  try {
    console.log(event);
    const body = JSON.parse(event.body);
    const type = body.type;

    if (type === 'url_verification') {
      console.log(`Sending url_verification challenge response`);

      return {
        statusCode: 200,
        body: body.challenge,
      };
    } else if (type === 'event_callback') {
      await sns.publish({
        TopicArn: 'arn:aws:sns:eu-west-1:572411006100:slack-dispatch',
        Message: JSON.stringify(body)
      }).promise();

      return { statusCode: 200, body: '' };
    }
  }
  catch (err) {
    console.log('Error', err);
    return finish;
  }
};

module.exports.doWork = async (snsEvent, context) => {
  try {
    console.log('NODE_ENV', process.env.NODE_ENV)
    // let event;
    // if (process.env.NODE_ENV === 'local') {
    //   console.log(snsEvent);
    //   event = snsEvent;
    // } else {
    //   event = JSON.parse(snsEvent.Records[0].Sns.Message);
    //   event = event.event;
    // }
    let event = JSON.parse(snsEvent.Records[0].Sns.Message);
    event = event.event;

    const eventType = event.type

    if (eventType == 'message') {
      let text = event.text;
      text = text.toLowerCase();

      const commandTokens = text.split(" ");
      let firstToken = commandTokens[0];

      if (event.subtype !== 'bot_message' && commandTokens.includes('delete')) {
        message = await delCF(event.user)
        await sendResult(event, {text: message})
        return finish
      }

      if (event.subtype !== 'bot_message' &&
         ( firstToken == 'ccv2' || firstToken == 'cc' ) ) {

        commandTokens.shift();
        const firstToken = commandTokens[0];

        if (easterEggCommands(firstToken) !== undefined) {
          await sendResult(event, easterEggCommands(firstToken));
          return finish;
        }
        else if (firstToken === 'delete') {
          await await delCF(event.user)
          return finish;
        }
        else if (firstToken === 'help') {
          await sendResult(event, { text: help() })
          return finish;
        }
        else if (firstToken === 'stable' || firstToken === 'stablecoin') {
          const assets = ['usdt','tusd','gusd','dai','usdc','pax']
          const message = await getMarketData(assets);

          await sendResult(event, {text: message});
          return finish;
        }
        else if (firstToken === 'privacy') {
          const assets = ['xmr','zec','grin','beam', 'dash', 'btcp', 'kmd', 'xvg']
          const message = await getMarketData(assets);

          await sendResult(event, {text: message});
          return finish;
        }
        else if (firstToken === 'food') {
          const assets = ['food','sub','wings','chips','brd','salt','grlc']
          const message = await getMarketData(assets);

          await sendResult(event, {text: message});
          return finish;
        }
        else if (firstToken === 'animal' || firstToken === 'animals') {
          const assets = ['doge','kmd','rvn','drgn','prl']
          const message = await getMarketData(assets);

          await sendResult(event, {text: message});
          return finish;
        }
        else if (firstToken === 'cf') {
          const user = event.user;
          let assets;

          if (commandTokens.length == 2) {
            assets = commandTokens[1];

            await saveCF(user, assets);
          } else {
            assets = await getCF(user);
          }

          assets = assets.split(",");
          let message;

          if (commandTokens.length == 3 && commandTokens[1] == 'in') {
            message = await getMarketData(assets, commandTokens[2]);
          } else {
            message = await getMarketData(assets);
          }

          await sendResult(event, {text: message});
          return finish;
        }
        else if (firstToken === 'chart') {
          const message = await chart1d(commandTokens[1]);
          await sendResult(event, {text: message});
          return finish;
        } else if (commandTokens.length == 3 && commandTokens[1] == 'in') {
          const assets = firstToken.split(",");
          const message = await getMarketData(assets, commandTokens[2]);

          await sendResult(event, {text: message});
          return;
        }

        const assets = commandTokens[0].split(",");
        const message = await getMarketData(assets);

        await sendResult(event, {text: message});
      }
    } else if (eventType == 'member_left_channel') {
      // Gaming
      if (event.channel === 'C5XFMT5HN' && event.user === 'U60ECRP1V') {
        console.log('Leon left gaming');
        await invite(event.user, event.channel);
        console.log(`Invited ${event.user} to ${event.channel}`);
      }
    }
  } catch (err) {
    console.log('Error', err);
  }
}
