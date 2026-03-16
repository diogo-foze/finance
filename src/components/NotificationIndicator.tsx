"use client";

import { useSocket } from "@/components/providers/SocketProvider";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import "./notifications.css";

export function NotificationIndicator() {
  const { unreadCount, checkUnread } = useSocket();

  const handleClick = () => {
    // When clicking, we refresh to be sure, though it will clear when messages are marked as read
    checkUnread();
  };

  return (
    <Link 
      href="/mensagens" 
      onClick={handleClick}
      className={`relative p-2 rounded-full transition-all ${unreadCount > 0 ? 'notification-active bg-red-50' : 'hover:bg-gray-100'}`}
    >
      <MessageSquare className={`w-6 h-6 ${unreadCount > 0 ? 'text-red-600' : 'text-gray-600'}`} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
