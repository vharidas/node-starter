const { fork } = require('child_process');

class JobMaster {
    constructor() {        
        this.workers = [];        
    }    
    initialze(names) {
        if(this.workers.length>0) return;

        const forkWorker = (name) => {
            const worker = fork('jobWorker.js', [name]);
            worker.workerName = name;
            worker.on('message', msg => this.onWorkerResponse(worker, msg));
            worker.on('close', (code) => this.onWorkerClose(worker, code));
            return worker;
        };

        this.workers =  names.map(forkWorker);
    }

    runTask(text) {
        const worker = this.getNextFreeWorker();
        if (!worker) {
            console.log('Everyone is busy, please try later');
            return;
        }
        worker.send({ name: 'run', text });
        worker.isBusy = true;
    }

    onWorkerResponse(worker, msg) {
        worker.isBusy = false;
        console.log(`worker ${worker.workerName} responded with`, msg);
    }

    onWorkerClose(worker, code) {
        console.log(`worker ${worker.workerName} closed with`, code);
    }

    getNextFreeWorker() {
        const freeWorkers = this.workers.filter(w => !w.isBusy);
        return freeWorkers[0];
    }

    stop() {
        console.log('Command stream has ended');
        this.workers.forEach(w => w.send({ name: 'stop' }));
    }
}
const showUsage = () => {
    const info = ['',
        'node jobMaster [workerName1 workerName2 ...]',
        '\tand then send commands on stdin',
        'like:',
        '\tremind 10 \t/*to remind after 10 seconds*/',
        'end stdin (^d) to stop the master and the workers'].join('\n');
    console.log(info);
}
const main = () => {
    const workerNames = process.argv.slice(2);
    if (workerNames.length == 0) return showUsage();

    console.log(workerNames);
    const master = new JobMaster();
    master.initialze(workerNames);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', text => master.runTask(text));
    process.stdin.on('end', () => master.stop());
}

main();
