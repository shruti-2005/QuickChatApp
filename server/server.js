import express from "express"
import "dotenv/config"
import cors from "cors"
import http from "http"
import { connect } from "http2";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import { Socket } from "dgram";

//Create express app and http server
const app = express();
const server = http.createServer(app)

//Initialize socket.io server
export const io = new Server(server,{
  cors: {origin:"*"}
})

//Store online users
export const userSocketMap = {}; //{userId:socketId}


//Socket.io connection handler
io.on("connection",(socket)=>{
  const userId = socket.handshake.query.userId;
  console.log("User connected",userId);

  if(userId) userSocketMap[userId] = socket.id;
  
  // Emit online users to all connected online
  io.emit("getOnlineUsers",Object.keys(userSocketMap));

  socket.on("disconnect" , () => {
    console.log("User Disconnected",userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers",Object.keys(userSocketMap));
  })

})

//Middleware setup
app.use(express.json({limit:"4mb"})); //allow max limit of 4mb to upload images
app.use(cors()); 

//Connect to MongoDB
await connectDB();

//Routes setup

app.use("/api/status", (req,res)=>res.send("Server is live"));
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter);

if(process.env.NODE_ENV !== "production"){
  const PORT = process.env.PORT || 5000
server.listen(PORT , ()=>console.log("Server is running on PORT:" + PORT));
}

//export server for vercel
export default server;
