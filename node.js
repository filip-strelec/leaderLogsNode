// Polyfill fetch for Node 16 (required by cexplorer-api)
const fetch = require('node-fetch');
if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

var express = require("express");
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();
//use the application off of express.
var app = express();
//const { exec } = require('child_process');
const schedule = require('node-schedule');
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const client = require('https');

// Cexplorer API - loaded dynamically since it's an ES Module
let cexplorerApi = null;

// Initialize Cexplorer API (called once on first use)
const initCexplorerApi = async () => {
    if (cexplorerApi) return cexplorerApi;

    const api = await import('@vellumlabs/cexplorer-api');
    api.initApi({
        network: "mainnet-stage",
        apiKey: process.env.CEXPLORER_API_KEY,
    });
    cexplorerApi = api;
    console.log('Cexplorer API initialized');
    return api;
};

// Pool IDs to fetch (ticker -> pool_id mapping)
const POOLS = {
    'VENUS': 'pool1r8938r4ts8f4t8nsp9xl9dktzapt7f67jgpsp4wrju39xrdnaye',
    'CAHLI': 'pool18mnua97ndq302yw2c6aaw6msx5rgf79mfnk4xe5y92tvjl45etl',
    'MINES': 'pool18e0uhtm4pspfrnktwguypytjfgwz6dw6zzn3gulpdjfx7qd0439',
    'CPU': 'pool1k3wpsc8q8za2qeptx5kv73r76hs5gvp59gga6ad6u5hnj3scy3q',
    'ERA': 'pool1zvm45jj5wz6kgfr2xfg75rx0auzxaedu4ulddhnrzk4uwuyuvpn'
};

// Cache for pool data (1 hour TTL)
let poolsCache = {
    data: null,
    lastFetched: null,
    TTL: 60 * 60 * 1000 // 1 hour in milliseconds
};

// Cache for global data (1 hour TTL)
let globalCache = {
    data: null,
    lastFetched: null,
    TTL: 60 * 60 * 1000 // 1 hour in milliseconds
};

// Function to fetch pool data from cexplorer API
const fetchPoolsData = async () => {
    console.log('Fetching pools data from Cexplorer API...');
    const api = await initCexplorerApi();
    const poolsData = {};

    for (const [ticker, poolId] of Object.entries(POOLS)) {
        try {
            const result = await api.getPoolDetail({ pool_id: poolId });
            let poolData = result.data || result;

            // Limit epochs array to 10 entries
            if (poolData && poolData.epochs && Array.isArray(poolData.epochs)) {
                poolData.epochs = poolData.epochs.slice(0, 10);
            }

            poolsData[ticker] = poolData;
            console.log(`Fetched data for pool: ${ticker}`);
        } catch (error) {
            console.error(`Error fetching pool ${ticker}:`, error.message);
            poolsData[ticker] = { error: error.message };
        }
    }

    return poolsData;
};

// Function to get pools data (from cache or fresh)
const getPoolsData = async () => {
    const now = Date.now();

    // Check if cache is valid
    if (poolsCache.data && poolsCache.lastFetched && (now - poolsCache.lastFetched < poolsCache.TTL)) {
        console.log('Returning cached pools data');
        return {
            poolData: poolsCache.data,
            cached: true,
            cachedAt: new Date(poolsCache.lastFetched).toISOString(),
            nextRefresh: new Date(poolsCache.lastFetched + poolsCache.TTL).toISOString()
        };
    }

    // Fetch fresh data
    const freshData = await fetchPoolsData();

    // Update cache
    poolsCache.data = freshData;
    poolsCache.lastFetched = now;

    return {
        poolData: freshData,
        cached: false,
        cachedAt: new Date(now).toISOString(),
        nextRefresh: new Date(now + poolsCache.TTL).toISOString()
    };
};

