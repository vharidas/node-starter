const { Socket } = require('net');
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

const readHeader = (text) => {
  const [response, ...headersAndContent] = text.split('\r\n');
  const { headers, content } = headersAndContent.reduce(collectHeadersAndContent, { headers: {} });
  return { response, headers, content };
}
const main = (host, port, resource) => {
  const request = [
    `GET ${resource} HTTP/1.0`,
    `Host: ${host}`,
    `User-Agent: Mozilla/5.0`,
    `Accept: */*`,
    '',
    ''
  ].join('\n');

  const client = new Socket();
  client.setEncoding('utf8');
  client.on('connect', () => client.write(request));
  client.once('data', (text) => {
    let { response, headers, content } = readHeader(text);
    console.warn(response);
    console.warn(headers);

    client.on('data', (chunk) => content += chunk);
    client.on('end', () => {
      console.log(content);
      console.warn('disconnected')
    });
  });

  client.connect({ host, port });
}

//python3 -m http.server to start a local server

//'localhost', 8000, '/'
main(...process.argv.slice(2))
