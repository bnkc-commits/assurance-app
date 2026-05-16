const socket = io();
let peer = new RTCPeerConnection();
let channel = peer.createDataChannel("prospectData");

channel.onopen = () => console.log("Canal ouvert");

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
async function syncWithCloud(request) {
  await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
}

// Signalisation WebRTC
socket.on("signal", async (data) => {
  await peer.setRemoteDescription(new RTCSessionDescription(data));
  if (data.type === "answer") {
    console.log("Réponse reçue de l'agent");
  }
});

document.getElementById("prospectForm").onsubmit = (e) => {
  e.preventDefault();
  let request = {
    name: document.getElementById("name").value,
    request: document.getElementById("request").value
  };
  saveLocalRequest(request);
  syncWithCloud(request);
  channel.send(JSON.stringify(request));
};
