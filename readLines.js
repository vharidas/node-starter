const readline = require('readline');
const {stdin, stdout} = process;
const recordLine = function(content){
    stdout.write(`${++this.count}:${content}\n`);
};
const summarize = function(){
    stdout.write(`----Total ${this.count} lines---\n`);
};
const main = ()=>{
    const rl = readline.createInterface(stdin);
    const context = {count:0};    
    rl.on('line', recordLine.bind(context));
    rl.on('close', summarize.bind(context));;
}
main();
