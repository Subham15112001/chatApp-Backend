// Purpose: Controller for handling messages
import { asyncHandler, ApiError, ApiResponse, prisma } from "../utils/file.js";
import { Request, Response, NextFunction } from "express";
import { ParamsDictionary, ParsedQs } from "../types/asyncHandler.types.js";
import { UserResBody } from "../types/user.types.js";
import { createRoomTypesReqParams } from "../types/message.types.js";
import jwtData from "../jwtData.js";
import { Socket } from "socket.io";
import { io,userSocketConnection } from "../socket/socket.js";
import { connect } from "http2";
import { setEngine } from "crypto";
import { all } from "axios";

const createRoom = async (socket: Socket,sender:number,receiver:number) => {

   

    if (sender === receiver) {
        throw new ApiError(403, "You can't create room with yourself");
    }

    let maxNum:number = Math.max(sender,receiver)
    sender = Math.min(sender,receiver)
    receiver = maxNum

    const roomExist = await prisma.chat.findFirst({
        where: {
            OR: [
                {
                    AND: [
                        {
                            initiatorId: sender
                        },
                        {
                            participantId: receiver
                        }
                    ]

                },
                {
                    AND: [
                        {
                            initiatorId: sender
                        },
                        {
                            participantId: receiver
                        }
                    ]
                }
            ]
        }
    })

    if (roomExist) {

        socket.join(roomExist.id.toString())

        socket.emit("roomCreated",{
            roomId:roomExist.id
        })

        console.log(roomExist)
        return
    }

    const createRoom = await prisma.chat.create({
        data: {
            participantId: receiver,
            initiatorId: sender
        }
    })

    console.log(createRoom)

    socket.join(createRoom.id.toString())

    socket.emit("roomCreated", {
        roomId: createRoom.id
    })
}

const sendmessage = async (socket:Socket,senderId:number,receiverId:number,roomId:number,message:string):Promise<void> => {

    if(!senderId || !receiverId || !roomId){
        throw new ApiError(403,"empty  id");
    }

    const createMessage = await prisma.message.create({
        data:{
            content:message,
            chat:{
                connect:{
                    id:roomId
                }
            },
            sender:{
                connect:{
                    id:senderId
                }
            },
            receiver:{
                connect:{
                    id:receiverId
                }
            }
        }
    })

    if(!createMessage){
        throw new ApiError(403,"issue with creating message")
    }
    
    const data = {
        senderId,
        receiverId,
        roomId,
        message
    }

    socket.to(roomId.toString()).emit("receiveMessage",data)

}

type getAllMessagesReq = {
    roomId:string
}

const getAllMessages = asyncHandler<getAllMessagesReq, UserResBody, any>(async (
    req: Request<getAllMessagesReq, UserResBody, any, ParsedQs>,
    res: Response<UserResBody>,
    next: NextFunction
) => {
    
    const roomId = parseInt(req.params.roomId)
    
    if(!roomId){
        throw new Error("invalid roomId");
        
    }
    const allMessages = await prisma.chat.findUnique({
        where:{
            id:roomId
        },
        include:{
            messages:{
                orderBy:{
                    createdAt:'asc'
                },
                include:{
                    sender:true,
                    receiver:true
                }
            }
        }
    })

    if(!allMessages){
        throw new ApiError(403,"unable to fetch messages")
    }

    res.status(201)
       .json(new ApiResponse(201,allMessages,`all the messages in room id :${roomId} `,true))
})

export {
    createRoom,
    sendmessage,
    getAllMessages
}