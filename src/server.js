import express from 'express'
import http from 'http'
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
      origin: ["https://admin.socket.io"],
      credentials: true
    }
});

instrument(wsServer, {
    auth: false,
    mode: "development",
});

function publicRooms() {
    const { sockets: { adapter: { sids, rooms } } } = wsServer;
    // const sids = wsServer.sockets.adapter.sids;
    // const rooms = wsServer.sockets.adapter.rooms;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
    socket["nickname"] = "Unknown";
    socket.onAny((event) => { // any event handler
        console.log(wsServer.sockets.adapter)
        console.log(`Socket Event: ${event}`);
    });
    socket.on("enter_room", (room_info, done) => { // enter room handler
        socket.join(room_info.payload);
        done();
        socket.to(room_info.payload).emit("welcome", socket.nickname, countRoom(room_info.payload));
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {  // disconnecting handler
        socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countRoom(room)-1));
    });
    socket.on("disconnect", () => { // disconnect handler
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("new_message", (message, room, done) => { // send new message handler
        socket.to(room).emit("new_message", `${socket.nickname}: ${message.payload}`);
        done();
    });
    socket.on("nickname", (nickname) => { // change(save) nickname handler
        socket["nickname"] = nickname.payload;
    });
});

/*
const wss = new WebSocket.Server({server});

let sockets = [];

wss.on("connection",(socket)=> {
    socket["nickname"] = "Unknown";
    sockets.push(socket);
    console.log(socket);
    socket.on("close", ()=> console.log("Disconnected from Browser"));
    socket.on("message",(message)=>{
        message = message.toString('utf8');
        console.log(message)
        const parsedMessage = JSON.parse(message);
        switch(parsedMessage.type) {
            case "new_message":
                sockets.forEach((aSocket) => {
                    aSocket.send(`${socket.nickname}: ${parsedMessage.payload}`);
                });
                break;
            case "nickname":
                socket["nickname"] = parsedMessage.payload;
                break;
        }
    });
});
*/

httpServer.listen(3000, handleListen);

