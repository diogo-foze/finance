"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/components/providers/SocketProvider";
import { Send, ArrowLeft, User as UserIcon, Check, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { data: session } = useSession();
  const { socket, unreadCount, setUnreadCount, checkUnread } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update "now" every 10 seconds to refresh the 120s edit/delete triggers
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000); // 1-second resolution
    return () => clearInterval(timer);
  }, []);

  const markAsRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return;

    fetch("/api/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds: ids }),
    });

    if (socket) {
      socket.emit("mark_read", { messageIds: ids, senderId: userId });
    }

    // Refresh global notification count
    checkUnread();
  }, [socket, userId, checkUnread]);

  useEffect(() => {
    async function fetchData() {
      const [msgRes, userRes] = await Promise.all([
        fetch("/api/messages"),
        fetch("/api/users")
      ]);

      const all = await msgRes.json();
      const users = await userRes.json();

      const filtered = Array.isArray(all) ? all
        .filter((m: any) =>
          (String(m.senderId) === String(session?.user?.id) && String(m.receiverId) === String(userId)) ||
          (String(m.senderId) === String(userId) && String(m.receiverId) === String(session?.user?.id))
        )
        .reverse() : [];

      setMessages(filtered);
      setOtherUser(users.find((u: any) => String(u._id) === String(userId)));

      const unreadIds = filtered
        .filter((m: any) => String(m.senderId) === String(userId) && m.status !== 'read' && !m.isRead)
        .map((m: any) => m._id);

      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
      setUnreadCount(0);
    }

    if (session) fetchData();
  }, [session, userId, markAsRead, setUnreadCount]);

  useEffect(() => {
    if (socket) {
      socket.on("new_message", (msg) => {
        if (String(msg.senderId) === String(userId) || String(msg.receiverId) === String(userId)) {
          setMessages((prev) => [...prev, msg]);
          if (String(msg.senderId) === String(userId)) {
            markAsRead([msg._id]);
            setUnreadCount(0);
          }
        }
      });

      socket.on("messages_read", (data) => {
        const { messageIds } = data;
        setMessages((prev) => prev.map(m =>
          messageIds.includes(String(m._id)) ? { ...m, status: 'read', isRead: true } : m
        ));
      });

      socket.on("message_status_update", (data) => {
        const { messageId, status } = data;
        setMessages((prev) => prev.map(m =>
          String(m._id) === String(messageId) ? { ...m, status } : m
        ));
      });

      socket.on("message_edited", (data) => {
        const { messageId, text } = data;
        setMessages((prev) => prev.map(m =>
          String(m._id) === String(messageId) ? { ...m, text: text, isEdited: true } : m
        ));
      });

      socket.on("message_deleted", (data) => {
        const { messageId } = data;
        setMessages((prev) => prev.map(m =>
          String(m._id) === String(messageId) ? { ...m, isDeleted: true } : m
        ));
      });

      return () => {
        socket.off("new_message");
        socket.off("messages_read");
        socket.off("message_status_update");
        socket.off("message_edited");
        socket.off("message_deleted");
      };
    }
  }, [socket, userId, markAsRead, setUnreadCount]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    if (editingMessage) {
      const res = await fetch("/api/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: editingMessage._id, text: inputText }),
      });

      if (res.ok) {
        setMessages(prev => prev.map(m =>
          String(m._id) === String(editingMessage._id) ? { ...m, text: inputText, isEdited: true } : m
        ));
        if (socket) {
          socket.emit("edit_message", { receiverId: userId, messageId: editingMessage._id, text: inputText });
        }
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao editar");
      }
      setEditingMessage(null);
      setInputText("");
      return;
    }

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId, text: inputText }),
    });

    const newMessage = await res.json();
    setMessages((prev) => [...prev, newMessage]);

    if (socket) {
      socket.emit("send_message", {
        receiverId: userId,
        message: newMessage,
      });
    }

    setInputText("");
  };

  const handleMessageClick = (msg: any) => {
    const isMe = String(msg.senderId) === String(session?.user?.id);
    if (!isMe) return;

    const myMessages = messages.filter(m => String(m.senderId) === String(session?.user?.id));
    const isLast = myMessages.length > 0 && String(myMessages[myMessages.length - 1]._id) === String(msg._id);

    if (isLast) {
      const now = new Date();
      const diff = (now.getTime() - new Date(msg.createdAt).getTime()) / 1000;
      if (diff <= 120) {
        setEditingMessage(msg);
        setInputText(msg.text);
      } else {
        alert("Tempo limite para edição esgotado");
      }
    }
  };

  const handleLongPress = (e: React.MouseEvent | React.TouchEvent, msg: any) => {
    e.preventDefault();
    const isMe = String(msg.senderId) === String(session?.user?.id);
    if (!isMe) return;

    if (window.confirm("Deseja excluir esta mensagem?")) {
      const nowTime = new Date();
      const diff = (nowTime.getTime() - new Date(msg.createdAt).getTime()) / 1000;

      // Enforce the 120s limit for deletion (matching the request)
      if (diff > 120) {
        alert("Tempo limite para exclusão esgotado");
        return;
      }

      fetch("/api/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg._id, isDeleted: true }),
      }).then(res => {
        if (res.ok) {
          setMessages(prev => prev.map(m =>
            String(m._id) === String(msg._id) ? { ...m, isDeleted: true } : m
          ));
          if (socket) {
            socket.emit("delete_message", { receiverId: userId, messageId: msg._id });
          }
        }
      });
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const months = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString();
    return `${day} de ${month} de ${year}`;
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-180px)] bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/mensagens" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              {otherUser?.image ? (
                <img src={otherUser.image} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm" />
              ) : (
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
              )}
              <h2 className="font-bold text-lg">{otherUser?.name || `Usuário ${userId.slice(-4)}`}</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]">
          {messages.map((msg, i) => {
            const isMe = String(msg.senderId) === String(session?.user?.id);

            // Date separator logic
            const currentMsgDate = new Date(msg.createdAt).toDateString();
            const prevMsgDate = i > 0 ? new Date(messages[i - 1].createdAt).toDateString() : null;
            const isNewDay = currentMsgDate !== prevMsgDate;

            // Delete icon logic for last message
            const myMessages = messages.filter(m => String(m.senderId) === String(session?.user?.id));
            const isLast = myMessages.length > 0 && String(myMessages[myMessages.length - 1]._id) === String(msg._id);
            const diffSeconds = (now.getTime() - new Date(msg.createdAt).getTime()) / 1000;
            const canDelete = isMe && isLast && diffSeconds <= 120 && !msg.isDeleted;

            return (
              <div key={msg._id || i} className="flex flex-col gap-4">
                {isNewDay && (
                  <div className="flex justify-center my-4">
                    <span className="px-4 py-1.5 bg-background/80 backdrop-blur-sm border border-border text-muted-foreground text-[10px] rounded-full uppercase tracking-widest font-bold shadow-sm">
                      {formatDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="relative group max-w-[75%]">
                    {canDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLongPress(e as any, msg); }}
                        className="absolute -top-3 -right-3 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg z-10 hover:scale-110 active:scale-95"
                        title="Excluir mensagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div
                      onClick={() => !msg.isDeleted && handleMessageClick(msg)}
                      onContextMenu={(e) => !msg.isDeleted && handleLongPress(e, msg)}
                      className={`relative p-4 rounded-2xl shadow-sm cursor-pointer select-none transition-all ${isMe
                        ? 'bg-primary text-primary-foreground rounded-br-none hover:brightness-110'
                        : 'bg-background text-foreground border border-border rounded-bl-none'
                        } ${msg.isDeleted ? 'opacity-50 grayscale-[0.5]' : ''}`}
                    >
                      {!isMe && !msg.isRead && !msg.isDeleted && (
                        <span className="absolute -top-2.5 -left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-bounce">
                          NOVA
                        </span>
                      )}
                      {msg.isDeleted ? (
                        <p className="text-sm italic opacity-70">Mensagem apagada</p>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                      {!msg.isDeleted && (
                        <div className="flex items-center justify-end gap-2 text-[10px] mt-1 opacity-70 min-w-16">
                          {msg.isEdited && <span className="italic">(editada)</span>}
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            <span className="ml-0.5">
                              {msg.status === 'read' || msg.isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-zinc-300" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 bg-background border-t border-border flex flex-col gap-2">
          {editingMessage && (
            <div className="flex items-center justify-between px-2 text-xs text-muted-foreground animate-in slide-in-from-bottom-2">
              <span className="flex items-center gap-1">
                Editando mensagem...
              </span>
              <button
                onClick={() => { setEditingMessage(null); setInputText(""); }}
                className="text-primary font-bold hover:underline"
              >
                Cancelar
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={editingMessage ? "Edite sua mensagem..." : "Escreva sua mensagem..."}
              className="flex-1 p-3 bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border-none transition-all text-sm"
              autoFocus={!!editingMessage}
            />
            <button
              onClick={sendMessage}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
