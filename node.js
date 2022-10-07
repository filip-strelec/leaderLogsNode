var express = require("express");
const dotenv = require('dotenv');
dotenv.config();
//use the application off of express.
var app = express();
//const { exec } = require('child_process');
const schedule = require('node-schedule');


let nodeStartedDate = new Date();
const millisecondsInFiveDays = 4.32*Math.pow(10,8)

let executionDate = new Date(nodeStartedDate.getTime()+millisecondsInFiveDays)


let testSchedule = (executionDate)=>{
console.log("schedule triggerd");
const job = schedule.scheduleJob(executionDate, function(){
    console.log('Scheduled leaderlogs script triggered');
    const currentExecutionDate = executionDate;
    executionDate = new Date(currentExecutionDate.getTime()+millisecondsInFiveDays)
    testSchedule(executionDate);
    initializeScript();
  });
}

testSchedule(executionDate);
initializeScript();

const initializeScript = ()=>{
    var spawn = require('child_process').spawn;
    var child = spawn(`sh ${__dirname}/getLeaderlogs.sh`);
    var scriptOutput = "";
    
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
        console.log( data);
        data=data.toString();
        scriptOutput+=data;
    });
    
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(data) {
        console.log(data);
        data=data.toString();
        scriptOutput+=data;
    });
    
}

//initializeScript();

//define the route for "/"
app.get("/", function (request, response){
    //show this file when the "/" is requested
    response.sendFile(__dirname+"/index.html");
});

app.get("/trigger", function (request, response){
    //show this file when the "/" is requested
   


   response.end("wassup")
});

console.log("starting the web server at localhost:8080");
app.listen(8080);

