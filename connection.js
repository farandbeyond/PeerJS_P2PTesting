const Self_PeerConnection = new Peer(); // Uses free public PeerJS signaling server

let Username = "(You)";
let PeerID = "";

let PeerConnections = new Map();
// PeerConnections.set(document.getElementById('peer-id').value, new RemoteConnection(Self_PeerConnection));
// let Remote_PeerConnection;

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

    console.log(connection);
    console.log(PeerConnections.get(remoteId));

    InitialHandshake(connection);
    
    // sendUsername();
    // setupChat();
}

//call this once 2 peers connect; Initial exchange of Data
function InitialHandshake(RemoteConnection){
    setupChat(RemoteConnection);
    UpdateUserName(RemoteConnection.peer,  "Remote");

    RemoteConnection.on('open', e => {
        sendUsername();
        updateChatters();
    });
}

// Class for sending data to a remote p2p
class packetData{
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
                addMessageToChat(RemoteConnection.peer, data.content);
                break;
            case "Username":
                UpdateUserName(RemoteConnection.peer, data.content);
                break;
        }
        
    });
}

//change a local username.
function UpdateUserName(id, name){
    // connectionNames.set(id, name);
    if(id == PeerID){
        Username = name;
    }else{
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


function addLocalMessageToChat(message){
    var messageElement = document.createElement("p");
    messageElement.innerText = `System: ${message}`;

    document.getElementById('chat').appendChild(messageElement);
}
function addMessageToChat(senderID, message){
    var senderName = senderID == PeerID ? Username : PeerConnections.get(senderID).Username;
    var messageElement = document.createElement("p");
    messageElement.innerText = `${senderName}: ${message}`;

    document.getElementById('chat').appendChild(messageElement);
}





function sendMessage() {
    const text = document.getElementById('msg').value;

    PeerConnections.forEach((connection, id, map) => {
        console.log(connection);
        if(connection.Peer_Connection && connection.Peer_Connection.open){
            var data = new packetData();
            data.type = "Message";
            data.content = text;
            connection.Peer_Connection.send(data);
        }
    });
    addMessageToChat(Self_PeerConnection.id, text);
    document.getElementById('msg').value = "";
}

function changeName() {
    const text = document.getElementById('name').value;
    UpdateUserName(Self_PeerConnection.id, `${text}`);
    addLocalMessageToChat(`Username has been updated to ${text}`);
    sendUsername();
}
function sendUsername(){
    PeerConnections.forEach((connection, id, map) => {
        // console.log(connection);
        if(connection.Peer_Connection && connection.Peer_Connection.open){
            var data = new packetData();
            data.type = "Username";
            data.content = Username;
            connection.Peer_Connection.send(data);
            // console.log("Sent Data");
        }
    });
}