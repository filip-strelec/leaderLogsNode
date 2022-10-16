var express = require("express");
const dotenv = require('dotenv');
dotenv.config();
//use the application off of express.
var app = express();
//const { exec } = require('child_process');
const schedule = require('node-schedule');
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const client = require('https');
app.use(express.static('./pngOutput'));
let nodeStartedDate = new Date();
const millisecondsInFiveDays = 4.32 * Math.pow(10, 8)

let executionDate = new Date(nodeStartedDate.getTime() + millisecondsInFiveDays)


let testSchedule = (executionDate) => {
    console.log("scheduling the script to be run in 5 days");
    const job = schedule.scheduleJob(executionDate, function () {
        console.log('Scheduled leaderlogs script triggered');
        const currentExecutionDate = executionDate;
        executionDate = new Date(currentExecutionDate.getTime() + millisecondsInFiveDays)
        testSchedule(executionDate);
        initializeScript();
    });
}

function callEveryHour() {
    setInterval(() => {
        getEpoch();

    }, 1000 * 60 * 60);
}

//callEveryHour();





const getEpoch = () => {
    var spawn = require('child_process').spawn;
    var child = spawn(`${__dirname}/getEpoch.sh`);
    var scriptOutput = "";

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function (data) {
        console.log(data);
        data = data.toString();
        scriptOutput += data;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function (data) {
        console.log(data);
        data = data.toString();
        scriptOutput += data;
    });


    child.on("close", (code) => {
        console.log("closed bash epoch script");

    });



}


async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

            }
        });
    });
}




const getJsonNotPool = (path) => {
    let jsonified;

    try {
        const rawData = fs.readFileSync(path);
        jsonified = JSON.parse(rawData);
    }
    catch (e) {
        console.log("invalid json", e);
        jsonified = JSON.stringify({ failed: "failed" });
    }
    return jsonified;
}

const getJsonFromFile = (poolTicker, old = false) => {
    let jsonified;
    try {
        let rawData
        old ? rawdata = fs.readFileSync(`./results/OLDleaderlogs${poolTicker}.json`) : rawdata = fs.readFileSync(`./results/leaderlogs${poolTicker}.json`);

        jsonified = JSON.parse(rawdata);
    }

    catch (e) {
        console.log("invalid json", e);
        jsonified = JSON.parse({})

    }
    return jsonified;
}

const canvasDrawAndExport = async (poolTicker) => {
    let poolID = process.env.pool_id;
    let logoURL = `https://cdn.adapools.org/pool_logo/${poolID}.png`;



    const stakeSnapshotJson = getJsonFromFile(poolTicker);
    const epoch = stakeSnapshotJson.epoch;
    const epochSlots = stakeSnapshotJson.epochSlots;
    const assignedSlots = stakeSnapshotJson.assignedSlots;
    console.log("Pool Ticker:" + poolTicker);
    console.log("EPOCH:" + epoch);
    console.log("Nr. of slots assigned:" + epochSlots);
    let height = 550;
    const width = 1600;
    assignedSlots?.length > 0 && (height = 550 + Math.ceil(assignedSlots.length / 3) * 50);

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    context.fillStyle = "#419A96";

    switch (poolTicker) {
        case 'MINES':
            logoURL = `https://cdn.adapools.org/pool_logo/3e5fcbaf750c0291cecb72384091724a1c2d35da10a71473e16c926f.png`;
            context.fillStyle = "#1FD1D1";

            break;
        case 'CPU':
            logoURL = `https://cdn.adapools.org/pool_logo/b45c1860e038baa0642b352ccf447ed5e14430342a11dd75bae52f39.png`;
            context.fillStyle = "#2991B8"
            break;
        case 'ERA':
            logoURL = `https://cdn.adapools.org/pool_logo/13375a4a5470b564246a3251ea0ccfef046ee5bcaf3ed6de6315abc7.png`;
            context.fillStyle = "#8CC164"
            break;
        default:
            console.log(`defaultCanvasDraw (VENUS)`);

    }

    await downloadImage(logoURL, `./pngOutput/${poolTicker}Ticker.png`);


    context.fillRect(0, 0, width, height);

    context.font = "bold 52pt 'PT Sans'";
    context.textAlign = "center";
    context.fillStyle = "#fff";
    context.fillText(`Epoch:${epoch}`, width / 2, 100);
    context.font = "bold 54pt 'PT Sans'";
    context.fillText(`Pool:${poolTicker}`, width / 2, 170);
    context.font = "bold 22pt 'PT Sans'";
    context.textAlign = "start";
    context.fillText(`Nr. of slots:${epochSlots}`, 1200, 119);
    context.textAlign = "center";
    context.fillText(`Slots in Epoch`, width / 2, 230);


    // assignedSlots.forEach((element)=>{
    //     console.log(element,"BOK")
    // })

    loadImage(`./resources/block.png`).then((image) => {
        context.textAlign = "start";

        let rowCounter = 1;
        let columnCounter = 0;
        assignedSlots.forEach((element) => {
            (parseInt(element.no - 1) % 3 === 0) && rowCounter++;
            (parseInt(element.no - 1) % 3 === 0) && (columnCounter = 0);
            context.fillText(`${element.no}: Slot in Epoch:${element.slotInEpoch}`, 130 + (parseInt(columnCounter) * 460), 270 + parseInt(rowCounter) * 50);
            columnCounter++;
        })


    });


    const PoolimagePosition = {
        w: 88,
        h: 88,
        x: 75,
        y: 75,
    };
    loadImage(`./pngOutput/${poolTicker}Ticker.png`).then((image) => {
        const { w, h, x, y } = PoolimagePosition;
        context.drawImage(image, x, y, w, h);
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(`./pngOutput/image${poolTicker}.png`, buffer);
    });



}





