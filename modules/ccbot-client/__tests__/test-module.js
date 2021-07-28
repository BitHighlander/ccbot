
/*
 Test Module
 */

require("dotenv").config({path:'./../../.env'})
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'./../../../.env'})
require("dotenv").config({path:'../../../../.env'})

let ccbotApi = require("../lib")

//process.env['URL_PIONEER_SPEC'] = "https://ccbot.pro/spec/swagger.json"
// process.env['URL_PIONEER_SPEC'] = "http://127.0.0.1:9001/spec/swagger.json"
let spec = process.env['URL_PIONEER_SPEC']

let queryKey = 'key:1234'


let run_test = async function(){
    try{
        //get config
        let config = {
            queryKey,
            username:'test-user-2',
            spec
        }
        console.log("config: ",config)

        //get config
        let ccbot = new ccbotApi(spec,config)
        ccbot = await ccbot.init()

        //create

        //update

    }catch(e){
        console.error(e)
    }
}

run_test()
