const { Server } = require('net');
const fs = require('fs');
const pickupParams = (query,keyValue)=>{
  const [key,value] = keyValue.split('=');
  query[key] = value;
  return query;
};
const readParams = keyValueTextPairs => keyValueTextPairs.split('&').reduce(pickupParams,{});
const parseQueryParameters = entireUrl =>{
  const [url,queryText] = entireUrl.split('?');
  const query = queryText && readParams(queryText);
  return {url,query};
}
const collectHeadersAndContent = (result, line) => {
  if (line === '') {
    result.body = '';
    return result;
  }
  if ('body' in result) {
    result.body += line;
    return result;
  }
  const [key, value] = line.split(': ');
  result.headers[key] = value;
  return result;
};
class Request {
  constructor(method, url, query, headers, body) {
    this.method = method;
    this.url = url;
    this.query = query;
    this.headers = headers;
    this.body = body;
  }
  static parse(requestText) {
    const [requestLine, ...headersAndBody] = requestText.split('\r\n');
    const [method, entireUrl, protocol] = requestLine.split(' ');
    const {url,query} = parseQueryParameters(entireUrl);
    let { headers, body } = headersAndBody.reduce(collectHeadersAndContent, { headers: {} });
    if(headers['Content-Type'] === 'application/x-www-form-urlencoded'){
      body = readParams(body);
    }
    const req =  new Request(method, url, query, headers, body);
    console.warn(req);
    return req;
  }
}
const STATIC_FOLDER = `${__dirname}/public`;
const CONTENT_TYPES = {
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  gif: 'image/gif'
};

let visitorCount = 0;
class Response {
  constructor() {
    this.statusCode = 404;
    this.headers = [{ key: 'Content-Length', value: 0 }];
  }
  setHeader(key, value) {
    let header = this.headers.find(h => h.key === key);
    if (header) header.value = value;
    else this.headers.push({ key, value })
  }
  generateHeadersText() {
    const lines = this.headers.map(header => `${header.key}: ${header.value}`);
    return lines.join('\r\n');
  }
  writeTo(writable) {
    writable.write(`HTTP/1.1 ${this.statusCode}\r\n`);
    writable.write(this.generateHeadersText());
    writable.write('\r\n\r\n');
    this.body && writable.write(this.body);
  }
}
const serveStaticFile = (req) => {
  const path = `${STATIC_FOLDER}${req.url}`;
  const stat = fs.existsSync(path) && fs.statSync(path);
  if (!stat || !stat.isFile()) return new Response();
  const [, extension] = path.match(/.*\.(.*)$/)||[];
  const contentType = CONTENT_TYPES[extension];
  const content = fs.readFileSync(path);
  const res = new Response();
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', content.length);
  res.statusCode = 200;
  res.body = content;
  return res;
}
const serveHomePage = (req) => {
  visitorCount++;
  const html = `
  <html>
    <head><title>The Socket Server</title></head>
    <body>
      <script>
        const sendHttpGET = (url,callback)=>{
          const req = new XMLHttpRequest();
          req.onload = function(){
            if(this.status===200) callback(this.responseText);
          }
          req.open("GET",url);
          req.send();
        }
        const reloadCount = ()=>{
          sendHttpGET("table.html",(text)=>{
            document.querySelector('footer #count').innerHTML = text;
          });
        }
      </script>
      <p>Welcome to the Socket Server</p>
      <img src="smiley.gif"></img>
      <p>Thanks for asking ${req.url}</p>
      <footer onclick="reloadCount()">You are visitor <span id="count">${visitorCount}</span></footer>
    </body>
  </html>`;
  const res = new Response();
  if(!req.headers['Cookie']) res.setHeader('Set-Cookie',`sessionId=${new Date().getTime()}`);
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.setHeader('Content-Length', html.length);
  res.statusCode = 200;
  res.body = html;
  return res;
}

const registerStudent = (req)=>{
  const student = req.query;
  const html = `
  <html>
    <head><title>The Socket Server</title></head>
    <body>
      
      <p>Thanks for Registering</p>
      <p>You will be known as ${student.firstName} ${student.lastName}</p>
      <footer>You will be studying in class ${student.standard}</footer>
    </body>
  </html>`;
  const res = new Response();
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.setHeader('Content-Length', html.length);
  res.statusCode = 200;
  res.body = html;
  return res;
}
const registerStudentPost = (req)=>{
  const student = req.body;
  const html = `
  <html>
    <head><title>The Socket Server</title></head>
    <body>
      
      <p>Thanks for Registering</p>
      <p>You will be known as ${student.firstName} ${student.lastName}</p>
      <footer>You will be studying in class ${student.standard}</footer>
    </body>
  </html>`;
  const res = new Response();
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.setHeader('Content-Length', html.length);
  res.statusCode = 200;
  res.body = html;
  return res;
}
const serveVisitorCount = (req)=>{
  const text = `${visitorCount}`;
  const res = new Response();
  res.setHeader('Content-Type', CONTENT_TYPES.txt);
  res.setHeader('Content-Length', text.length);
  res.statusCode = 200;
  res.body = text;
  return res;
}
const findHandler = (req) => {
  if(req.method === 'GET' && req.url==='/') return serveHomePage;
  if(req.method === 'GET' && req.url==='/visitorCount') return serveVisitorCount;
  if(req.method === 'GET' && req.url === '/registerStudent') return registerStudent;
  if(req.method === 'POST' && req.url === '/registerStudent') return registerStudentPost;
  if(req.method === 'GET') return serveStaticFile;
  return ()=>new Response();
}
const handleConnection = function (socket) {
  const remote = `${socket.remoteAddress}:${socket.remotePort}`;
  console.warn('new connection', remote);
  socket.setEncoding('utf8');
  socket.on('close', (hadError) => console.warn(`${remote} closed ${hadError ? 'with error' : ''}`));
  socket.on('end', () => console.warn(`${remote} ended`));
  socket.on('error', (err) => console.error('socket error', err));
  socket.on('drain', () => console.warn(`${remote} drained`));
  socket.on('data', (text) => {
    console.warn(`${remote} data:\n`);
    const req = Request.parse(text);
    const handler = findHandler(req);
    const res = handler(req);
    res.writeTo(socket);
  });
}
const main = () => {
  const server = new Server();
  server.on('error', err => console.error('server error', err));
  server.on('connection', handleConnection);
  server.on('listening', () => console.warn('started listening', server.address()));
  server.listen(4000);
}
main();
