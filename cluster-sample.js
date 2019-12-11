const { isMaster, fork } = require('cluster');
const os = require('os');
const { pid, exit } = process;
const { log } = console;

const random = (max)=> Math.floor(Math.random()*max);
const pickOne = (items)=> items[random(items.length)];
const time = () => new Date().toJSON().split('T')[1];
const greetings = `Hello.Hi.What's up.Yo.Good Day.Good Morning.Good Night.Howdy`.split('.');

const runMaster = () => {
    const numCPUs = os.cpus().length;
    const wPIDs = [];
    for (let i = 0; i < numCPUs; i++) {
        let worker = fork();
        let wPid = worker.process.pid;
        worker.on('exit', code => log(`${pid} master, the worker ${wPid} exited with code ${code}`));
        worker.on('message', message => log(`${pid} master, got message ${JSON.stringify(message)} from worker ${wPid}`));
        setTimeout(() => worker.send('quit'), 2000 * (i + 1));
        wPIDs.push(wPid);
    }
    log(`started workers: ${wPIDs}`);
};

const runWorker = () => {
    setInterval(() => process.send({at:time(),greeting:pickOne(greetings)}), 1000);
    process.on('message', (message) => {
        log(`${pid} worker got `, message);
        if (message == 'quit') exit(2);
    });

}
const main = isMaster ? runMaster : runWorker;

main();
