"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/components/providers/SocketProvider";
import Link from "next/link";
import { User as UserIcon, MessageSquare, Plus, X, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

interface Chat {
  otherUserId: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  image?: string;
}

export default function MessagesManagement() {
  const { data: session } = useSession();
  const { socket, setUnreadCount } = useSocket();
  const [chats, setChats] = useState<Chat[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [msgRes, userRes] = await Promise.all([
        fetch("/api/messages"),
        fetch("/api/users")
      ]);

      const messages = await msgRes.json();
      const users = await userRes.json();

      setAvailableUsers(Array.isArray(users) ? users : []);

      const conversations = new Map();
      if (Array.isArray(messages)) {
        messages.forEach((msg: any) => {
          const otherId = String(msg.senderId) === String(session?.user?.id) ? msg.receiverId : msg.senderId;
          const isUnread = !msg.isRead && String(msg.receiverId) === String(session?.user?.id);

          if (!conversations.has(otherId)) {
            conversations.set(otherId, {
              otherUserId: otherId,
              lastMessage: msg.text,
              updatedAt: msg.createdAt,
              unreadCount: isUnread ? 1 : 0,
            });
          } else if (isUnread) {
            const current = conversations.get(otherId);
            current.unreadCount += 1;
          }
        });
      }
      setChats(Array.from(conversations.values()));
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchData();
      setUnreadCount(0); // Clear local count when viewing list (or keep it if you want it to persist until read)
    }
  }, [session, fetchData]);

  useEffect(() => {
    if (socket) {
      socket.on("new_message", () => {
        fetchData();
        setUnreadCount(0);
      });

      return () => {
        socket.off("new_message");
      };
    }
  }, [socket, fetchData, setUnreadCount]);

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase().replace("@", ""))) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" /> Gestão de Mensagens
          </h1>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Mensagem
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {chats.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma conversa iniciada.</p>
              <Button variant="link" onClick={() => setIsModalOpen(true)}>Inicie uma agora</Button>
            </div>
          ) : (
            chats.map((chat) => {
              const chatUser = availableUsers.find(u => String(u._id) === String(chat.otherUserId));
              return (
                <Link
                  key={chat.otherUserId}
                  href={`/mensagens/${chat.otherUserId}`}
                  className="flex items-center p-5 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                >
                  {chatUser?.image ? (
                    <img src={chatUser.image} alt="Avatar" className="w-12 h-12 rounded-full object-cover mr-4 shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4 shrink-0">
                      <UserIcon className="text-primary w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{chatUser?.name || `Usuário ${chat.otherUserId.slice(-4)}`}</span>
                        {chatUser?.username && <span className="text-xs font-bold text-primary">@{chatUser.username}</span>}
                        {chat.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-normal text-muted-foreground">
                        {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{chat.lastMessage}</div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* User Selection Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-background w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold">Nova Conversa</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar usuários..."
                    className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20 border-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1">
                  {filteredUsers.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <Link
                        key={user._id}
                        href={`/mensagens/${user._id}`}
                        onClick={() => setIsModalOpen(false)}
                        className="flex items-center p-3 rounded-xl hover:bg-muted transition-colors"
                      >
                        {user.image ? (
                          <img src={user.image} alt="Avatar" className="w-10 h-10 rounded-full object-cover mr-3 shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 bg-muted-foreground/10 rounded-full flex items-center justify-center mr-3 shrink-0">
                            <UserIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs font-bold text-primary">@{user.username}</div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
