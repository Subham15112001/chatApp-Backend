import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import prisma from '../utils/index.js'
import  jwtData  from "../jwtData.js";
import {Request,Response, NextFunction } from "express";
import {  User } from '@prisma/client'

interface decodedTokenType {
    id:number
}


interface MyRequest extends Request {
    user: Omit<User, 'password'> & { password?: string }
}

export const verifyJWT = asyncHandler(async (req:MyRequest, res:Response, next:NextFunction) => {

    try {
        const token = req.headers['authorization']?.split(' ')[1];

        console.log(token)
        if (!token) {
            throw new ApiError(401, "unauthorised request")
        }


        const decodedToken = jwt.verify(token, jwtData.AccessTokenSecret) as decodedTokenType;
        // console.log(decodedToken)
        const user = await prisma.user.findUnique({
            where: {
                id: decodedToken.id
            },
            omit: {
                password: true,
            }
        });

        if (!user) {
            throw new ApiError(401, "invalid access token");
        }

        req['user'] = user;

        next();
    } catch (error) {
        throw new ApiError(401, "Access token has expired");
    }
})