const initializeScript = () => {
    var spawn = require('child_process').spawn;
    var child = spawn(`${__dirname}/getLeaderlogs.sh`);
    var scriptOutput = "";

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function (data) {
        console.log(data);
        data = data.toString();
        scriptOutput += data;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function (data) {
        console.log(data);
        data = data.toString();
        scriptOutput += data;
    });

}

//INIT!!!
testSchedule(executionDate);
initializeScript();



app.get("/", function (request, response) {
    response.sendFile(__dirname + "/index.html");
});

app.get("/trigger", function (request, response) {
    const poolTicker = request.query.pool;
    canvasDrawAndExport(poolTicker.toUpperCase());
    response.end("Triggered Creating images for: " + poolTicker);
});


app.get("/api", async function (request, res) {
    // res.writeHead(200, { "Content-Type": "application/json" })
    // res.writeHead(200, { "Access-Control-Allow-Origin": "*" })


    const promiseEpoch = new Promise((res, rej) => {

        var spawn = require('child_process').spawn;
        var child = spawn(`${__dirname}/getEpoch.sh`);
        var scriptOutput = "";

        child.stdout.setEncoding('utf8');
        child.stdout.on('data', function (data) {
            console.log(data);
            data = data.toString();
            scriptOutput += data;
        });

        child.stderr.setEncoding('utf8');
        child.stderr.on('data', function (data) {
            console.log(data);
            data = data.toString();
            scriptOutput += data;
        });


        child.on("close", (code) => {
            console.log("closed bash epoch");
            res(code);

        });


    });


    let result = {};
    const VenusOld = getJsonFromFile("VENUS", true);
    const Venus = getJsonFromFile("VENUS");
    const CpuOld = getJsonFromFile("CPU", true);
    const Cpu = getJsonFromFile("CPU");
    const MinesOld = getJsonFromFile("MINES", true);
    const Mines = getJsonFromFile("MINES");
    const EraOld = getJsonFromFile("ERA", true);
    const Era = getJsonFromFile("ERA");
    await Promise.resolve(promiseEpoch);
    const epochInfo = getJsonNotPool('./results/epochInfo.json');
    let activeStake = JSON.stringify({ activeStakeMark: "failed" });
    try {
        if (fs.existsSync("./results/stakeSnapshotVENUS.json")) {
            activeStake = getJsonNotPool('./results/stakeSnapshotVENUS.json');
        }
    } catch (err) {
        console.error(err, "____trying to get from CPU!!!___");
        try {
            activeStake = getJsonNotPool('./results/stakeSnapshotCPU.json');
        }
        catch {
            console.error(err, "____ERROR trying to get from CPU!!!___");

        }
    }
    result.epochInfo = epochInfo;
    result.epochInfo.activeStake = activeStake?.activeStakeMark;
    result.venus = [VenusOld, Venus];
    result.era = [EraOld, Era];
    result.mines = [MinesOld, Mines];
    result.cpu = [CpuOld, Cpu];
    res.end(JSON.stringify(result));
});

console.log("starting the web server at localhost:8080");
app.listen(Number(process.env.port));

