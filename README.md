# node-starter
Simple programs to experiment with built-in node modules

## readChunks.js
### reading user input and counting chunks
```bash
$ node readChunks.js
Hello
1:Hello

One
2:One

Two
3:Two

Three
4:Three

^d
----Total 4 chunks---
```
### reading redirected output and counting chunks
```bash
$ cat readChunks.js | node readChunks.js  
1:const {stdin, stdout} = process;
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
----Total 1 chunks---
```
