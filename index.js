const static = require('node-static');
const http = require('http');

let port = process.env.PORT;
let directory = __dirname + '/public';

const fs = new static.Server(directory);

if (!port) {
    port = 3000;
    directory = './public';
}

const app = http.createServer((req, res) => {
    req.addListener('end', () => {
        fs.serve(req, res)
    }).resume();
}).listen(port);

console.log('The server is running!');