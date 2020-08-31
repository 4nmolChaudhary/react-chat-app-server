const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const router = require('./router')
const cors = require('cors')
const PORT = process.env.PORT || 5000

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')

io.on('connection', (socket) => {
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room })

        if (error) return callback(error)
        socket.emit('message', { user: 'admin', text: `Welcome ${user.name} to the ${user.room} room` })
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined the room` })

        socket.join(user.room);
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('message', { user: user.name, text: message })
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` })
        }
    });
});

app.use(router)
app.use(cors())

server.listen(PORT, () => console.log('server ready'))