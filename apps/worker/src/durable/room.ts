// apps/worker/src/durable/room.ts
import type { Env } from "../types";

export class RoomDurableObject implements DurableObject {
  state: DurableObjectState;
  env: Env;
  sessions: Map<WebSocket, { userId: string; name: string }> = new Map();

  // Der aktuelle Raum-Zustand
  roomState = {
    notes: "",
    chat: [] as Array<{ id: string; user: string; text: string; time: number }>,
    whiteboard: [] as Array<{ id: string; type: string; x: number; y: number; color: string; text?: string }>,
  };

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    // Zustand aus dem Speicher laden (falls vorhanden)
    this.state.blockConcurrencyWhile(async () => {
      const saved = await this.state.storage.get("roomState");
      if (saved) this.roomState = saved as any;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // WebSocket-Verbindung
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      const userId = url.searchParams.get("userId") || "unbekannt";
      const userName = url.searchParams.get("name") || "Gast";

      this.handleSession(server, userId, userName);
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Not a websocket", { status: 400 });
  }

  async handleSession(ws: WebSocket, userId: string, name: string) {
    ws.accept();
    this.sessions.set(ws, { userId, name });

    // Sende aktuellen Zustand an den neuen Nutzer
    ws.send(JSON.stringify({ type: "init", state: this.roomState, me: name }));

    // Informiere alle anderen über den neuen Nutzer
    this.broadcast({ type: "user_joined", name }, ws);

    ws.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data as string);

        if (data.type === "update_notes") {
          this.roomState.notes = data.notes;
          this.save();
          this.broadcast({ type: "notes_updated", notes: data.notes }, ws);
        } 
        else if (data.type === "draw") {
          // Ein neues Whiteboard-Element
          const item = { ...data.item, id: crypto.randomUUID() };
          this.roomState.whiteboard.push(item);
          this.save();
          this.broadcast({ type: "draw", item }, ws);
        }
        else if (data.type === "chat_message") {
          const chatMsg = { id: crypto.randomUUID(), user: name, text: data.text, time: Date.now() };
          this.roomState.chat.push(chatMsg);
          // Chat auf max 100 Nachrichten begrenzen
          if (this.roomState.chat.length > 100) this.roomState.chat.shift();
          this.save();
          this.broadcast({ type: "chat_message", message: chatMsg }, ws);
        }
      } catch (err) {
        console.error("WS Message Error", err);
      }
    });

    ws.addEventListener("close", () => {
      this.sessions.delete(ws);
      this.broadcast({ type: "user_left", name }, ws);
    });
  }

  broadcast(msg: any, exclude?: WebSocket) {
    const payload = JSON.stringify(msg);
    for (const [ws] of this.sessions) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  async save() {
    await this.state.storage.put("roomState", this.roomState);
  }
}
