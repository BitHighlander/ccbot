
/*


      CLI tools



 */

const TAG = " | CLI | "
require('dotenv').config();
require('dotenv').config({path:"../../../.env"});

let rive = require('../nlp/rive.js')
rive.init()


let describe = require('describe-export')
//const RpcServer = require('./support/index.js').Server;

const vorpal = require('vorpal')();
const {redis} = require('@pioneer-platform/default-redis')
const log = require('@pioneer-platform/loggerdog')()

//globals
let prompt = "client: "
var locked = true
var USER = null

//map module
const map = describe.map(wallet)
console.log("methods known: ",map)

let help = {
    getCoinbase:""
}


Object.keys(map).forEach(function(key) {
    let tag = TAG + " | "+key+" | "
    let debug = false
    log.debug(tag,"key: ",key)
    let expectedParams = map[key]

    log.debug(tag,"expectedParams: ",expectedParams)

    let helpString
    if(help[key]) helpString = help[key]
    if(!helpString) helpString = key+": expected params: "+expectedParams

    vorpal.command(key, helpString)
        .action(function (args, cb) {
            let self = this;
            let params = []

            if(expectedParams.length > 0){
                for(let i = 0; i < expectedParams.length; i++){
                    let param = {
                        type: 'input',
                        name: expectedParams[i],
                        message: "input "+expectedParams[i]+": "
                    }
                    params.push(param)
                }
            }



            let promise = this.prompt(params, function (answers) {
                // You can use callbacks...

            });

            promise.then(async function(answers) {
                log.debug(tag,"answers: ",answers)

                let parameters = []
                Object.keys(answers).forEach(function(answer) {
                    parameters.push(answers[answer])
                })
                console.log(tag,"parameters: ",parameters)
                try{
                    const result = await wallet[key].apply(this, parameters)
                    console.log("result: ",result)
                }catch(e){
                    console.error(tag,"e: ",e)
                }
                cb();
            });
        });
})

console.log("ccv3 cli: ")
//console.log(prompt)


vorpal
    .delimiter(prompt)
    //.action(app.tick())
    .show();
