var express = require("express");
const dotenv = require('dotenv');
dotenv.config();
//use the application off of express.
var app = express();
const { exec } = require('child_process');

let executionDate = new Date();
const milisecondsInFiveDays = 4.32*Math.pow(10,8)
console.log("currentDate", executionDate)
let newDate = new Date(executionDate.getTime()+milisecondsInFiveDays)
console.log("newDate", newDate)

console.log(`Your pool name is ${process.env.POOL_NAME}`);

const initializeScript = ()=>{
    exec(`sh ${__dirname}/getLeaderlogs.sh`,
    (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
    });
}

initializeScript()

//define the route for "/"
app.get("/", function (request, response){
    //show this file when the "/" is requested
    response.sendFile(__dirname+"/index.html");
});

app.get("/trigger", function (request, response){
    //show this file when the "/" is requested
   console.log(request.query.pool);


   response.end("wassup")
});

//start the server
app.listen(8080);

console.log("Something awesome to happen at http://localhost:8080");