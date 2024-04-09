const { fork } = require('child_process');
const readline = require('readline')
const fs = require('fs');
const config = JSON.parse(fs.readFileSync("config.json"), 'utf8');

console.log('[INFO] 正在開始執行由 Jimmy 開發的 [廢土多開掛機機器人]');

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout   
});

function spawnChild(username) {
    let client = fork("./main.js", [username], { silent: true });

    rl.on('line', async function (line) {
        if (client != undefined) client.stdin.write(line + '\n');
    });

    client.stdout.on('data', (data) => {
        console.log(`${String(data).replaceAll('\n', '')}`);
    });

    client.stderr.on('data', (data) => {
        console.error(`[ERROR] 發現以下錯誤 ${data} ，正在重新開啟中...`);
    });

    client.on('error', (err) => {
        console.log(`[ERROR] ${err}`)
    })

    client.on('close', (code) => {
        console.log(`[ERROR] 程式回傳錯誤碼 ${code} ，正在重新啟動中...`);
        client = undefined
        spawn_Child(config.accounts.findIndex((account) => account.username === username));
    });
}

function spawn_Child(index) {
    spawnChild(config.accounts[index].username);
}

for (let i = 0; i < config.accounts.length; i++) {
    spawnChild(config.accounts[i].username);
}