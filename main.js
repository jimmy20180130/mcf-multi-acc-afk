const mineflayer = require("mineflayer");
const readline = require("readline");
const autoeat = require('mineflayer-auto-eat').plugin
const fs = require("fs");

var args = process.argv.slice(2)

let config = JSON.parse(fs.readFileSync("config.json"), 'utf8');

let bot;

let intervals = [];

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const botArgs = {
    username: args[0],
    host: 'sg.mcfallout.net',
    port: '25565',
    version: '1.20.1',
    auth: 'microsoft',
    physicsEnabled: true
}

const initBot = () => {
    bot = mineflayer.createBot(botArgs);
    bot.loadPlugin(autoeat)

    const ad = () => {
        let config = JSON.parse(fs.readFileSync(`${process.cwd()}/config.json`, 'utf8'))

        for (let item of config.advertisement) {
            intervals.push(setInterval(async () => {
                try {
                    bot.chat(item.text)
                    console.log(`[INFO] 發送廣告: ${item.text}`)
                } catch (e) {
                    console.log(`[ERROR] 發送廣告時發生錯誤: ${e}`)
                }
            }, item.interval))
        }
    }

    bot.once("login", () => {
        let botSocket = bot._client.socket;
        if (botArgs.username == config.accounts[0].username) {
            console.log(
                `已成功登入 ${botSocket.server ? botSocket.server : botSocket._host}`
            );
        }

        console.log(`正在登入 ${botArgs.username}`);
    })


    bot.once("spawn", () => {
        bot.chat('bot is online')
        if (botArgs.username == config.accounts[0].username) {
            console.log(`地圖已載入`);
        }

        bot.chat(`/ts ${config.accounts[config.accounts.findIndex((account) => account.username === botArgs.username)].server}`)
        bot.chat(config.accounts[config.accounts.findIndex((account) => account.username === botArgs.username)].warp)

        try {
            for (let item of config.advertisement) {
                if (item.text && item.interval) bot.chat(item.text);
            }
        } catch (e) {
            console.log(`[ERROR] 發送廣告時發生錯誤: ${e}`)
        }

        setTimeout(() => {
            if (botArgs.username == config.accounts[0].username) {
                ad()
            }
        }, 5000);

        rl.on("line", function (line) {
            if (botArgs.username == config.accounts[0].username) {
                bot.chat(line)
            }
        });
    });

    bot.on("message", (jsonMsg) => {
        var regex = /Summoned to server(\d+) by CONSOLE/;
        if (regex.exec(jsonMsg.toString())) {
            bot.chat(config.server)
            bot.chat(config.warp)
        }

        if (botArgs.username == config.accounts[0].username) {
            console.log(jsonMsg.toAnsi());
        }
    });

    bot.on("end", () => {
        console.log(`機器人已斷線，將於 5 秒後重啟`);
        for (listener of rl.listeners('line')) {
            rl.removeListener('line', listener)
        }

        for (let interval of intervals) {
            clearInterval(interval);
        }

        setTimeout(initBot, 5000);
    });

    bot.on("kicked", (reason) => {
        console.log(`機器人被伺服器踢出\n原因：${reason}`);
    });

    bot.on("error", (err) => {
        if (err.code === "ECONNREFUSED") {
            console.log(`連線到 ${err.address}:${err.port} 時失敗`);
        } else {
            console.log(`發生無法預期的錯誤: ${err}`);
        }

        process.exit(1);
    });

    bot.on('autoeat_started', (item, offhand) => {
        console.log(`正在吃 ${offhand ? '副手中' : '主手中'} 的 ${item.name}`)
    })

    bot.on('autoeat_finished', (item, offhand) => {
        console.log(`已吃完 ${offhand ? '副手中' : '主手中'} 的 ${item.name}`)
    })

    bot.on('autoeat_error', error => {
        if (error.message == 'No food found.') {
            console.log('找不到食物')
        } else {
            console.log(`吃東西時發生錯誤: ${error.message}`)
        }
    })

    bot.on('physicsTick', () => {
        for (const entity of Object.values(bot.entities)) {
            if (entity === bot.entity) { continue }
            applyEntityCollision(entity)
        }
    })

    function applyEntityCollision(other) {
        let dx = other.position.x - bot.entity.position.x;
        let dy = other.position.y - bot.entity.position.y;
        let dz = other.position.z - bot.entity.position.z;
        let largestDistance = Math.max(Math.abs(dx), Math.abs(dz));
        if (largestDistance >= 0.01) {
            let vx = dx / 20;
            let vz = dz / 20;

            if (largestDistance < 1) {
                vx /= Math.sqrt(largestDistance)
                vz /= Math.sqrt(largestDistance)
            } else {
                vx /= largestDistance
                vz /= largestDistance
            }
            bot.entity.xVelocity -= vx;
            bot.entity.xVelocity -= vz;

            other.xVelocity += vx;
            other.zVelocity += vz;
        }
    }
}

initBot();

process.on("unhandledRejection", async (error) => {
    console.log(error)
    process.exit(1)
});

process.on("uncaughtException", async (error) => {
    console.log(error)
    process.exit(1)
});

process.on("uncaughtExceptionMonitor", async (error) => {
    console.log(error)
    process.exit(1)
});