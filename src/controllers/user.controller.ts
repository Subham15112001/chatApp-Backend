import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Prisma, User } from "@prisma/client";
import jwt from "jsonwebtoken";
import prisma from '../utils/index.js';
import { Request, Response, NextFunction } from "express";
import { ParamsDictionary, ParsedQs } from "../types/asyncHandler.types.js";
import { registerUserReqBody, UserResBody, loginUserReqBody } from "../types/user.types.js";
import jwtData from "../jwtData.js";
import { Socket } from "socket.io";
import { userSocketConnection } from "../socket/socket.js";
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

const generateAccessTokenandRefreshToken = async (userId: number) => {
    try {

        // get user by id
        const accessToken = await prisma.user.generateAccessToken(userId);
        const refreshToken = await prisma.user.generateRefreshToken(userId);

        const response = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                "refreshToken": refreshToken
            }
        })
        //console.log(response)

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "something went wrong when creating new refresh token and access token")
    }
}

const registerUser = asyncHandler<ParamsDictionary, UserResBody, registerUserReqBody>(async (
    req: Request<ParamsDictionary, UserResBody, registerUserReqBody, ParsedQs>, // Explicitly type req
    res: Response<UserResBody>, // Explicitly type res
    next: NextFunction // Explicitly type next
) => {
    const { username, email, password } = req.body;

    if ([username, email, password].some((value) => String(value)?.trim() === "")) {
        throw new ApiError(408, "All fields are necessary");
    }

    const existedUser = await prisma.user.findUnique({
        where: {
            "email": email
        }
    })

    console.log(existedUser)

    if (existedUser) {
        throw new ApiError(409, "user already exist")
    }

    const createUser = await prisma.user.create({
        data: {
            "email": email,
            "password": password,
            "username": username
        }
    })

    const { refreshToken, accessToken } = await generateAccessTokenandRefreshToken(createUser.id)

    const option = {
        htmlOnly: true,
        secure: true
    }

    const updatedUser = await prisma.user.findUnique({
        where: {
            id: createUser.id
        }
    })


    if (!createUser) {
        throw new ApiError(500, "something went wrong when creating user")
    }

    res.status(201)
        .cookie("refreshToken", refreshToken, option)
        .cookie("accessToken", accessToken, option)
        .json(new ApiResponse(201, {
            user: updatedUser,
            accessToken,
        }, "created user successfully"))
})

const loginUser = asyncHandler<ParamsDictionary, UserResBody, loginUserReqBody>(async (
    req: Request<ParamsDictionary, UserResBody, loginUserReqBody, ParsedQs>,
    res: Response<UserResBody>,
    next: NextFunction
) => {
    const { email, password } = req.body;

    let userExist = await prisma.user.findUnique({
        where: {
            email: email
        }
    })

    if (!userExist) {
        throw new ApiError(406, "user does not exist")
    }

    let comparePassword = await prisma.user.isPasswordCorrect(userExist.password, password)

    if (!comparePassword) {
        throw new ApiError(407, "user password is wrong")
    }

    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(userExist.id)

    const loginUser = await prisma.user.update({
        where: {
            id: userExist.id
        },
        data: {
            refreshToken: refreshToken
        },
        omit: {
            refreshToken: true
        }
    })



    if (!loginUser) {
        throw new ApiError(405, "error in login")
    }

    const option = {
        httpOnly: true,
        secure: true
    }

    res.status(201)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(new ApiResponse(200, {
            user: loginUser,
            accessToken,
        },
            "user login successfully"
        ))

})

const logoutUser = asyncHandler<ParamsDictionary, UserResBody, User>(async (
    req: Request<ParamsDictionary, UserResBody, User, ParsedQs>,
    res: Response<UserResBody>,
    next: NextFunction
) => {

    const user = req?.user as User;

    const response = await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            refreshToken: null
        }
    })

    const option = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "user successfully logout"))

})

