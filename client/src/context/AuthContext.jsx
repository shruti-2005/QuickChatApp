import { createContext, useEffect, useState } from "react";
import axios from 'axios';
import toast from "react-hot-toast";
import {io} from "socket.io-client";


const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({children})=>{


  const [token,setToken] = useState(localStorage.getItem("token"))
  const [authUser,setAuthUser]=useState(null);
  const[onlineUsers,setOnlineUsers] = useState([]);
  const [socket,setSocket] = useState(null);

  const [loading, setLoading] = useState(true);

//Check if user is authenticated,and if so set the user data and connect the socket

const checkAuth = async () => {
  try {
    const { data } = await axios.get("/api/auth/check");
    console.log("checkAuth response:", data);
    if (data.success) {
      setAuthUser(data.user);
      connectSocket(data.user);
    } else {
      console.log("Auth check failed");
    }
  } catch (error) {
    console.error("Auth check error:", error);
  } finally {
    setLoading(false);
  }
};




//Login function to handle user authentication and socket connection

const login = async (state,credentials)=>{
  setLoading(true)
    try {
      const {data} = await axios.post(`/api/auth/${state}`,credentials);
      if(data.success){
        axios.defaults.headers.common["token"] = data.token; // move this up
       setToken(data.token); // this triggers useEffect
      localStorage.setItem("token", data.token);
      setAuthUser(data.userData);
      connectSocket(data.userData);
      toast.success(data.message);
      
      }else{
         toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }finally {
    setLoading(false);
  }
}


// Logout function to handle userlogout and socket disconnection

const logout = async()=>{
  localStorage.removeItem("token");
  setToken(null);
  setAuthUser(null);
  setOnlineUsers([]);
  axios.defaults.headers.common["token"] = null;
  toast.success("Logged out successfully")
  socket.disconnect();
}


//Update profile function to handle user profile updates

const updateProfile = async (body) => {
  try {
    const {data} = await axios.put("/api/auth/update-profile",body)
    if(data.success){
      setAuthUser(data.user);
      toast.success("Profile updated successfu;lly");
    }
  } catch (error) {
    toast.error(error.message);
  }
}


//Connect socket function to handle socket cnnection and online users updates
const connectSocket = (userData)=>{
  if (!userData || socket?.connected ) return;

  const newSocket = io(backendUrl,{
    query:{
      userId : userData._id,
    }
  });
  newSocket.connect();
  setSocket(newSocket);

  newSocket.on("getOnlineUsers",(userIds)=>{
    setOnlineUsers(userIds);
  })
}

useEffect(() => {
  if (token) {
    axios.defaults.headers.common["token"] = token;
    checkAuth();
  }
}, [token]);



  const value = {
       axios,
       authUser,
       onlineUsers,
       socket,
       login,
       logout,
       updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}