const socket = io();

const welcom = document.querySelector("#welcome");
const form = welcom.querySelector("form");
const room = document.querySelector("#room");

room.hidden = true;

let roomName;

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.querySelector("input");
    roomName = input.value;
    socket.emit("enter_room",{type:"room_name", payload:roomName}, ()=>{
        welcome.hidden = true;
        room.hidden = false;
        const h3 = room.querySelector("h3");
        h3.innerText = `Room ${roomName}`;
        const msgForm = room.querySelector("#message");
        const nickForm = room.querySelector("#nick");
        nickForm.addEventListener("submit", (event) => { // nick name handler
            event.preventDefault();
            const input = nickForm.querySelector("input");
            const nickname = input.value;
            socket.emit("nickname", {type:"nickname", payload:nickname}, roomName, () => {
                addMessage(`${nickname}`);
            });
            input.value = "";
        });
        msgForm.addEventListener("submit", (event) => { // msg handler
            event.preventDefault();
            const input = msgForm.querySelector("input");
            const message = input.value;
            socket.emit("new_message", {type:"message", payload:message}, roomName, () => {
                addMessage(`[You]: ${message}`);
            });
            input.value = "";
        });
        console.log(`Entered ${roomName} Room!`);
    });
    input.value = "";
});

function addMessage(message){
    const ul = room.querySelector("ul");
     const li = document.createElement("li");
     li.innerText = message;
     ul.appendChild(li);
}

socket.on("welcome", (nick, newCnt)=>{
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCnt})`;
    addMessage(`${nick} Joined!`)
});

socket.on("bye", (nick, newCnt)=>{
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCnt})`;
    addMessage(`${nick} Left!`)
});

socket.on("new_message", addMessage);

socket.on("nickname", addMessage);

socket.on("room_change", (rooms)=>{  // rooms is public rooms as array
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if (rooms.length === 0) {
        return;
    }
    rooms.forEach((room)=>{
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});