const Self_PeerConnection = new Peer(); // Uses free public PeerJS signaling server

let Username = "(You)";
let PeerID = "";
let isHost = false;
toggleHosting();

function toggleHosting(){
    isHost = !isHost;
    var hostingDiv = document.getElementById("Hosting");
    var connectingDiv = document.getElementById("Connecting");

    hostingDiv.style.display = isHost ? '':'none';
    connectingDiv.style.display = !isHost ? '':'none';
}

let PeerConnections = new Map();

// Class which defines the connection: Username, Connection, potentially more
class RemoteConnection{
    Username = "Remote";

    constructor(connection){
        this.Peer_Connection = connection;
    }
}

// Once my own connection is ready
Self_PeerConnection.on('open', id => {
    document.getElementById('my-id').textContent = id;
    PeerID = id;
    UpdateUserName(id, "Default Name");
});

// Once a remote connection comes in
Self_PeerConnection.on('connection', connection => {
    console.log(connection);
    var connectionObject = new RemoteConnection(connection);
    PeerConnections.set(connection.peer, connectionObject);

    InitialHandshake(connection);

    addMessageToChat(PeerID, "A new User has Connected");
    // changeName();
});

// Initiate outgoing connection
function connectToPeer() {
    const remoteId = document.getElementById('peer-id').value;
    // Remote_PeerConnection = Self_PeerConnection.connect(remoteId);
    var connection = Self_PeerConnection.connect(remoteId);
    var connectionObject = new RemoteConnection(connection);

    PeerConnections.set(remoteId, connectionObject);

    // console.log(connection);
    // console.log(PeerConnections.get(remoteId));

    InitialHandshake(connection);
    
    // sendUsername();
    // setupChat();
}

//call this once 2 peers connect; Initial exchange of Data
function InitialHandshake(RemoteConnection){
    setupChat(RemoteConnection);
    UpdateUserName(RemoteConnection.peer,  "Remote");

    RemoteConnection.on('open', e => {
        sendUsername(PeerID, Username);
        if(isHost){
            PeerConnections.forEach((value, id, map) => {
                Host_ProliferateUsername(id, value.Username);
            });
        }
        updateChatters();
    });
}

// Class for sending data to a remote p2p
class packetData{
    peer = "";
    type = "Undefined";
    content = "Blank";
}
// Callback for receiving data from remote p2p
function setupChat(RemoteConnection) {
    RemoteConnection.on('data', data => {
        // document.getElementById('chat').innerHTML += `<p>Peer: ${data}</p>`;
        // console.log(data);
        switch(data.type){
            case "Message":
                addMessageToChat(data.peer, data.content);
                if(isHost) Host_ProliferateChat(data.peer, data.content);
                break;
            case "Username":
                UpdateUserName(data.peer, data.content);
                if(isHost) Host_ProliferateUsername(data.peer, data.content);
                break;
        }
        
    });
}
// Host Proliferation
// Used exclusively by the Host to send messages to all connected Peers
function Host_ProliferateChat(originID, message){
    sendMessage(originID, message);
}

function Host_ProliferateUsername(originID, name){
    sendUsername(originID, name);
}


// Local Functions
// Used to send information locally, and not to anyone else

//change a local username.
function UpdateUserName(id, name){
    // connectionNames.set(id, name);

    if(id == PeerID){
        Username = name;
    }else if(PeerConnections.has(id)){
        PeerConnections.get(id).Username = name;
    }else{
        PeerConnections.set(id, new RemoteConnection());
        PeerConnections.get(id).Username = name;
    }
    updateChatters();
}

//update the list of chatters
function updateChatters(){
    document.getElementById("connectedUsers").replaceChildren();

    var myString = document.createElement("p");
    myString.innerText = `(You) ${Username}`;
    document.getElementById("connectedUsers").appendChild(myString);

    PeerConnections.forEach((value, key) => {
        var myString = document.createElement("p");
        myString.innerText = value.Username;
        document.getElementById("connectedUsers").appendChild(myString);
    });
}

function sendSystemMessageToChat(message){
    var messageElement = document.createElement("p");
    messageElement.innerText = `System: ${message}`;

    document.getElementById('chat').appendChild(messageElement);
}

function addMessageToChat(senderID, message){
    console.log(PeerConnections);
    var senderName = (senderID == PeerID) ? Username : PeerConnections.get(senderID).Username;
    var messageElement = document.createElement("p");
    messageElement.innerText = `${senderName}: ${message}`;

    document.getElementById('chat').appendChild(messageElement);
}

function changeName() {
    const text = document.getElementById('name').value;
    UpdateUserName(Self_PeerConnection.id, `${text}`);
    sendSystemMessageToChat(`Username has been updated to ${text}`);
    sendUsername(PeerID, text);
}

function submitMessage() {
    const text = document.getElementById('msg').value;
    sendMessage(PeerID, text);
    addMessageToChat(Self_PeerConnection.id, text);
    document.getElementById('msg').value = "";
}

// Peer Functions
// Used to send information across a Peer connection. When hosts receieve information, they then proliferate it out to other peers.

function sendMessage(senderID, message){
    PeerConnections.forEach((connection, id, map) => {
        // console.log(connection);
        if(id != senderID){
            if(connection.Peer_Connection && connection.Peer_Connection.open){
                var data = new packetData();
                data.type = "Message";
                data.content = message;
                data.peer = senderID;
                connection.Peer_Connection.send(data);
            }
        }
    });
}

function sendUsername(senderID, name){
    PeerConnections.forEach((connection, id, map) => {
        // console.log(connection);
        if(id != senderID){
            if(connection.Peer_Connection && connection.Peer_Connection.open){
                var data = new packetData();
                data.type = "Username";
                data.content = name;
                data.peer = senderID;
                connection.Peer_Connection.send(data);
                // console.log("Sent Data");
            }
        }
    });
}