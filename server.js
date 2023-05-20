/******************************/
/* Set up the static file server */
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



/******************************/
/* Set up the web socket server */
const { Server } = require("socket.io");
const io = new Server(app);

io.on('connection', (socket) => {

    /* Output a log message on the server and send it to the clients */
    function serverLog(...messages){
        io.emit('log',['**** Message from the server:\n']);
        messages.forEach((item) => {
            io.emit('log',['****\t'+item]);
            console.log(item);
        });
    }

    serverLog('a page connected to the server: '+socket.id);

    socket.on('disconnect', () => {
        serverLog('a page disconnected from the server: '+socket.id);
    });
});