// Function to fetch global blockchain data from cexplorer API
const fetchGlobalData = async () => {
    console.log('Fetching global data from Cexplorer API...');
    const api = await initCexplorerApi();

    try {
        // Get current epoch list (first entry is current epoch)
        const epochListResult = await api.getEpochList();
        const basicResult = await api.getMiscBasic();
        const constResult = await api.getMiscConst();

        const currentEpoch = epochListResult.data?.data?.[0] || {};
        const basicData = basicResult.data || {};
        const constData = constResult.data || {};

        // Try params_active first, fallback to params
        const params = currentEpoch.params_active || currentEpoch.params || {};

        // Get current epoch number for fetching detailed parameters
        const currentEpochNo = currentEpoch.no || basicData.block?.epoch_no;

        // Fetch detailed epoch parameters
        let detailedParams = {};
        if (currentEpochNo) {
            try {
                const epochParamResult = await api.getEpochDetailParam(currentEpochNo);
                detailedParams = epochParamResult.data || {};
            } catch (paramError) {
                console.warn('Could not fetch detailed epoch params:', paramError.message);
            }
        }

        // Merge params, preferring detailed params
        const finalParams = { ...params, ...detailedParams };

        return {
            epoch: {
                no: currentEpoch.no,
                start_time: currentEpoch.start_time,
                end_time: currentEpoch.end_time,
                blk_count: currentEpoch.blk_count,
                tx_count: currentEpoch.tx_count,
                fees: currentEpoch.fees,
                out_sum: currentEpoch.out_sum
            },
            block: basicData.block,
            supply: {
                circulating: constData.circulating_supply,
                live_stake: constData.live_stake
            },
            epoch_param: {
                optimal_pool_count: finalParams.optimal_pool_count,
                influence: finalParams.influence,
                monetary_expand_rate: finalParams.monetary_expand_rate,
                treasury_growth_rate: finalParams.treasury_growth_rate,
                decentralisation: finalParams.decentralisation,
                min_fee_a: finalParams.min_fee_a,
                min_fee_b: finalParams.min_fee_b,
                min_pool_cost: finalParams.min_pool_cost,
                key_deposit: finalParams.key_deposit,
                pool_deposit: finalParams.pool_deposit,
                max_tx_size: finalParams.max_tx_size,
                max_block_size: finalParams.max_block_size,
                price_mem: finalParams.price_mem,
                price_step: finalParams.price_step
            }
        };
    } catch (error) {
        console.error('Error fetching global data:', error.message);
        throw error;
    }
};

// Function to get global data (from cache or fresh)
const getGlobalData = async () => {
    const now = Date.now();

    // Check if cache is valid
    if (globalCache.data && globalCache.lastFetched && (now - globalCache.lastFetched < globalCache.TTL)) {
        console.log('Returning cached global data');
        return {
            data: globalCache.data,
            cached: true,
            cachedAt: new Date(globalCache.lastFetched).toISOString(),
            nextRefresh: new Date(globalCache.lastFetched + globalCache.TTL).toISOString()
        };
    }

    // Fetch fresh data
    const freshData = await fetchGlobalData();

    // Update cache
    globalCache.data = freshData;
    globalCache.lastFetched = now;

    return {
        data: freshData,
        cached: false,
        cachedAt: new Date(now).toISOString(),
        nextRefresh: new Date(now + globalCache.TTL).toISOString()
    };
};

app.use(express.static('./pngOutput'));

app.use(cors({
    origin: '*'
}));

let nodeStartedDate = new Date();
const millisecondsInFiveDays = 4.32 * Math.pow(10, 8)
let firstTimeExecutionTimestamp = 1665916492122;
let executionDate;


let testSchedule = (executionDate) => {
    console.log("scheduling the script to be run in 5 days:" +  new Date(executionDate));
    const job = schedule.scheduleJob(executionDate, function () {
        console.log('Scheduled leaderlogs script triggered');
        const currentExecutionDate = executionDate;
        executionDate = new Date(currentExecutionDate + millisecondsInFiveDays)
        testSchedule(executionDate);
        initializeScript();
    });
}


while (firstTimeExecutionTimestamp < nodeStartedDate.getTime()) {
    // code block to be executed
    firstTimeExecutionTimestamp = firstTimeExecutionTimestamp + millisecondsInFiveDays
  }
  executionDate = firstTimeExecutionTimestamp;
console.log("1st schedule to run:" + new Date(executionDate));
testSchedule(executionDate);


// function callEveryHour() {
//     setInterval(() => {
//         getEpoch();

//     }, 1000 * 60 * 60);
// }

//callEveryHour();





// const getEpoch = () => {
//     var spawn = require('child_process').spawn;
//     var child = spawn(`${__dirname}/getEpoch.sh`);
//     var scriptOutput = "";

//     child.stdout.setEncoding('utf8');
//     child.stdout.on('data', function (data) {
//         console.log(data);
//         data = data.toString();
//         scriptOutput += data;
//     });

//     child.stderr.setEncoding('utf8');
//     child.stderr.on('data', function (data) {
//         console.log(data);
//         data = data.toString();
//         scriptOutput += data;
//     });


//     child.on("close", (code) => {
//         console.log("closed bash epoch script");

//     });



