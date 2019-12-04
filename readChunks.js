const {stdin, stdout} = process;
const recordLine = function(content){
    stdout.write(`${++this.count}:${content}\n`);
};
const summarize = function(){
    stdout.write(`----Total ${this.count} chunks---\n`);
};
const main = ()=>{
    stdin.setEncoding('utf8');
    const context = {count:0};   
    stdin.on('data', recordLine.bind(context));
    stdin.on('end', summarize.bind(context));
}
main();
