
export type registerUserReqBody = {
    username:string,
    email:string,
    password:string
}

export type UserResBody = {
     statusCode: number,
     data: object,
     message: string,
     success: boolean
}

export type loginUserReqBody = { 
    email:string,
    password:string
}