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
## readLines.js
### reading user input and counting lines
```bash
$ node readLines.js
Hello
1:Hello
One
2:One
Two
3:Two
Three
4:Three
^d
----Total 4 lines---
```
### reading redirected output and counting lines
```bash
$ cat readLines.js| node readLines.js 
1:const readline = require('readline');
2:const {stdin, stdout} = process;
3:const recordLine = function(content){
4:    stdout.write(`${++this.count}:${content}\n`);
5:};
6:const summarize = function(){
7:    stdout.write(`----Total ${this.count} lines---\n`);
8:};
9:const main = ()=>{
10:    const rl = readline.createInterface(stdin);
11:    const context = {count:0};    
12:    rl.on('line', recordLine.bind(context));
13:    rl.on('close', summarize.bind(context));;
14:}
15:main();
----Total 15 lines---
```
