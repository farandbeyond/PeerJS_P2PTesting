const peer = new Peer(); // Uses free public PeerJS signaling server

let connectionNames = new Map();

let conn;

function addChatter(id){
    if(id == peer.id){
        connectionNames.set(id, "You");
    }else{
        connectionNames.set(id, "Remote");
    }

    var myString = document.createElement("p");
    myString.innerText = connectionNames.get(id);
    document.getElementById("connectedUsers").appendChild(myString);
}

function addMessageToChat(message, senderID){
    var messageElement = document.createElement("p");
    messageElement.innerText = `${connectionNames.get(senderID)}:${message}`;

    document.getElementById('chat').appendChild(messageElement);
}

peer.on('open', id => {
    document.getElementById('my-id').textContent = id;
    addChatter(id);
});

// Listen for incoming connections
peer.on('connection', connection => {
    conn = connection;
    setupChat();
    addChatter(conn.peer);
});

// Initiate outgoing connection
function connectToPeer() {
    const remoteId = document.getElementById('peer-id').value;
    conn = peer.connect(remoteId);
    addChatter(conn.peer);
    setupChat();
}

function setupChat() {
    conn.on('data', data => {
        // document.getElementById('chat').innerHTML += `<p>Peer: ${data}</p>`;
        addMessageToChat(data, conn.peer);
    });
}

function sendMessage() {
    const text = document.getElementById('msg').value;
    if (conn && conn.open) {
        conn.send(text);
        // document.getElementById('chat').innerHTML += `<p>You: ${text}</p>`;
        addMessageToChat(text, peer.id);
    }
}