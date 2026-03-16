"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  hasNewMessage: boolean;
  setHasNewMessage: (val: boolean) => void;
  checkUnread: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  hasNewMessage: false,
  setHasNewMessage: () => {},
  checkUnread: async () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const checkUnread = async () => {
    try {
      const res = await fetch("/api/messages/unread-count");
      const data = await res.json();
      if (res.ok) {
        setHasNewMessage(data.unreadCount > 0);
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
        setHasNewMessage(true);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [session]);

  return (
    <SocketContext.Provider value={{ socket, hasNewMessage, setHasNewMessage, checkUnread }}>
      {children}
    </SocketContext.Provider>
  );
};
