import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Prisma,User } from "@prisma/client";
import jwt from "jsonwebtoken";
import prisma from '../utils/index.js';
import {Request,Response, NextFunction } from "express";
import { ParamsDictionary,ParsedQs } from "../types/asyncHandler.types.js";
import { registerUserReqBody, registerUserResBody } from "../types/user.types.js";

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


const registerUser = asyncHandler<ParamsDictionary, registerUserResBody, registerUserReqBody>(async (
    req: Request<ParamsDictionary, registerUserResBody, registerUserReqBody, ParsedQs>, // Explicitly type req
    res: Response<registerUserResBody>, // Explicitly type res
    next: NextFunction // Explicitly type next
)  => {
    const { username, email, password } = req.body;

    console.log(req.body)
    
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

export {
    registerUser
}