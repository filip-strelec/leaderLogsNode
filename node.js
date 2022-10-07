var express = require("express");
const dotenv = require('dotenv');
dotenv.config();
//use the application off of express.
var app = express();
//const { exec } = require('child_process');



let executionDate = new Date();
const milisecondsInFiveDays = 4.32*Math.pow(10,8)

let newDate = new Date(executionDate.getTime()+milisecondsInFiveDays)

let testSchedule;


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

initializeScript();

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

