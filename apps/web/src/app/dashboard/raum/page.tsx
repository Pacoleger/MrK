"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Send, PenTool, StickyNote, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoomPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") || "hauptraum";
  const { user } = useAuth();
  
  const [ws, setWs] = React.useState<WebSocket | null>(null);
  const [activeTab, setActiveTab] = React.useState<"notes" | "whiteboard" | "chat">("notes");
  const [onlineUsers, setOnlineUsers] = React.useState<string[]>([]);
  
  const [notes, setNotes] = React.useState("");
  const [chat, setChat] = React.useState<any[]>([]);
  const [chatInput, setChatInput] = React.useState("");

  // Verbindung aufbauen
  React.useEffect(() => {
    if (!user) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "mrk-api.pacokamegne.workers.dev";
    const host = apiUrl.replace(/^https?:\/\//, "");
    
    const socket = new WebSocket(`${protocol}//${host}/api/rooms/${roomId}`);
    
    socket.onopen = () => setWs(socket);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "init") {
        setNotes(data.state.notes);
        setChat(data.state.chat);
      } else if (data.type === "notes_updated") {
        setNotes(data.notes);
      } else if (data.type === "chat_message") {
        setChat((prev) => [...prev, data.message]);
      } else if (data.type === "user_joined") {
        setOnlineUsers((prev) => [...prev, data.name]);
      } else if (data.type === "user_left") {
        setOnlineUsers((prev) => prev.filter((n) => n !== data.name));
      }
    };

    return () => socket.close();
  }, [roomId, user]);

  // Notizen ändern
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    ws?.send(JSON.stringify({ type: "update_notes", notes: e.target.value }));
  };

  // Chat senden
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    ws?.send(JSON.stringify({ type: "chat_message", text: chatInput }));
    setChatInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Raum: {roomId}</h1>
          <p className="text-sm text-muted-foreground">
            {onlineUsers.length > 0 ? `${onlineUsers.length + 1} Teilnehmer online` : "Warte auf Verbindung..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "notes" ? "default" : "outline"} onClick={() => setActiveTab("notes")}>
            <StickyNote className="h-4 w-4 mr-2" /> Notizen
          </Button>
          <Button variant={activeTab === "whiteboard" ? "default" : "outline"} onClick={() => setActiveTab("whiteboard")}>
            <PenTool className="h-4 w-4 mr-2" /> Whiteboard
          </Button>
          <Button variant={activeTab === "chat" ? "default" : "outline"} onClick={() => setActiveTab("chat")}>
            <MessageSquare className="h-4 w-4 mr-2" /> Chat
          </Button>
        </div>
      </div>

      {/* Inhalt */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "notes" && (
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Gemeinsame Notizen hier..."
            className="w-full h-full p-6 resize-none focus:outline-none bg-transparent text-base"
          />
        )}

        {activeTab === "whiteboard" && (
          <div className="w-full h-full bg-slate-50 dark:bg-slate-900 relative grid place-items-center">
             <p className="text-muted-foreground">Whiteboard (In Arbeit / Canvas folgt)</p>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chat.map((msg, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-xs font-semibold text-brand-600">{msg.user}</span>
                  <span className="text-sm">{msg.text}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2">
              <Input 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                placeholder="Nachricht schreiben..." 
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              />
              <Button onClick={handleSendChat}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
