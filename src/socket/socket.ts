import { Server } from "socket.io";
import { createServer } from "http";
import { app } from "../app";
import { createRoom, sendmessage } from "../controllers/message.controller";
import { updateOnlineStatus } from "../controllers/user.controller";

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
})

let userSocketConnection = new Map<string | number, Set<number | string>>()
let socketUserConnection = new Map<string | number, number | string>()

type sendMessageType = [
    senderId: number,
    receiverId: number,
    roomId: number,
    message: string
]

const setupIo = (io: Server): void => {
    io.on("connection", (socket) => {

        console.log("socket connected")

        const userId:number = parseInt(socket.handshake.query.userId as string)
        updateOnlineStatus(
            "connect", {
            userSocketConnection,
            socketUserConnection,
        },
            socket,
            userId
        )

        socket.on("joinRoom", (data: { [key: string]: number }) => {
            createRoom(socket, data.user1, data.user2)

        })


        socket.on("sendMessage", (data: sendMessageType) => {
            sendmessage(socket, ...data)
        })

        socket.on("disconnect", () => {

            updateOnlineStatus(
                "disconnect", {
                userSocketConnection,
                socketUserConnection
            },
                socket,
                userId
            )

            console.log("socket disconnected")
        })
    })
}

export { setupIo, io, userSocketConnection, httpServer }
