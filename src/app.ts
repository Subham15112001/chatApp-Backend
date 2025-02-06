import express from 'express';
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

//cofigur cors
app.use(cors({
    origin: 'http://localhost:5173', // Ensure no trailing slash
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 204
}))

//limit json size
app.use(express.json({ limit: "2MB" }))

//configure url, extended true so that we can have obj inside obj
app.use(express.urlencoded({ extended: true }))

//to store asset in file name public
app.use(express.static("public"))

//to read user cookies 
app.use(cookieParser())

//-----------------------------------------------------------------
app.get('/', (req, res) => {
    res.json({ status: 'API is running on /api' });
});

//routes import 


export { app }