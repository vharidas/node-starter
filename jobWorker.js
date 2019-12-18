class JobWorker {
    constructor(name, reply, disconnect) {
        this.name = name;
        this.reply = reply;
        this.disconnect = disconnect;
    }
    onMessage(msg) {
        console.log(`worker ${this.name} got message`, msg);
        if (msg.name == 'stop') this.disconnect();
        if (msg.name == 'run') this.runTask(msg.text);
    }
    runTask(text) {
        const [task, ...args] = text.trim().split(' ');
        if (task == 'remind') {
            const [seconds] = args;
            const remind = () => this.reply({ name: 'reminder', seconds });
            setTimeout(remind, seconds * 1000);
            return;
        }
        this.reply({name:'unhandled task',text});
    }
}

const main = () => {
    let worker;
    [, , name] = process.argv;
    console.log(`starting worker ${name} with pid ${process.pid}`);

    const receive = msg => worker.onMessage(msg);
    process.on('message', receive);
    const disconnect = () => process.off('message', receive);

    const reply = msg => process.send(msg);

    worker = new JobWorker(name, reply, disconnect);
}
main();
