const { fork } = require('child_process');
const fs = require('fs');
const countsChars = (fileName, callback) => {
  const counts = {};
  const result = { fileName, counts };
  if (!fs.existsSync(fileName)) return callback(result);

  const reader = fs.createReadStream(fileName);
  reader.setEncoding('utf8');
  reader.on('data', text => {
    const chars = text.split('');
    const incrementCount = char => {
      counts[char] = 1 + (counts[char] || 0);
    }
    chars.forEach(incrementCount);
  });
  reader.on('end', () => callback(result));
}

const worker = () => {
  process.on('message', (fileName) => {
    countsChars(fileName, (result) => process.send(result));
  })
}
const showResult = msg => {
  console.log(JSON.stringify(msg, null, 2));
}
const master = (count) => {
  const children = [];

  const sendRequest = (text) => {
    const child = children.find(c => !c.isBusy);
    if (!child) return console.log('All are busy');
    child.isBusy = true;
    child.send(text.trim());
  }

  for (let i = 0; i < count; i++) {
    const child = fork(__filename);
    child.on('message', msg => {
      child.isBusy = false;
      showResult(msg);
    });
    children.push(child);
  }
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', sendRequest);
}
//node characterDistribution.js 2
//todo.txt /* will give distribution of characters in todo.txt
const main = () => {
  const count = +process.argv[2];
  if (count) master(count);
  else worker();
}
main();
