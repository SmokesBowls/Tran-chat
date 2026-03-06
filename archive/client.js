const socket = io();

let room = prompt("Enter room name:");
socket.emit("joinRoom", { room });

document.getElementById("send").addEventListener("click", () => {
  const msgBox = document.getElementById("msg");
  const message = msgBox.value;
  if (message.trim()) {
    socket.emit("sendMessage", { room, msg: message });
    msgBox.value = "";
  }
});

socket.on("receiveMessage", (message) => {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.textContent = message;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});
