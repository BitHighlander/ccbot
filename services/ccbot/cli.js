/*

    CCv3 CLI dev tool

    Goals emulate chat input

    TODO UNFINISHED
 */
require('dotenv').config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require('dotenv').config({path:"../../../.env"});
require('dotenv').config({path:"../../../../.env"});
var EventEmitter = require('events');
let log = require("@pioneer-platform/loggerdog")()
const {redis,subscriber,publisher} = require("@pioneer-platform/default-redis")

var prompt = new EventEmitter();
var current = null;
var result = {};
process.stdin.resume();

process.stdin.on('data', function(data){
    prompt.emit(current, data.toString().trim());
});

prompt.on(':new', function(name, question){
    current = name;
    console.log(question);
    process.stdout.write('respond: ');
});

prompt.on(':end', function(){
    console.log('\n', result);
    process.stdin.pause();
});

prompt.emit(':new', 'name', 'What is your name?');

prompt.on('name', function(data){
    result.name = data

    console.log(data)

    let output  = "hi"
    prompt.emit(':new', 'name', output);
});

// prompt.on('hobbies', function(data){
//     result.hobbies = data.split(/,\s?/);
//     prompt.emit(':new', 'username', 'What is your username?');
// });
//
// prompt.on('username', function(data){
//     result.username = data;
//     prompt.emit(':end');
// });
