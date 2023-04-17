import express from 'express'
import http from 'http'
import { Server } from 'socket.io';

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

wsServer.on("connection", (socket) => {
    console.log(socket.id);
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        console.log("room joined", roomName)
        socket.to(roomName).emit("welcome");
    });
    socket.on("offer",(offer, roomName) => {
        console.log("offer :", offer)
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        console.log("answer :", answer)
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        console.log("ice :", ice)
        socket.to(roomName).emit("ice", ice);
    });
    // socket.on("message", (message, roomName) => {
    //     socket.to(roomName).emit("message", message);
    // });
    // socket.on("msg_ok", (msg, roomName) => {
    //     socket.to(roomName).emit("msg_ok", msg);
    // });
});


httpServer.listen(3000, handleListen);

