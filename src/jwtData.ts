type data = {
    RefreshTokenSecret:string,
    RefreshTokenExpiresIn:string,
    AccessTokenSecret:string,
    AccessTokenExpiresIn:string
}

 const jwtData:data = {
    RefreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
    RefreshTokenExpiresIn: "7d",
    AccessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
    AccessTokenExpiresIn: "1d"
}

export default jwtData