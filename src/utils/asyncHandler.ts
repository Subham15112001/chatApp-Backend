import { Request,Response,NextFunction } from 'express';
import prisma from './index.js'

const asyncHandler = (requestHandler:Function) => {
    return (req:Request,res : Response,next : NextFunction) => {
        // new Promise((resolve,reject)=>{
        //     resolve(requestHandler(req,res,next));
        // }).catch((err) => next(err))

        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    }
}

export {asyncHandler}