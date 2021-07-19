
require('dotenv').config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require('dotenv').config({path:"../../../.env"});
require('dotenv').config({path:"../../../../.env"});


const {redis,subscriber,publisher} = require("@pioneer-platform/default-redis")



let message = {
    channel:"487851462",
    msg:"/giphy do it",
    view:{
        icon_emoji: ':coincap_v2:',
    }
}


redis.publish("publish-telegram",JSON.stringify(message))
