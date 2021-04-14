const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:80", //prod
        // origin: "http://192.168.1.26:3000", dev
        methods: ["GET", "POST"]
    }
})

const users = {}

//listen for connection
io.on('connection', (socket) => {
    if (!users[socket.id]){
        users[socket.id] = socket.id
    }

    socket.emit('me', socket.id) //emit the id to frontend
    io.sockets.emit('allUsers', users) //emit users object to frontend
    socket.on('disconnect', () => {
        socket.broadcast.emit('callEnded')
    })

    //handle making the call
    //emit incomingCall function to frontend
    socket.on('callUser', (data) => {
        io.to(data.userToCall).emit('incomingCall', {signal: data.signalData, from: data.from, name: data.name})
    })
    //handle receiving the call
    //emit callAccepted function to frontend
    socket.on('acceptCall', (data) => {
        io.to(data.to).emit('callAccepted', data.signal) 
    })
})

server.listen(7000, () => {
    console.log(`server is listening on port ${7000} `)
}) 