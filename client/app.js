// IndexedDB pour mode hors ligne
function saveLocalRequest(request) {
  let dbRequest = indexedDB.open("AssuranceDB", 1);
  dbRequest.onupgradeneeded = function(event) {
    let db = event.target.result;
    db.createObjectStore("prospects", { autoIncrement: true });
  };
  dbRequest.onsuccess = function(event) {
    let db = event.target.result;
    let tx = db.transaction("prospects", "readwrite");
    tx.objectStore("prospects").add(request);
  };
}

// Synchronisation avec le cloud
async function syncWithCloud() {
  let dbRequest = indexedDB.open("AssuranceDB", 1);
  dbRequest.onsuccess = function(event) {
    let db = event.target.result;
    let tx = db.transaction("prospects", "readonly");
    let store = tx.objectStore("prospects");
    store.getAll().onsuccess = async function(e) {
      let requests = e.target.result;
      for (let req of requests) {
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req)
        });
      }
    };
  };
}

// WebRTC + Socket.io pour communication directe
const socket = io();
let peer = new RTCPeerConnection();
let channel = peer.createDataChannel("prospectData");

channel.onopen = () => console.log("Canal ouvert");
channel.onmessage = (e) => console.log("Message reçu:", e.data);

socket.on("signal", async (data) => {
  await peer.setRemoteDescription(new RTCSessionDescription(data));
  if (data.type === "offer") {
    let answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit("signal", answer);
  }
});

// Formulaire
document.getElementById("prospectForm").onsubmit = (e) => {
  e.preventDefault();
  let request = {
    name: document.getElementById("name").value,
    request: document.getElementById("request").value
  };
  saveLocalRequest(request);
  syncWithCloud();
  channel.send(JSON.stringify(request));
};
