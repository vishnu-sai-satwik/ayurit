import { Server } from "socket.io";
import { createCorsOriginMatcher } from "../utils/cors.js";

let io;

export const initSocket = (httpServer, allowedOrigin) => {
  const corsOriginMatcher = createCorsOriginMatcher(allowedOrigin);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, corsOriginMatcher(origin)),
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });

  io.on("connection", (socket) => {
    socket.on("join:patient", (patientId) => {
      socket.join(`patient:${patientId}`);
    });

    socket.on("join:user", (userId) => {
      socket.join(`user:${userId}`);
    });

    socket.on("join:role", (role) => {
      socket.join(`role:${role}`);
    });


  });

  return io;
};

export const getSocket = () => io;
