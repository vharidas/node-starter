const { Server } = require('net');
const generateResourceResponse = resource => {
  const html = `<html><head><title>Good Server</title></head><body><p>Thanks for asking ${resource}</p></body></html>`;
  return [`HTTP/1.0 200 OK`, 'Content-Type: text/html', `Content-Length: ${html.length}`, '', html].join('\n');
}
const badRequestResponse = [`HTTP/1.0 400 Bad Request`,'Content-Type: text/html',`Content-Length: 0`,'',''].join('\n');
const generateResponseText = (headers, method, resource) => {
  return (method === 'GET')? generateResourceResponse(resource) : badRequestResponse;   
};
const acceptConnection = socket => {
  const remote = { addr: socket.remoteAddress, port: socket.remotePort };
  console.warn('new connection', remote);
  socket.setEncoding('utf8');
  socket.on('data', text => {
    console.warn(remote, 'data:', text);
    const [requestLine, ...headers] = text.split('\n');
    const [method, resource, protocol] = requestLine.split(' ');
    console.log(method, resource, protocol);
    socket.write(generateResponseText(headers, method, resource));
  });
  socket.on('end', () => console.warn(remote, 'end'));
  socket.on('close', () => console.warn(remote, 'closed'));
}
const main = () => {
  const server = new Server();
  server.on('listening', () => console.warn('started listening', server.address()));
  server.on('connection', acceptConnection);
  server.listen(4000);
};

main();
