"use client";

import { useSocket } from "@/components/providers/SocketProvider";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import "./notifications.css";

export function NotificationIndicator() {
  const { hasNewMessage, setHasNewMessage } = useSocket();

  const handleClick = () => {
    setHasNewMessage(false);
  };

  return (
    <Link 
      href="/mensagens" 
      onClick={handleClick}
      className={`relative p-2 rounded-full transition-all ${hasNewMessage ? 'notification-active bg-red-50' : 'hover:bg-gray-100'}`}
    >
      <MessageSquare className={`w-6 h-6 ${hasNewMessage ? 'text-red-600' : 'text-gray-600'}`} />
      {hasNewMessage && (
        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white" />
      )}
    </Link>
  );
}
