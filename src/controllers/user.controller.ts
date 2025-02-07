import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Prisma,User } from "@prisma/client";
import jwt from "jsonwebtoken";
import prisma from '../utils/index.js';
import {Request,Response, NextFunction } from "express";
import { ParamsDictionary,ParsedQs } from "../types/asyncHandler.types.js";
import { registerUserReqBody, UserResBody ,loginUserReqBody} from "../types/user.types.js";

const generateAccessTokenandRefreshToken = async (userId:number) => {
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
)  => {
    const { username, email, password } = req.body;

    if ([username, email].some((value) => String(value)?.trim() === "")) {
        throw new ApiError(400, "All fields are necessary");
    }

    const existedUser = await prisma.user.findUnique({
        where: {
            "email": email
        }
    })

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
            refreshToken
        }, "created user successfully"))
})

const loginUser = asyncHandler<ParamsDictionary, UserResBody, loginUserReqBody>(async (
    req: Request<ParamsDictionary, UserResBody, loginUserReqBody, ParsedQs>, 
    res:Response<UserResBody>, 
    next:NextFunction
) => {
    const { email, password } = req.body;

    let userExist = await prisma.user.findUnique({
        where: {
            email: email
        }
    })

    if (!userExist) {
        throw new ApiError(404, "user does not exist")
    }

    let comparePassword = await prisma.user.isPasswordCorrect(userExist.password, password)

    if (!comparePassword) {
        throw new ApiError(401, "user password is wrong")
    }

    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(userExist.id)

    const loginUser = await prisma.user.update({
        where: {
            id: userExist.id
        },
        data: {
            refreshToken: refreshToken
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
            refreshToken
        },
            "user login successfully"
        ))

})

export {
    registerUser,
    loginUser
}