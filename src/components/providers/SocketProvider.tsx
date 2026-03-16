"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  unreadCount: number;
  setUnreadCount: (val: number) => void;
  checkUnread: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  unreadCount: 0,
  setUnreadCount: () => {},
  checkUnread: async () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkUnread = async () => {
    try {
      const res = await fetch("/api/messages/unread-count");
      const data = await res.json();
      if (res.ok) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Erro ao verificar mensagens não lidas:", error);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      checkUnread();
      
      const newSocket = io();
      setSocket(newSocket);

      newSocket.emit("register", session.user.id);

      newSocket.on("notification", () => {
        setUnreadCount(prev => prev + 1);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [session]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount, checkUnread }}>
      {children}
    </SocketContext.Provider>
  );
};
