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

  // zoom image and show percent up video
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewer, setViewer] = useState({ open: false, url: "" });
  const makeId = (f) => `${f.name}-${f.size}-${f.lastModified}`;

  // show ... when mouth at message
  const [menuMsgId, setMenuMsgId] = useState(null);
  const menuRef = useRef(null);

  // Forward
  const [forward, setForward] = useState({ open: false, msg: null });
  const [forwardSearch, setForwardSearch] = useState("");
  const [forwardTargets, setForwardTargets] = useState(new Set()); // chat_id ที่เลือก 

  // ปิดเมนูเมื่อคลิกนอก/กด Esc
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuMsgId(null);
    };
    const onEsc = (e) => { if (e.key === "Escape") setMenuMsgId(null); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

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
        id: m.id,                      // ★ เก็บ id
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
      // 1) อัปโหลดไฟล์ก่อน (ถ้ามี) — ใช้ XHR เพื่อได้ onprogress
      if (pendingFiles.length > 0) {
        const form = new FormData();
        pendingFiles.forEach(p => form.append("files", p.file));

        setIsUploading(true);
        setUploadProgress(0);

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${API_URL}/chats/${selected.id}/upload?me_id=${meId}`);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);

              // เติมข้อความ (image/video/file) เข้าแชท
              const newMsgs = (data.attachments || []).map(a => ({
                id: `${data.message_id}:${a.id}`,      // ★ ให้ id เสถียร
                sender: "me",
                kind: a.kind,                            // image | video | file
                url:  toAbs(a.url || a.path),
                name: a.name || "",
                text: a.kind === "file" ? (a.name || "") : "",
              }));
              setSelected(prev => prev ? { ...prev, messages: [...prev.messages, ...newMsgs] } : prev);

              // อัปเดต lastMessage ฝั่งซ้ายเป็นชนิดล่าสุด
              const first = (data.attachments || [])[0];
              const label = !first ? "" :
                first.kind === "image" ? "[image]" :
                first.kind === "video" ? "[video]" :
                (first.name || "[file]");
              setFriends(prev => prev.map(it =>
                it.id === selected.id ? { ...it, lastMessage: label } : it
              ));

              // ล้างพรีวิว + revoke URL
              setPendingFiles(prev => {
                prev.forEach(p => URL.revokeObjectURL(p.url));
                return [];
              });

              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(form);
        }).catch(err => {
          console.error(err);
          alert("Error upload file");
        }).finally(() => {
          setIsUploading(false);
          setUploadProgress(0);
        });
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
              id:   saved.id,                 // ★ ใช้ id ที่ backend ส่งคืน
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
  
    const previews = files.map(f => ({
      id: makeId(f),
      file: f,
      url: URL.createObjectURL(f),          // สร้างครั้งเดียว
      isImage: f.type.startsWith("image/"),
      isVideo: f.type.startsWith("video/"),
    }));
    setPendingFiles(prev => [...prev, ...previews]);
  
    e.target.value = "";
  };

  const handleDelete = async (msgId) => {
    if (!selected) return;
  
    // optimistic update
    const prevMsgs = selected.messages;
    setSelected(s => s ? {
      ...s,
      messages: s.messages.map(m =>
        m.id === msgId ? { ...m, kind: "deleted", text: "", url: null, name: "" } : m
      )
    } : s);
    
    const baseId = String(msgId).split(":")[0]; // ✅ เอาเฉพาะ message_id ก่อนหน้า :

    try {
      const res = await fetch(`${API_URL}/chats/${selected.id}/messages/${baseId}?me_id=${meId}`, {
        method: "DELETE",
        headers: { ...authHeaders },
      });
      if (!res.ok) throw new Error("delete failed");
    } catch (err) {
      console.error(err);
      // rollback
      setSelected(s => s ? { ...s, messages: prevMsgs } : s);
      alert("Error delete message");
    }
  };

  const toggleTarget = (chatId) => {
    setForwardTargets(prev => {
      const next = new Set(prev);
      next.has(chatId) ? next.delete(chatId) : next.add(chatId);
      return next;
    });
  };

  const forwardToTargets = async () => {
    if (!forward.msg || forwardTargets.size === 0) return;
  
    const [midStr, aidStr] = String(forward.msg.id).split(":");
    const mid = Number(midStr);
    const aid = aidStr ? Number(aidStr) : undefined;
  
    const targets = Array.from(forwardTargets);
  
    try {
      for (const targetId of targets) {
        const payload = { source_message_id: mid, prefix: "Forwarded" };
        if (aid) payload.attachment_id = aid;
  
        const res = await fetch(`${API_URL}/chats/${targetId}/forward?me_id=${meId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`forward failed (${targetId})`);
  
        const data = await res.json();
        // map เป็นโหนดแชตสำหรับแสดงทันที
        const mapped = (data.attachments?.length
          ? data.attachments.map(a => ({
              id: `${data.message_id}:${a.id}`,
              sender: "me",
              kind: a.kind,
              url: toAbs(a.url),
              name: a.name || "",
              text: a.kind === "file" ? (a.name || "") : "",
            }))
          : [{
              id: data.message_id,
              sender: "me",
              kind: "text",
              text: data.text || "Forwarded",
              url: null,
            }]
        );
  
        if (selected?.id === targetId) {
          setSelected(prev => prev ? { ...prev, messages: [...prev.messages, ...mapped] } : prev);
          requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
        }
  
        const label = mapped[0].kind === "image" ? "[image]"
                    : mapped[0].kind === "video" ? "[video]"
                    : mapped[0].kind === "file"  ? (mapped[0].name || "[file]")
                    : (mapped[0].text || "");
        setFriends(prev => prev.map(it => it.id === targetId ? { ...it, lastMessage: label } : it));
      }
  
      setForward({ open: false, msg: null });
      setForwardTargets(new Set());
    } catch (e) {
      console.error(e);
      alert("Forward message fail.");
    }
  };

  const uniqueFriends = filteredFriends.filter(
    (f, idx, arr) => idx === arr.findIndex(x => x.name === f.name) // หรือ x.username
  );

  const uniqueFriendsAll = React.useMemo(() => {
    const map = new Map(); // username -> friend(item ที่มี chat_id)
    for (const f of friends) {
      if (!map.has(f.username)) map.set(f.username, f);
    }
    return [...map.values()];
  }, [friends]);

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
          {uniqueFriendsAll
            .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
            .map(f => (
              <div
                key={f.id}
                onClick={() => handleSelectFriend(f)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selected?.id === f.id ? "bg-[#e0ebe2]" : "hover:bg-gray-100"
                }`}
              >
                <img src={f.avatar} alt={f.name} className="w-12 h-12 rounded-full object-cover border" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {f.name} 
                    <span className="ml-1 text-xs text-gray-500">@{f.username}</span>
                  </p>
                  <p className="text-sm text-gray-500 truncate">{f.lastMessage}</p>
                </div>
              </div>
            ))}

          {uniqueFriendsAll.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
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
                  <div
                    key={msg.id}                                  // ★ ใช้ key เสถียร
                    className={`relative group flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {/* ปุ่ม ⋯ */}
                    {msg.kind !== "deleted" && (
                      <button
                        type="button"
                        className={`absolute -top-2 ${isMe ? "-right-2" : "-left-2"} 
                                    opacity-0 group-hover:opacity-100 transition
                                    bg-white/90 hover:bg-white shadow rounded-full px-2 py-0.5 text-xs`}
                        onClick={(e) => { e.stopPropagation(); setMenuMsgId(msg.id); }}
                        aria-haspopup="menu"
                        aria-expanded={menuMsgId === msg.id}
                        title="Options"
                      >
                        ⋯
                      </button>
                    )}
              
                    {/* บับเบิลข้อความเดิมของคุณ */}
                    <div className={`px-3 py-2 rounded-2xl max-w-[70%] 
                                     ${isMe ? "bg-[#e0ebe2] text-gray-800" : "bg-gray-100 text-gray-800"} 
                                     break-words whitespace-pre-wrap`}>
                      {msg.kind === "deleted" ? (
                        <i className="text-gray-500 italic">The message already delete.</i>
                      ) : msg.kind === "image" && url ? (
                        <img src={url} alt="" className="rounded-lg max-w-full cursor-zoom-in"
                             onClick={() => setViewer({ open: true, url })}/>
                      ) : msg.kind === "video" && url ? (
                        <video src={url} controls className="rounded-lg max-w-full" />
                      ) : msg.kind === "file" && url ? (
                        <a href={url} target="_blank" rel="noreferrer" className="underline break-all">
                          📎 {msg.name || url.split("/").pop()}
                        </a>
                      ) : (
                        (msg.text ?? "")
                      )}
                    </div>
              
                    {/* เมนูแบบลอย (แสดงเมื่อ msg นี้ถูกเลือก) */}
                    {menuMsgId === msg.id && (
                      <div
                        ref={menuRef}
                        role="menu"
                        className={`absolute z-20 mt-6 ${isMe ? "right-0" : "left-0"}
                                  w-40 rounded-xl border bg-white shadow-lg overflow-hidden`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Delete: เฉพาะของเรา */}
                        {isMe && (
                          <button
                            className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
                            onClick={() => { setMenuMsgId(null); handleDelete(msg.id); }}
                            role="menuitem"
                          >
                            Delete message
                          </button>
                        )}

                        {/* Forward: ใช้ได้ทั้งของเราและของอีกฝ่าย */}
                        <button
                          className="w-full px-3 py-2 text-left hover:bg-gray-50"
                          onClick={() => {
                            setMenuMsgId(null);
                            setForward({ open: true, msg: msg });   // เปิดโมดัล + เก็บข้อความที่จะส่งต่อ
                          }}
                          role="menuitem"
                        >
                          Forward message
                        </button>

                        {/* Copy */}
                        {msg.kind === "text" && msg.text && (
                          <button
                            className="w-full px-3 py-2 text-left hover:bg-gray-50"
                            onClick={() => { navigator.clipboard.writeText(msg.text); setMenuMsgId(null); }}
                          >
                            Copy message
                          </button>
                        )}
                        {/* Download */}
                        {["image","video","file"].includes(msg.kind) && msg.url && (
                          <a
                            className="block px-3 py-2 hover:bg-gray-50"
                            href={toAbs(msg.url)}
                            download
                            onClick={() => setMenuMsgId(null)}
                          >
                            Download file
                          </a>
                        )}
                      </div>
                    )}
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
                {pendingFiles.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 border rounded-xl px-2 py-1">
                    {p.isImage && (
                      <img src={p.url} alt={p.file.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    {p.isVideo && (
                      <video
                        src={p.url}
                        className="w-16 h-12 rounded bg-gray-100"
                        preload="metadata"
                        muted
                        playsInline
                      />
                    )}
                    {!p.isImage && !p.isVideo && (
                      <span className="text-sm px-2 break-all max-w-[200px] truncate">{p.file.name}</span>
                    )}
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() => {
                        URL.revokeObjectURL(p.url);
                        setPendingFiles(prev => prev.filter(x => x.id !== p.id));
                      }}
                    >
                      remove
                    </button>
                  </div>
                ))}

                {/* แถบสถานะอัปโหลด (จะเห็นชัดตอนวิดีโอใหญ่) */}
                {isUploading && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                    <div className="h-2 w-48 bg-gray-200 rounded overflow-hidden">
                      <div className="h-2 bg-green-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span>{uploadProgress}%</span>
                  </div>
                )}
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
            <button type="submit" 
              className="p-2 bg-[#6dbf74] text-white rounded-full hover:bg-[#5aa862] transition" 
              disabled={!selected || isUploading || isSending}
            >
              <Send size={18} />
            </button>
          </form>
        </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging.
          </div>
        )}

        {viewer.open && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={() => setViewer({ open: false, url: "" })}
            role="button"
            aria-label="Close image viewer"
          >
            <img
              src={viewer.url}
              alt=""
              className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain"
            />
          </div>
        )}

        {forward.open && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => { setForward({ open:false, msg:null }); setForwardTargets(new Set()); }}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}>
              {/* Header แสดงผู้ส่งต้นทาง */}
              {/* <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="font-semibold">
                  Forward <span className="text-[#6dbf74]">{selected?.name}</span>
                </div>
                <button onClick={() => { setForward({ open:false, msg:null }); setForwardTargets(new Set()); }}
                        className="text-gray-500 hover:text-black">✕</button>
              </div> */}

              {/* กล่องค้นหา */}
              <div className="px-5 py-3">
                <input
                  value={forwardSearch}
                  onChange={(e) => setForwardSearch(e.target.value)}
                  placeholder="Find friend…"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* รายชื่อเพื่อน (ห้องแชต) ให้เลือกหลายอันได้ */}
              <div className="px-5 pb-4 max-h-[50vh] overflow-y-auto space-y-2">
                {uniqueFriendsAll
                  .filter(f => f.name.toLowerCase().includes(forwardSearch.toLowerCase()))
                  .map(f => (
                    <label key={f.id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forwardTargets.has(f.id)}
                        onChange={() => toggleTarget(f.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <img src={f.avatar} alt={f.name} className="w-8 h-8 rounded-full border object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {f.name} 
                          <span className="ml-1 text-xs text-gray-500">@{f.username}</span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">{f.lastMessage}</div>
                      </div>
                    </label>
                  ))}

                {uniqueFriendsAll.filter(f => f.name.toLowerCase().includes(forwardSearch.toLowerCase())).length === 0 && (
                  <div className="text-sm text-gray-500 px-1 py-2">Not found this user name</div>
                )}
              </div>

              {/* แถบกดส่ง */}
              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <button className="px-4 py-2 rounded-lg border"
                        onClick={() => { setForward({ open:false, msg:null }); setForwardTargets(new Set()); }}>
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-lg bg-[#6dbf74] text-white disabled:opacity-50"
                        disabled={forwardTargets.size === 0}
                        onClick={forwardToTargets}>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}