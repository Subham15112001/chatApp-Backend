import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as core from 'express-serve-static-core';
import { ParamsDictionary,ParsedQs } from "../types/asyncHandler.types";
import  prisma  from "./index";

type AsyncRequestHandler<
    P = ParamsDictionary, // type for req.params, default to ParamsDictionary
    ResBody = any,        // type for res.body, default to any
    ReqBody = any,        // type for req.body, default to any
    ReqQuery = ParsedQs,   // type for req.query, default to ParsedQs
    ResLocals extends Record<string, any> = Record<string, any> // type for res.locals, default to Record<string, any>
> = RequestHandler<P, ResBody, ReqBody, ReqQuery, ResLocals>;

const asyncHandler = <
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    ResLocals extends Record<string, any> = Record<string, any>
>(
    requestHandler: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery, ResLocals>
) => {
    return (
        req: Request<P, ResBody, ReqBody, ReqQuery, ResLocals>,
        res: Response<ResBody, ResLocals>,
        next: NextFunction
    ) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err: any) => next(err)).finally(async() => { await prisma.$disconnect(); });
    };
};

export { asyncHandler };