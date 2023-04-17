const socket = io()

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute")
const cameraBtn = document.getElementById("camera")
const cameraSelect = document.getElementById("cameras")

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label){
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
        console.log(cameras);
    }catch(e){
        console.log("ERROR:",e);
    }
}

async function getMedia(deviceId){
    const initialConstrains = {
        audio: true,
        video: {facingMode: "user"},
    };
    const cameraConstraints = {
        audio: true,
        video: {deviceId: {exact: deviceId}},
    };
    try{
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId){
            await getCameras();
        }
    } catch(e){
        console.log("ERROR:",e);
    }
}

//getMedia();

function handleCameraClick(){
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if (cameraOff){
        cameraBtn.innerText="Turn Camera Off";
        cameraOff = false;
    }else{
        cameraBtn.innerText="Turn Camera On";
        cameraOff = true;
    }
}

function handleMuteClick(){
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if (muted){
        muteBtn.innerText="Mute";
        muted = false;
    }else{
        muteBtn.innerText="Unmute";
        muted = true;
    }
}

async function handleCameraChange(){
    await getMedia(cameraSelect.value);
    facingMode: "user";
    if(myPeerConnection){
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === "video");
        console.log(videoSender);
        videoSender.replaceTrack(myStream.getVideoTracks({facingMode: {exact: "environment"}})[1]);
    }
}
/*
facingMode: "user" // front camera
facingMode: {exact: "environment"} // back camera
*/

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    roomName = input.value;
    await initCall();
    socket.emit("join_room", roomName);
    input.value = "";
}

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code
socket.on("welcome", async() => { // in chrome 1(streamer)
    console.log("someone joined")
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", console.log);
    console.log("made data channel",myDataChannel);
    const offer = await myPeerConnection.createOffer();
    // print offer type
    myPeerConnection.setLocalDescription(offer)
    socket.emit("offer", offer, roomName);
    console.log('created offer : ',offer)
    console.log("sent the offer");
});

socket.on("offer", async(offer) => { // in chrome 2(viewer)
    console.log('received offer : ', offer)
    //console.log('received offer.sdp : ', offer.sdp)
    myPeerConnection.addEventListener("datachannel", (event)=>{
        console.log("datachannel event", event)
        myDataChannel = event.channel;
        console.log("received data channel", myDataChannel)
        myDataChannel.addEventListener("message", (event)=>{
            console.log(event.data);
        });
    });
    console.log("received the offer");
    try{
        myPeerConnection.setRemoteDescription(offer); // ICE Candidate 때문에 await 제거했음 문제 생기면 다시 await 추가
        console.log("Set RemoteDescription(offer) success!");
    }catch(e){
        console.log("Set RemoteDescription(offer) ERROR:",e);
    }
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});



socket.on("answer", (answer) => { // in chrome 1(streamer)
    try{
        myPeerConnection.setRemoteDescription(answer);
        console.log("Set RemoteDescription(answer) success!");
    }catch(e){
        console.log("Set RemoteDescription(answer) ERROR:",e);
    }
    console.log("received the answer");
});

socket.on("ice", (ice) => { // in chrome 1(streamer)
    console.log("received candidate :",ice);
    myPeerConnection.addIceCandidate(ice);
});

// RTC Code
function makeConnection(){
    myPeerConnection = new RTCPeerConnection(
        {
            iceServers: [
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                    ],
                },
            ],
        }
    ); 
    myPeerConnection.addEventListener("icecandidatestatuschange", (event) => {
        console.log("icecandidatestatuschange", event);
    });
    
    myPeerConnection.addEventListener("iceconnectionstatechange", (event) => {
        console.log("iceconnectionstatechange", event);
        console.log("icecandeidate connection state : ", myPeerConnection.iceConnectionState)
    });

    myPeerConnection.addEventListener("icegatheringstatechange", (event) => {
        console.log("icegatheringstatechange", event);
    });

    myPeerConnection.addEventListener("signalingstatechange", (event) => {
        console.log("signalingstatechange", event);
    });

    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
    console.log('mysream : ', myStream)
    console.log('mytrack from getracks : ', myStream.getTracks())

}

function handleIce(data){
    console.log("handle ICE data.candidate :", data.candidate);
    socket.emit("ice", data.candidate, roomName);
    console.log("sent candidate")
}

function handleAddStream(data){
    console.log("handle Add Stream data :", data);
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}
