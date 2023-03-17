import { Socket } from 'dgram';
import express from 'express'
import http from 'http'
import WebSocket from 'ws';

const app = express();

app.set("view engine", "pug");
app.set("views",__dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const server = http.createServer(app);
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

server.listen(3000, handleListen);

