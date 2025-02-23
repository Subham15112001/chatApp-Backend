import dotenv from 'dotenv';
import { app } from "./app.js";
import { setupIo,io,httpServer } from "./socket/socket.js";
import { Server } from "socket.io";
import { createServer } from "http";
const port = process.env.PORT || 7000;


dotenv.config({
    path: './.env'
})

 setupIo(io)


httpServer.listen(port, () => {
     
    console.log(`server is running on port ${port}`)
})
