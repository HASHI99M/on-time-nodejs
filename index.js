const moment = require("moment");
var fs = require('fs');
var express = require('express');
var app = express();
const path = require('path');
const listeners = require('./listeners/listeners')

let ctx = {};

const configFile = require("./config.json")
const { Sequelize, Op, DataTypes } = require("sequelize");




let serverPort
let server
let io

async function loadConfig(ctx) {
    let config = await ctx.configs.findAll({ raw: true })
    for (let c of config) {
        ctx.globalconfig[c.name] = c.value
    }

    if (ctx.globalconfig["nodejs_ssl"] == 1) {
        var https = require('https');
        var options = {
            key: fs.readFileSync(path.resolve(__dirname, ctx.globalconfig["nodejs_key_path"])),
            cert: fs.readFileSync(path.resolve(__dirname, ctx.globalconfig["nodejs_cert_path"]))
        };
        serverPort = ctx.globalconfig["nodejs_ssl_port"];
        server = https.createServer(options, app);
    } else {
        serverPort = ctx.globalconfig["nodejs_port"];
        server = require('http').createServer(app);
    }

}





async function init() {
    var sequelize = new Sequelize(configFile.sql_db_name, configFile.sql_db_user, configFile.sql_db_pass, {
        host: configFile.sql_db_host,
        dialect: "mysql",
        logging: function () { },
        pool: {
            max: 20,
            min: 0,
            idle: 10000
        }
    });

    ctx.configs = require("./models/configs")(sequelize, DataTypes)
    ctx.messages = require("./models/messages")(sequelize, DataTypes)
    ctx.conversations = require("./models/conversations")(sequelize, DataTypes)


    ctx.globalconfig = {}
    ctx.socketIdUserHash = {}
    ctx.userHashUserId = {}
    ctx.userIdCount = {}
    ctx.userIdChatOpen = {}
    ctx.userIdSocket = []
    ctx.userIdExtra = {}
    ctx.userIdGroupChatOpen = {}

    await loadConfig(ctx)

}


async function main() {
    await init()

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });
    io = require('socket.io')(server, {
        allowEIO3: true,
        cors: {
            origin: true,
            credentials: true
        },
    });
    if (ctx.globalconfig["redis"] === "Y") {
        const redisAdapter = require('socket.io-redis');
        io.adapter(redisAdapter({ host: 'localhost', port: ctx.globalconfig["redis_port"] }));
    }
    io.on('connection', async (socket, query) => {
        await listeners.registerListeners(socket, io, ctx)
    })

    server.listen(serverPort, function () {
        console.log('server up and running at %s port', serverPort);
    });
}

main()
