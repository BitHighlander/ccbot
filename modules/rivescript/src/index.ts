/*
   Redis queue toolkit

   index queues

   document setting configurations and best practices

 */

const log = require("@pioneer-platform/loggerdog")()
const { subscriber, publisher, redis } = require('@pioneer-platform/default-redis')


module.exports = {
    init: function (name:string) {
        return true
    },
 }


 //ontick
const onTick = function(){
    //clear buckets

    //calculate work per second

}
setInterval(onTick,1000)
