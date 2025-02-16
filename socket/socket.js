import { Server } from "socket.io";
import http from 'http';
import express from 'express';

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin : ["http://3.82.158.190:8000"],
        methods: ["GET", "POST"],
        credentials: true,
    }
});

export const getReceiverSocketId = (receiver) =>{
    return userSocketMap[receiver];
}

const userSocketMap = {};

io.on('connection', (socket) => {
    // console.log(socket.id);
    const userId = socket.handshake.query.userId;
    // console.log(userId);
    if(userId != "undefined")
        userSocketMap[userId] = socket.id;


    socket.on('disconnect', () => {
        delete userSocketMap[userId];
    })
})

export {app,io,server};