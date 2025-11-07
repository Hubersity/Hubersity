import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, Image, Paperclip, Video } from "lucide-react";
import { useLayoutEffect } from "react";

// URL backend
const API_URL = "http://localhost:8000";
const toAbs = (u) => (u?.startsWith("http") ? u : `${API_URL}${u || ""}`);

export default function Chat() {
  // อ่าน me_id / token แบบเดียวกับหน้าอื่น ๆ ในโปรเจกต์คุณ
  const { meId, token } = useMemo(() => {
    const currentKey = localStorage.getItem("currentUserKey");
    const auth = currentKey ? JSON.parse(localStorage.getItem(currentKey) || "{}") : {};
    return { meId: auth?.uid || 1, token: auth?.token || null };
  }, []);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const [friends, setFriends] = useState([]);      // รายชื่อห้อง/เพื่อนจาก backend
  const [selected, setSelected] = useState(null);  // ห้องที่เลือกอยู่ (มี chat_id)
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const fileInputRef = useRef(null);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const [pendingFiles, setPendingFiles] = useState([]); // File[]
  const [isSending, setIsSending] = useState(false);

  // 1) โหลด "รายการห้องแชทของฉัน"
  useEffect(() => {
    const loadChats = async () => {
      try {
        const res = await fetch(`${API_URL}/chats?me_id=${meId}`, { headers: { ...authHeaders } });
        if (!res.ok) throw new Error("load chats failed");
        const list = await res.json();
        // map ให้เข้ารูปแบบของ UI เดิม
        const mapped = list.map((c) => ({
          id: c.id, // chat_id
          name: c.name,
          username: c.username,
          avatar: c.avatar || "/images/default.jpg",
          lastMessage: c.lastMessage || "",
          messages: [], // จะเติมทีหลังตอนคลิก
        }));
        setFriends(mapped);
        const lastId = Number(localStorage.getItem("lastChatId") || 0);
        const initial = mapped.find(x => x.id === lastId) || mapped[0];
        // เลือกอันแรกอัตโนมัติ และโหลดข้อความ
        if (initial) {
          setSelected(initial);
          await loadMessages(initial.id);
        }
      } catch (e) {
        console.error("Error loading chats:", e);
      }
    };
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId, token]);

  // เลื่อนเมื่อมีการเปลี่ยนแปลงข้อความในห้องที่ถูกเลือก
  useLayoutEffect(() => {
    scrollToBottom();
  }, [selected?.id, selected?.messages?.length]);

  // 2) โหลดข้อความในห้อง (เรียกตอนคลิกซ้ายหรือเลือกห้อง)
  const loadMessages = async (chatId) => {
    try {
      const res = await fetch(`${API_URL}/chats/${chatId}/messages?me_id=${meId}`, {
        headers: { ...authHeaders },
      });
      if (!res.ok) throw new Error("load messages failed");
      const raw = await res.json();

      // ✅ normalize ให้มี name
      const normalized = raw.map(m => ({
        sender: m.sender,
        text: m.text ?? "",
        kind: m.kind ?? "text",     // ✅ ใช้ค่า kind จาก backend
        url:  m.url ?? null,        // ✅ ใช้ค่า url จาก backend
        name: m.name ?? null,
      }));
  
      setSelected(prev => (
        prev && prev.id === chatId ? { ...prev, messages: normalized } : prev
      ));
    } catch (e) {
      console.error("Error loading messages:", e);
    }
  };

  // 3) เมื่อคลิกชื่อเพื่อนทางซ้าย → เลือกห้อง + โหลดข้อความ
  const handleSelectFriend = async (f) => {
    setSelected(f);
    localStorage.setItem("lastChatId", String(f.id)); // ✅ บันทึกห้องล่าสุด
    await loadMessages(f.id);
  };

  // 4) ส่งข้อความในห้องปัจจุบัน
  const handleSend = async (e) => {
    e.preventDefault();
    if (!selected || isSending) return;
  
    setIsSending(true);
    const text = message.trim();
  
    try {
      // 1) อัปโหลดไฟล์ก่อน (ถ้ามี)
      if (pendingFiles.length > 0) {
        const form = new FormData();
        pendingFiles.forEach(f => form.append("files", f));
  
        const res = await fetch(`${API_URL}/chats/${selected.id}/upload?me_id=${meId}`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error("upload failed");
  
        const data = await res.json(); // { attachments: [...] }
  
        const newMsgs = (data.attachments || []).map(a => ({
          sender: "me",
          kind: a.kind,
          url:  toAbs(a.url || a.path),
          name: a.name || null,
          text: a.name || "",        // ใช้ชื่อไฟล์เป็น label ภายใน bubble กรณีชนิด file
        }));
  
        // เติมข้อความไฟล์ลงห้องแชต
        setSelected(prev => prev ? { ...prev, messages: [...prev.messages, ...newMsgs] } : prev);
  
        // อัปเดต lastMessage ฝั่งซ้ายให้เป็นชนิดล่าสุด
        const first = (data.attachments || [])[0];
        const label =
          !first ? "" : first.kind === "image" ? "[image]"
               : first.kind === "video" ? "[video]"
               : (first.name || "[file]");
  
        setFriends(prev => prev.map(it =>
          it.id === selected.id ? { ...it, lastMessage: label } : it
        ));
      }
  
      // 2) ส่งข้อความตัวอักษรต่อ (ถ้ามี)
      if (text) {
        const res2 = await fetch(`${API_URL}/chats/${selected.id}/messages?me_id=${meId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ text }),
        });
        if (!res2.ok) throw new Error("send message failed");
        const saved = await res2.json();
  
        setSelected(prev => prev ? {
          ...prev,
          messages: [
            ...prev.messages,
            {
              sender: saved.sender ?? "me",
              text:   saved.text   ?? "",
              kind:   saved.kind   ?? "text",
              url:    saved.url ? toAbs(saved.url) : null,
            }
          ]
        } : prev);
  
        // อัปเดต lastMessage เป็นข้อความจริง ถ้ามี text
        setFriends(prev => prev.map(it =>
          it.id === selected.id ? { ...it, lastMessage: text } : it
        ));
      }
  
      // เลื่อนลงล่างสุดเสมอ (หลัง DOM อัปเดต)
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
  
    } catch (err) {
      console.error(err);
    } finally {
      // เคลียร์ทุกอย่างให้ชัวร์ ไม่ว่าจะแตกกิ่งไหน
      setMessage("");
      setPendingFiles([]);   // ✅ พรีวิวใต้ช่องพิมพ์จะหายแน่นอน
      setIsSending(false);
    }
  };

  // ถ้าต้องการสร้างห้องใหม่กับเพื่อน ( needเป็นเพื่อนสองทางแล้ว)
  // await fetch(`${API_URL}/chats/with/${otherUserId}?me_id=${meId}`, { method: "POST", headers: authHeaders });

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // อัปโหลดไฟล์ / รูป / วิดีโอ
  const handleUploadClick = (accept) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = accept; // "*/*" | "image/*" | "video/*"
    fileInputRef.current.click();
  };
    
  const onFilesSelected = (e) => {
    if (!selected) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
  
    // แค่เก็บไว้เพื่อพรีวิว ยังไม่อัปโหลด
    setPendingFiles(prev => [...prev, ...files]);
  
    // reset input ให้เลือกไฟล์เดิมซ้ำได้
    e.target.value = "";
  };

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-[28%] border-r flex flex-col">
        <div className="p-5 border-b flex-shrink-0 bg-white">
          <h2 className="text-xl font-semibold mb-3">Chat</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Find friend..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#e0ebe2] bg-white text-gray-700"
            />
          </div>
        </div>

        {/* รายชื่อเพื่อน */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
          {filteredFriends.map((f) => (
            <div
              key={f.id}
              onClick={() => handleSelectFriend(f)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                selected?.id === f.id ? "bg-[#e0ebe2]" : "hover:bg-gray-100"
              }`}
            >
              <img src={f.avatar} alt={f.name} className="w-12 h-12 rounded-full object-cover border" />
              {/* min-w-0 เพื่อให้ truncate ทำงานใน flex */}
              <div className="flex-1 min-w-0">
              {/* <p className="w-full font-semibold text-gray-800 leading-tight truncate">
                {f.name || ""}
              </p> */}
              <p className="font-semibold text-gray-800 truncate">{f.name}</p>
              {/* <p className="w-full text-sm text-gray-500 leading-tight truncate">
                {f.lastMessage || ""}
              </p> */}
              <p className="text-sm text-gray-500 truncate">{f.lastMessage}</p>
              </div>
            </div>
          ))}

          {filteredFriends.length === 0 && (
            <div className="text-sm text-gray-500 px-2">No chats yet.</div>
          )}
        </div>
      </div>

      {/* Chat Box */}
      <div className="flex-1 flex flex-col bg-white">
        {selected ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <img
                src={selected.avatar}
                alt={selected.name}
                className="w-10 h-10 rounded-full border"
              />
              <p className="text-lg font-semibold">{selected.name}</p>
            </div>

            {/* กล่องข้อความ */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
            {selected?.messages?.map((msg, i) => {
              const isMe = msg.sender === "me";
              const url  = toAbs(msg.url);

              return (
                <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`px-3 py-2 rounded-2xl max-w-[70%] ${isMe ? "bg-[#e0ebe2] text-gray-800" : "bg-gray-100 text-gray-800"} break-words whitespace-pre-wrap`}>
                    {msg.kind === "image" && url ? (
                      <img src={url} alt="" className="rounded-lg max-w-full" />
                    ) : msg.kind === "video" && url ? (
                      <video src={url} controls className="rounded-lg max-w-full" />
                    ) : msg.kind === "file" && url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="underline break-all">
                        📎 {msg.name || msg.url.split("/").pop() /* ✅ ใช้ name ก่อน */}
                      </a>
                    ) : (
                      // (renderMessageContent(msg) ?? "")
                      (msg.text ?? "")
                    )}
                  </div>
                </div>
              );
            })}

              {!selected && (
                <div className="text-sm text-gray-500">Select a chat to start messaging.</div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* พิมพ์ + แนบไฟล์ */}
            <form onSubmit={handleSend} className="border-t bg-white flex items-center gap-3 px-5 py-3 flex-shrink-0">
              {/* ปุ่มแนบไฟล์ 3 อัน Input file ซ่อน*/}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onFilesSelected}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUploadClick("*/*")}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <Paperclip size={20} className="text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUploadClick("image/*")}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <Image size={20} className="text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUploadClick("video/*")}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <Video size={20} className="text-gray-500" />
                </button>
              </div>

              {pendingFiles.length > 0 && (
              <div className="px-5 py-2 border-t bg-white flex flex-wrap gap-2">
                {pendingFiles.map((f, idx) => {
                  const url = URL.createObjectURL(f);
                  const isImg = f.type.startsWith("image/");
                  const isVideo = f.type.startsWith("video/");
                  return (
                    <div key={idx} className="flex items-center gap-2 border rounded-xl px-2 py-1">
                      {isImg ? (
                        <img src={url} alt={f.name} className="w-12 h-12 object-cover rounded" />
                      ) : isVideo ? (
                        <video src={url} className="w-16 h-12 rounded" muted />
                      ) : (
                        <span className="text-sm px-2 break-all max-w-[200px] truncate">{f.name}</span>
                      )}
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                      >
                        remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ช่องพิม text */}
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border rounded-full px-4 py-2.5 focus:ring-2 focus:ring-[#e0ebe2] outline-none"
              disabled={!selected}
            />

            {/* send buttom */}
            <button type="submit" className="p-2 bg-[#6dbf74] text-white rounded-full hover:bg-[#5aa862] transition" disabled={!selected}>
              <Send size={18} />
            </button>
          </form>
        </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging.
          </div>
        )}
      </div>
    </div>
  );
}