// }


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
        console.log("invalid json",poolTicker, e);
        jsonified = JSON.stringify({ failed: "failed" });
        console.log(rawdata);

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
if (assignedSlots){
    assignedSlots.length > 0 && (height = 550 + Math.ceil(assignedSlots.length / 3) * 50);
}

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    context.fillStyle = "#419A96";

    switch (poolTicker) {
        case 'MINES':
            logoURL = `https://cdn.adapools.org/pool_logo/3e5fcbaf750c0291cecb72384091724a1c2d35da10a71473e16c926f.png`;
            context.fillStyle = "#1FD1D1";
            break;
        case 'CAHLI':
            logoURL = `https://img.cexplorer.io/c/c/4/1/d/pool18mnua97ndq302yw2c6aaw6msx5rgf79mfnk4xe5y92tvjl45etl.png`;
            context.fillStyle = "black";
    
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

    //await downloadImage(logoURL, `./pngOutput/${poolTicker}Ticker.png`); // FOR DOWNLOADING IMAGE TICKERS TODO: FIX IT (wrong url currently)


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
//testSchedule(executionDate);
//initializeScript(); //TODO:: REMOVE THIS COMMENT IF YOU WANT TO SCAPE INSTANTLY





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
    res.type('json');

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
    const CahliOld = getJsonFromFile("CAHLI", true);
    const Cahli = getJsonFromFile("CAHLI");
    const EraOld = getJsonFromFile("ERA", true);
    const Era = getJsonFromFile("ERA");
    await Promise.resolve(promiseEpoch);
    const epochInfo = getJsonNotPool('./results/epochInfo.json');
     let activeStake = 22674711468934312; //if  get active stake fails, this is a approximation
    //= JSON.stringify({ activeStakeMark: "failed" });


    // const stat = fs.statSync('./results/stakeSnapshotVENUS.json');
    // console.log(stat.size);

    // if (stat.size === 0) {
    //     const stat = fs.statSync('./results/stakeSnapshotMINES.json');
    //     if (stat.size === 0) {

    //         activeStake = getJsonNotPool('./results/stakeSnapshotCPU.json');

    //     }
    //     else {
    //         const stat = fs.statSync('./results/stakeSnapshotMINES.json');

    //     }

    // }
    // else {
    //     activeStake = getJsonNotPool('./results/stakeSnapshotVENUS.json');

    // }

    // if (fs.existsSync('./results/stakeSnapshotVENUS.json')) {
    //     if (fs.read('./results/stakeSnapshotVENUS.json').length === 0) {
    //         activeStake = getJsonNotPool('./results/stakeSnapshotCPU.json');
    //     } else {
    //         activeStake = getJsonNotPool('./results/stakeSnapshotVENUS.json');
    //     }
    // }
    // else{
    //     activeStake = getJsonNotPool('./results/stakeSnapshotCPU.json');

    // }


    const promiseActiveStake = new Promise((res, rej) => {

        fs.readFile('./results/activeStake.txt', 'utf8', (err, data) => {
            if (err) {
              console.error(err);
              rej(err);
            }
            activeStake = parseInt(data.slice(0,17))
            ;
            res(data);
          });

    })

    await Promise.resolve(promiseActiveStake);

    

    result.epochInfo = epochInfo;
    result.epochInfo.activeStake = activeStake;
    result.venus = [VenusOld, Venus];
    result.era = [EraOld, Era];
    result.mines = [MinesOld, Mines];
    result.cpu = [CpuOld, Cpu];
    result.cahli = [CahliOld, Cahli]
    result.next_run = new Date(executionDate);

    console.log(result.next_run);
    console.log(executionDate);
    res.end(JSON.stringify(result));
});

// Pools endpoint - returns pool information from Cexplorer API with 1-hour cache
app.get("/pools", async function (request, res) {
    res.type('json');

    try {
        const poolsResult = await getPoolsData();
        res.json(poolsResult);
    } catch (error) {
        console.error('Error in /pools endpoint:', error.message);
        res.status(500).json({
            error: 'Failed to fetch pools data',
            message: error.message
        });
    }
});

// Global endpoint - returns global blockchain data from Cexplorer API with 1-hour cache
app.get("/global", async function (request, res) {
    res.type('json');

    try {
        const globalResult = await getGlobalData();
        res.json(globalResult);
    } catch (error) {
        console.error('Error in /global endpoint:', error.message);
        res.status(500).json({
            error: 'Failed to fetch global data',
            message: error.message
        });
    }
});

console.log("starting the web server at localhost:"+process.env.port);
app.listen(Number(process.env.port));

