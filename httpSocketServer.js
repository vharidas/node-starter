const { Server } = require('net');
const fs = require('fs');
class Request {
  constructor(method, url, headers, body) {
    this.method = method;
    this.url = url;
    this.headers = headers;
    this.body = body;
  }
  static parse(requestText) {
    const [requestLine, ...headersAndBody] = requestText.split('\r\n');
    const [method, url, protocol] = requestLine.split(' ');
    const { headers, body } = headersAndBody.reduce(collectHeadersAndContent, { headers: {} });
    const req =  new Request(method, url, headers, body);
    console.warn(req);
    return req;
  }
}
const STATIC_FOLDER = `${__dirname}/public`;
const CONTENT_TYPES = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  gif: 'image/gif'
};

let visitorCount = 0;
const collectHeadersAndContent = (result, line) => {
  if (line === '') {
    result.content = '';
    return result;
  }
  if ('content' in result) {
    result.content += line;
    return result;
  }
  const [key, value] = line.split(': ');
  result.headers[key] = value;
  return result;
};

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
      <p>Welcome to the Socket Server</p>
      <img src="smiley.gif"></img>
      <p>Thanks for asking ${req.url}</p>
      <footer>You are visitor ${visitorCount}</footer>
    </body>
  </html>`;
  const res = new Response();
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.setHeader('Content-Length', html.length);
  res.statusCode = 200;
  res.body = html;
  return res;
}
const findHandler = (req) => {
  if(req.method === 'GET' && req.url==='/') return serveHomePage;
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
