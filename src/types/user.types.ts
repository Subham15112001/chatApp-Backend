
export type registerUserReqBody = {
    username:string,
    email:string,
    password:string
}

export type registerUserResBody = {
     statusCode: number,
     data: object,
     message: string,
     success: boolean
}
