
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

        let conversation = await ctx.conversations.findOne({
            where: {
                [Op.or]: [
                    {
                        sender_id: data.from_id,
                        receiver_id: data.to_id
                    },
                    {
                        sender_id: data.to_id,
                        receiver_id: data.from_id
                    }
                ]
            }
        })
        if (!conversation) {

            conversation = await ctx.conversations.create({
                sender_id: data.from_id,
                receiver_id: data.to_id,

            })
        }
        let ret = await ctx.messages.create({
            from_id: data.from_id,
            conversation_id: conversation.id,
            to_id: data.to_id,
            text: data.text,
            media: data.media,
            seen: 0,
        })
        let media = null
        if(data.media){
            media = ctx.globalconfig['site_url']+'/'+data.media;
        }
        await io.to(data.to_id).emit("messages", {
            id: ret.id,
            from_id: data.from_id,
            conversation_id: conversation.id,
            to_id: data.to_id,
            media: media,
            text: data.text,
            updated_at: ret.updated_at,
            created_at: ret.created_at,
        });

    })

}  