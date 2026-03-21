import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Message from "./src/models/Message";

// Load environment variables using Next.js native loader
// This is the recommended way for custom servers in Next.js
try {
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(process.cwd());
  console.log("Environment variables loaded successfully");
} catch (err) {
  console.error("Failed to load environment variables:", err);
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("CRITICAL: MONGODB_URI is not defined in environment variables");
} else {
  console.log("Connecting to MongoDB...");
  mongoose.connect(MONGODB_URI).then(() => {
    console.log("MongoDB connected in custom server process");
  }).catch(err => {
    console.error("MongoDB connection error:", err);
  });
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Attach io to global object for API route access
  (global as any).io = io;
  (global as any).userSockets = new Map<string, string>();
  const userSockets = (global as any).userSockets;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("register", (userId: any) => {
      if (userId) {
        const uid = String(userId);
        userSockets.set(uid, socket.id);
        console.log("User registered:", uid);
      }
    });

    socket.on("send_message", async (data) => {
      const { receiverId, message } = data;
      const rid = String(receiverId);
      const receiverSocketId = userSockets.get(rid);

      if (receiverSocketId) {
        try {
          // Double check DB connection before update
          if (mongoose.connection.readyState === 1) {
            await Message.findByIdAndUpdate(message._id, { status: 'delivered' });
          }
        } catch (err) {
          console.error("Error updating message status:", err);
        }

        io.to(receiverSocketId).emit("new_message", { ...message, status: 'delivered' });
        io.to(receiverSocketId).emit("notification", {
          from: message.senderId,
          text: "Você recebeu uma nova mensagem!"
        });
        socket.emit("message_status_update", { messageId: message._id, status: 'delivered' });
      }
    });

    socket.on("mark_read", (data) => {
      const { messageIds, senderId } = data;
      const sid = String(senderId);
      const senderSocketId = userSockets.get(sid);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_read", { messageIds: messageIds.map(String) });
      }
    });

    socket.on("edit_message", (data) => {
      const { receiverId, messageId, text } = data;
      const rid = String(receiverId);
      const receiverSocketId = userSockets.get(rid);
      if (receiverSocketId) {
        console.log("Broadcasting edit to:", rid, "for msg:", messageId);
        io.to(receiverSocketId).emit("message_edited", { messageId: String(messageId), text });
      }
    });

    socket.on("delete_message", (data) => {
      const { receiverId, messageId } = data;
      const rid = String(receiverId);
      const receiverSocketId = userSockets.get(rid);
      if (receiverSocketId) {
        console.log("Broadcasting delete to:", rid, "for msg:", messageId);
        io.to(receiverSocketId).emit("message_deleted", { messageId: String(messageId) });
      }
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer.listen(port, "0.0.0.0", () => {
    console.log("Server ready on port", port);
  });
}).catch(err => {
  console.error("Next.js app prepare failed:", err);
});
