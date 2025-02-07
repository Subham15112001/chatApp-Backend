import { PrismaClient,User } from '@prisma/client'
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"



const prisma = new PrismaClient().$extends({
    model : {
        user : {
            async isPasswordCorrect(password: string,reqPassword: string):Promise<boolean>{
                return await bcrypt.compare(reqPassword, password)
            },
            generateRefreshToken(userId:number):string|null{

                return jwt.sign(
                    {
                        id:userId
                    },
                    process.env.REFRESH_TOKEN_SECRET! ,
                    {
                        expiresIn: "7d"
                    }
                )
            },
            generateAccessToken(userId:number):string|null{
                return jwt.sign(
                    {
                        id: userId
                    },
                    process.env.ACCESS_TOKEN_SECRET!,
                    {
                        expiresIn: "1d"
                    }
                )
            }
        }
    },
    query : {
        user : {
            async create({ model, operation, args, query }){
                let user = args.data as User;
                let password = await bcrypt.hash(user.password, 10);
                user = {...user,password : password}
                args.data = user;
                return query(args);
            },
            async update({ model, operation, args, query }){
                const user = args.data as User;
                if (user.password) { // Only hash password if it's provided
                    user.password = await bcrypt.hash(user.password, 10);
                }
               
                args.data = user;
                return query(args);
            }
        }
    }
})

export default prisma