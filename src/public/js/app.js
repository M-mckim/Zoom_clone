const messageList = document.querySelector("#message-list");
const messageForm = document.querySelector("#message-form");
const nickForm = document.querySelector("#nickname-form");
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
    console.log("Connected to Server ✅");
})

socket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
    console.log("New message: ", message.data);
})

socket.addEventListener("close", () => {
    console.log("Disconnected from Server ❌");
})

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMessage("new_message", input.value));
    input.value = "";
})

nickForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = nickForm.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
    input.value = "";
})

function makeMessage(type, payload) {
    console.log(`type: ${type}, payload: ${payload}`)
    const msg = {type, payload};
    return JSON.stringify(msg);
}
