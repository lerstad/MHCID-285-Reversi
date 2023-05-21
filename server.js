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


    /* join_room command handler */
    /* expected payload:
        {
            'room': the room to be joined,
            'username': he name of the user joining the room
        }
    */
   /* join_room_response:
        {
            'result': 'success',
            'room': room that was joined
            'username': the user that joined the room
            'count': the number of users in the chat room
        }
    or
        {
            'result': 'fail',
            'message': the reason for failure,
        }
    */

    socket.on('join_room', (payload) => {
        serverLog('Server received a command','\'join_room\'',JSON.stringify(payload));
        /*Check that the data coming from the client is good */
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a payload';
            socket.emit('join_room_response',response);
            serverLog('join_room command failed',JSON.stringify(response));
            return;
        }
        let room = payload.room;
        let username = payload.username;

        if ((typeof room == 'undefined') || (room === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a valid room to join';
            socket.emit('join_room_response',response);
            serverLog('join_room command failed',JSON.stringify(response));
            return;
        }

        if ((typeof username == 'undefined') || (username === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a valid username to join the chat room';
            socket.emit('join_room_response',response);
            serverLog('join_room command failed',JSON.stringify(response));
            return;
        }

        /* Handle the command */
        socket.join(room);

        /* Make sure the client was put in the room */
        io.in(room).fetchSockets().then((sockets)=>{
            serverLog('There are '+sockets.length+'clients in the room, '+room);
            /* Sockets didn't join the room */
            if ((typeof sockets == 'undefined') || (sockets ===null) || !sockets.includes(socket)){
                response = {};
                response.result = 'fail';
                response.message = 'Server internal error joining chat room';
                socket.emit('join_room_response',response);
                serverLog('join_room command failed',JSON.stringify(response));
            }
            /* Socket did join room */
            else{
                response = {};
                response.result = 'success';
                response.room = room;
                response.username = username;
                response.count = sockets.length;
                /* Tell everyone that a new user has joined the chat room */
                io.of('/').to(room).emit('join_room_response',response);
                serverLog('join_room succeeded',JSON.stringify(response));
            }
        });
    });
});