
const { Sequelize, Op, DataTypes } = require("sequelize");


module.exports.registerListeners = async (socket, io, ctx) => {
    console.log('a user connected ' + socket.id + " Hash " + JSON.stringify(socket.handshake.query));

    socket.on("join", async (data) => {
        if (data.user_id === '') {
            console.log("killing connection user_id not received")
            socket.disconnect(true)
            return
        }
        let user_id = data.user_id

        ctx.socketIdUserHash[socket.id] = data.user_id;
        ctx.userIdSocket[user_id] ? ctx.userIdSocket[user_id].push(socket) : ctx.userIdSocket[user_id] = [socket]
        ctx.userHashUserId[data.user_id] = user_id;
        ctx.userIdCount[user_id] = ctx.userIdCount[user_id] ? ctx.userIdCount[user_id] + 1 : 1;

        socket.join(user_id);
    })
    socket.on("messages", async (data) => {

        await io.to(data.to_id).emit("messages", data);

    })

    socket.on('disconnect', async (reason) => {
        console.log('a user disconnected ' + socket.id + " " + reason)
        let hash = ctx.socketIdUserHash[socket.id]
        let user_id = ctx.userHashUserId[hash]
        ctx.userIdCount[user_id] > 0 ? ctx.userIdCount[user_id] = ctx.userIdCount[user_id] - 1 : delete ctx.userIdCount[user_id]
        if (ctx.userIdCount[user_id] === 0) {
            delete ctx.userIdCount[user_id]
            delete ctx.userHashUserId[hash]
        }
        if (ctx.userIdSocket[user_id]) {
            ctx.userIdSocket[user_id] = ctx.userIdSocket[user_id].filter(d => d.id != socket.id)
        }
        ctx.userIdExtra = {}
        delete ctx.socketIdUserHash[socket.id]
    });

}  