const express = require('express');
const BodyParser = require('body-parser');
const { Server } = require("socket.io");

const io = new Server({ 
  cors: {
    origin: "http://localhost:3000",
  },
});
const app = express();

app.use(BodyParser.json());

const emailToScoketIdMapping = new Map();
const socketIdToEmailMapping = new Map();

io.on("connection", (socket) => {
    console.log("New client connected");
    
    socket.on("join-room", (data) => {
        const { roomId, emailId } = data;

        emailToScoketIdMapping.set(emailId, socket.id);
        socketIdToEmailMapping.set(socket.id, emailId);
        socket.join(roomId);
        console.log(`User with email ${emailId} joined room ${roomId}`);
        socket.emit("joined-room", { roomId });
        socket.broadcast.to(roomId).emit("user-joined", { emailId });
    });

    socket.on("call-user", (data) => {
        const { emailId, offer } = data;
        const socketId = emailToScoketIdMapping.get(emailId);
        const fromEmail = socketIdToEmailMapping.get(socket.id);
        console.log(`Calling user with email ${fromEmail} and socket id ${socketId}`);
        socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
    });

    socket.on("call-accepted", (data) => {
        const { emailId, answer } = data;
        const socketId = emailToScoketIdMapping.get(emailId);
        const fromEmail = socketIdToEmailMapping.get(socket.id);
        console.log(`Call accepted by user with email ${fromEmail} and socket id ${socketId}`);
        socket.to(socketId).emit("call-accepted", { answer });
    });

    socket.on("ice-candidate", (data) => {
        const { emailId, candidate } = data;
        
        const socketId = emailToScoketIdMapping.get(emailId);
        
        if (socketId) {
            socket.to(socketId).emit("ice-candidate", { candidate });
        }
    });
});

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});

io.listen(8001);