const refreshAccessToken = asyncHandler(async (req, res, next) => {

    const incomingRefreshToken = req?.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(403, "Unauthorised request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, jwtData.RefreshTokenSecret) as { id: number };


        if (typeof decodedToken.id !== "number") {
            decodedToken.id = parseInt(decodedToken.id)
        }
        const user = await prisma.user.findUnique({
            where: {
                id: decodedToken.id
            }
        })


        if (!user) {
            throw new ApiError(403, "invalid authorisation")
        }


        const { refreshToken, accessToken } = await generateAccessTokenandRefreshToken(user?.id);

        const option = {
            htmlOnly: true,
            secure: true
        }

        res.status(200)
            .cookie("refreshToken", refreshToken, option)
            .cookie("accessToken", accessToken, option)
            .json(new ApiResponse(200, { accessToken, user }, "accessToken and refreshToken send successfully"))
    } catch (error) {
        throw new ApiError(403, "Invalid refresh token");
    }
})

const getCurrentUser = asyncHandler<ParamsDictionary, UserResBody, User>(async (
    req: Request<ParamsDictionary, UserResBody, User, ParsedQs>,
    res: Response<UserResBody>,
    next: NextFunction
) => {
    res.status(200)
        .json(new ApiResponse(200, req.user!, "current user fetched"))
})

interface peopleListType {
    email: string | null,
    id: number | null,
    lastSeen: string | null,
    username: string | null,
    online?: boolean | null
}

const getAllUsers = asyncHandler(async (req, res, next) => {

    type PrismaUser = Prisma.UserGetPayload<{
        select: {
            username: true;
            email: true;
            id: true;
            lastSeen: true;
        }
    }>;

    // Define the output type with string lastSeen
    type UserWithStringLastSeen = Omit<PrismaUser, 'lastSeen'> & {
        lastSeen: string;
        online?:boolean
    };

    const users = await prisma.user.findMany({
        select: {
            username: true,
            email: true,
            id: true,
            lastSeen: true
        },
        orderBy: {
            id: "asc"
        }
    });

    dayjs.extend(relativeTime);
    console.log(userSocketConnection)
    const data: UserWithStringLastSeen[] = users.map((val: PrismaUser) => {
        let online = userSocketConnection.has(val.id)

        if (!val.lastSeen) {
            return {
                ...val,
                lastSeen: "",
                online
            };
        }

        const currentDate = dayjs();
        const otherDate = dayjs(val.lastSeen);

        return {
            ...val,
            lastSeen: currentDate.to(otherDate),
            online
        };
    });


    res.status(200)
        .json(new ApiResponse(200, data, "All users fetched"));
})

const updateOnlineStatus = async (
    event: "connect" | "disconnect",
    obj: {
        userSocketConnection: Map<string | number, Set<number | string>>,
        socketUserConnection: Map<string | number, number | string>
    },
    socket: Socket,
    userId: number
) => {


    if (event === "connect") {

        if (obj.userSocketConnection.has(userId)) {
            obj.userSocketConnection.get(userId)?.add(socket.id)
        } else {
            obj.userSocketConnection.set(userId, new Set<number | string>())
            obj.userSocketConnection.get(userId)?.add(socket.id)
        }

        obj.socketUserConnection.set(socket.id, userId)
       
        socket.emit("online-users", Array.from(obj.userSocketConnection.keys()))

        return
    }

    const userUpdated = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            lastSeen: new Date()
        }
    })

    if (!userUpdated) {
        throw new ApiError(410, "could not update last seen")
    }

    obj.userSocketConnection.get(userId)?.delete(socket.id)
    obj.socketUserConnection.delete(socket.id)

    if (obj.userSocketConnection.get(userId)?.size === 0) {
        obj.userSocketConnection.delete(userId)
    }

    socket.emit("online-users", Array.from(obj.userSocketConnection.keys()))
    return
}



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    getAllUsers,
    updateOnlineStatus
}