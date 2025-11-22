import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { Search, Send, Image, Paperclip, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

const API_URL = "http://localhost:8000";
const toAbs = (u) => (u?.startsWith?.("http") ? u : `${API_URL}${u || ""}`);

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  }); // 20:29
};

// Function for converting years
const getYearInLocalLanguage = (year, lang) => {
  if (lang === "th") {
    return year + 543; // If it's in Thai, it will show the year B.E.
  }
  return year; // If it is not in Thai, show the year AD.
};

export default function Chat() {
  const { t, i18n } = useTranslation();  // Use i18next
  // auth
  const { meId, token } = useMemo(() => {
    const currentKey = localStorage.getItem("currentUserKey");
    const auth = currentKey ? JSON.parse(localStorage.getItem(currentKey) || "{}") : {};
    return { meId: auth?.uid || 1, token: auth?.token || null };
  }, []);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // state
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // per-message menu + viewer
  const [menuMsgId, setMenuMsgId] = useState(null);
  const menuRef = useRef(null);
  const [viewer, setViewer] = useState({ open: false, url: "" });

  // forward modal
  const [forward, setForward] = useState({ open: false, msg: null });
  const [forwardSearch, setForwardSearch] = useState("");
  const [forwardTargets, setForwardTargets] = useState(new Set());

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);           // WebSocket ref

  const makeId = (f) => `${f.name}-${f.size}-${f.lastModified}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

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

  // messages loader
  const loadMessages = async (chatId) => {
    const res = await fetch(`${API_URL}/chats/${chatId}/messages?me_id=${meId}`, {
      headers: { ...authHeaders },
    });
    if (!res.ok) throw new Error("load messages failed");
    const raw = await res.json();
    const normalized = raw.map((m) => ({
      id: m.id,
      sender: m.sender,
      text: m.text ?? "",
      kind: m.kind ?? "text",
      url: m.url ?? null,
      name: m.name ?? null,
      createdAt: m.created_at ?? null, //time the message send
    }));
    setSelected((prev) =>
      prev && prev.id === chatId ? { ...prev, messages: normalized } : prev
    );
  };

  // chat list loader
  const loadChats = async () => {
    const res = await fetch(`${API_URL}/chats?me_id=${meId}`, {
      headers: { ...authHeaders },
    });
    if (!res.ok) throw new Error("load chats failed");
    const list = await res.json();

    const mapped = list.map((c) => ({
      id: c.id,
      name: c.name,
      username: c.username,
      avatar: toAbs(c.avatar || "/images/default.jpg"),
      lastMessage: c.lastMessage || "",
      lastTs: c.last_ts ? new Date(c.last_ts).getTime() : 0,
      unread: c.unread || 0,
      messages: [],
    }));

    setFriends(mapped);
    const lastId = Number(localStorage.getItem("lastChatId") || 0);
    const initial = mapped.find((x) => x.id === lastId) || mapped[0];
    if (initial) {
      setSelected((prev) =>
        prev && prev.id === initial.id ? prev : initial
      );
      await loadMessages(initial.id);
    }
  };

  // Load chat list for the first time
  useEffect(() => {
    if (!meId) return;
    loadChats().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId, token]);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [selected?.id, selected?.messages?.length]);

  // unique by username (prevent duplicate friend lists from having the same name)
  const uniqueFriendsAll = React.useMemo(() => {
    const map = new Map(); // username -> item
    for (const f of friends) if (!map.has(f.username)) map.set(f.username, f);
    return [...map.values()];
  }, [friends]);

  // WebSocket for real-time
  useEffect(() => {
    if (!meId) return;

    const wsUrl = API_URL.replace("http", "ws") + `/chats/ws/${meId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Chat WS connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WS event:", data);

        if (data.type === "new_message") {
          const chatId = data.chat_id;

          // 1) Update room list + preview + unread
          loadChats().catch(console.error);

          // 2) If we are opening this room → load messages for you
          loadMessages(chatId).catch(console.error);
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    ws.onclose = () => {
      console.log("Chat WS closed");
    };

    ws.onerror = (e) => {
      console.error("Chat WS error", e);
    };

    return () => {
      ws.close();
    };
  }, [meId]);

  const handleSelectFriend = async (f) => {
    setSelected(f);
    localStorage.setItem("lastChatId", String(f.id));
    await loadMessages(f.id);

    // mark as read at backend
    await fetch(`${API_URL}/chats/${f.id}/read?me_id=${meId}`, {
      method: "POST",
      headers: { ...authHeaders },
    });

    // Clear unread in frontend immediately
    setFriends((prev) =>
      prev.map((c) => (c.id === f.id ? { ...c, unread: 0 } : c))
    );
  };

  // upload helpers
  const handleUploadClick = (accept) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
  };

  const onFilesSelected = (e) => {
    if (!selected) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const previews = files.map((f) => ({
      id: makeId(f),
      file: f,
      url: URL.createObjectURL(f),
      isImage: f.type.startsWith("image/"),
      isVideo: f.type.startsWith("video/"),
    }));
    setPendingFiles((prev) => [...prev, ...previews]);
    e.target.value = "";
  };

  // delete
  const handleDelete = async (msgId) => {
    if (!selected) return;
    const prevMsgs = selected.messages;
    setSelected((s) =>
      s
        ? {
            ...s,
            messages: s.messages.map((m) =>
              m.id === msgId
                ? { ...m, kind: "deleted", text: "", url: null, name: "" }
                : m
            ),
          }
        : s
    );

    const baseId = String(msgId).split(":")[0];
    try {
      const res = await fetch(
        `${API_URL}/chats/${selected.id}/messages/${baseId}?me_id=${meId}`,
        {
          method: "DELETE",
          headers: { ...authHeaders },
        }
      );
      if (!res.ok) throw new Error("delete failed");

      // If the deleted message is the “most recent in the room” → Update the preview on the left.
      const lastMsg = prevMsgs[prevMsgs.length - 1];
      const isDeletingLast =
        lastMsg && String(lastMsg.id).split(":")[0] === String(baseId);

      if (isDeletingLast) {
        setFriends((prev) =>
          prev.map((it) =>
            it.id === selected.id ? { ...it, lastMessage: "" } : it
          )
        );
      }
    } catch (err) {
      console.error(err);
      setSelected((s) => (s ? { ...s, messages: prevMsgs } : s));
      alert("Error delete message");
    }
  };

  // forward
  const toggleTarget = (chatId) => {
    setForwardTargets((prev) => {
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
        const payload = { source_message_id: mid };
        if (aid) payload.attachment_id = aid;

        const res = await fetch(
          `${API_URL}/chats/${targetId}/forward?me_id=${meId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) throw new Error(`forward failed (${targetId})`);
        const data = await res.json();

        const mapped =
          data.attachments?.length
            ? data.attachments.map((a) => ({
                id: `${data.message_id}:${a.id}`,
                sender: "me",
                kind: a.kind,
                url: toAbs(a.url),
                name: a.name || "",
                text: a.kind === "file" ? a.name || "" : "",
              }))
            : [
                {
                  id: data.message_id,
                  sender: "me",
                  kind: "text",
                  text: data.text || "Forwarded",
                  url: null,
                },
              ];

        if (selected?.id === targetId) {
          setSelected((prev) =>
            prev
              ? { ...prev, messages: [...prev.messages, ...mapped] }
              : prev
          );
          requestAnimationFrame(() =>
            messagesEndRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            })
          );
        }

        const label =
          mapped[0].kind === "image"
            ? "[image]"
            : mapped[0].kind === "video"
            ? "[video]"
            : mapped[0].kind === "file"
            ? mapped[0].name || "[file]"
            : mapped[0].text || "";
        setFriends((prev) =>
          prev.map((it) =>
            it.id === targetId ? { ...it, lastMessage: label } : it
          )
        );
      }

      setForward({ open: false, msg: null });
      setForwardTargets(new Set());
    } catch (e) {
      console.error(e);
      alert("Forward message fail.");
    }
  };

  // send (upload first, then text)
  const handleSend = async (e) => {
    e.preventDefault();
    if (!selected || isSending) return;
    setIsSending(true);
    const text = message.trim();

    try {
      if (pendingFiles.length > 0) {
        const form = new FormData();
        pendingFiles.forEach((p) => form.append("files", p.file));
        setIsUploading(true);
        setUploadProgress(0);

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            `${API_URL}/chats/${selected.id}/upload?me_id=${meId}`
          );
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              const nowIso = new Date().toISOString(); // time that send message
              const newMsgs = (data.attachments || []).map((a) => ({
                id: `${data.message_id}:${a.id}`,
                sender: "me",
                kind: a.kind,
                url: toAbs(a.url || a.path),
                name: a.name || "",
                text: a.kind === "file" ? a.name || "" : "",
                createdAt: nowIso,
              }));
              setSelected((prev) =>
                prev
                  ? { ...prev, messages: [...prev.messages, ...newMsgs] }
                  : prev
              );
              const first = (data.attachments || [])[0];
              const label = !first
                ? ""
                : first.kind === "image"
                ? "[image]"
                : first.kind === "video"
                ? "[video]"
                : first.name || "[file]";
                setFriends((prev) =>
                  prev.map((it) =>
                    it.id === selected.id
                      ? { ...it, lastMessage: label, lastTs: Date.now() }
                      : it
                  )
              );
              setPendingFiles((prev) => {
                prev.forEach((p) => URL.revokeObjectURL(p.url));
                return [];
              });
              resolve();
            } else reject(new Error("Upload failed"));
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(form);
        })
          .catch(console.error)
          .finally(() => {
            setIsUploading(false);
            setUploadProgress(0);
          });
      }

      if (text) {
        const res2 = await fetch(
          `${API_URL}/chats/${selected.id}/messages?me_id=${meId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify({ text }),
          }
        );
        if (!res2.ok) throw new Error("send message failed");
        const saved = await res2.json();
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                messages: [
                  ...prev.messages,
                  {
                    id: saved.id,
                    sender: saved.sender ?? "me",
                    text: saved.text ?? "",
                    kind: saved.kind ?? "text",
                    url: saved.url ? toAbs(saved.url) : null,
                    createdAt: saved.created_at || new Date().toISOString(),
                  },
                ],
              }
            : prev
        );
        setFriends((prev) =>
          prev.map((it) =>
            it.id === selected.id
              ? { ...it, lastMessage: text, lastTs: Date.now() }
              : it
          )
        );
      }

      requestAnimationFrame(() =>
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        })
      );
    } finally {
      setMessage("");
      setPendingFiles([]);
      setIsSending(false);
    }
  };

  // Function to display the year as B.E. or A.D.
  const formatYear = (isoDate) => {
    const d = new Date(isoDate);
    const year = d.getFullYear();
    return getYearInLocalLanguage(year, i18n.language);  // Convert year to selected language
  };

  // Adjust the formatDate usage to display only the date (not the year).
  const formatDateWithoutYear = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-[28%] border-r flex flex-col">
        <div className="p-5 border-b bg-white">
          <h2 className="text-xl font-semibold mb-3">{t('sidebar.chat')}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('chat.findFriend')}  // Translate text from JSON
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#e0ebe2] bg-white text-gray-700"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
          {uniqueFriendsAll
            .slice()
            .sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0))
            .filter((f) =>
              f.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((f) => (
              <div
                key={f.id}
                onClick={() => handleSelectFriend(f)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selected?.id === f.id ? "bg-[#e0ebe2]" : "hover:bg-gray-100"
                }`}
              >
                {/* avatar + badge */}
                <div className="relative">
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                  {f.unread > 0 && (
                    <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold">
                      {f.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {f.name}
                    <span className="ml-1 text-xs text-gray-500">
                      @{f.username}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {f.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          {uniqueFriendsAll.filter((f) =>
            f.name.toLowerCase().includes(search.toLowerCase())
          ).length === 0 && (
            <div className="text-sm text-gray-500 px-2">{t('chat.noChats')}</div>
          )}
        </div>
      </div>

      {/* Chat box */}
      <div className="flex-1 flex flex-col bg-white">
        {selected ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <img
                src={selected.avatar}
                alt={selected.name}
                className="w-10 h-10 rounded-full border"
              />
              <p className="text-lg font-semibold">{selected.name}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
              {(() => {
                let lastDate = null; // Use it to remember what the latest date is.

                return selected?.messages?.map((msg) => {
                  const isMe = msg.sender === "me";
                  const url = toAbs(msg.url);

                  // Function used to display information in chat
                  const formattedYear = getYearInLocalLanguage(new Date(msg.createdAt).getFullYear(), i18n.language); // แปลงปี

                  // Use createdAt from the frontend (required for each message)
                  const dateLabel = msg.createdAt ? formatDateWithoutYear(msg.createdAt) : ""; // Show only the date, no year
                  const timeLabel = msg.createdAt ? formatTime(msg.createdAt) : "";
                  const dateKey = dateLabel;  // show onlt day

                  const showDateHeader = dateKey && dateKey !== lastDate;
                  if (showDateHeader) {
                    lastDate = dateKey;
                  }

                  return (
                    <React.Fragment key={msg.id}>
                      {/* The header displays the date once per day. */}
                      {showDateHeader && (
                        <div className="text-center text-xs text-gray-400 my-2">
                          {dateLabel}/{formattedYear}{/* Show day/month/year */}
                        </div>
                      )}

                      <div
                        className={`relative group flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        {/* ⋯ menu button */}
                        {msg.kind !== "deleted" && (
                          <button
                            type="button"
                            className={`absolute -top-2 ${
                              isMe ? "-right-2" : "-left-2"
                            } opacity-0 group-hover:opacity-100 transition bg-white/90 hover:bg-white shadow rounded-full px-2 py-0.5 text-xs`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuMsgId(msg.id);
                            }}
                            aria-haspopup="menu"
                            aria-expanded={menuMsgId === msg.id}
                            title="Options"
                          >
                            ⋯
                          </button>
                        )}

                        {/* bubble + time under bubble */}
                        <div className="max-w-[70%] flex flex-col items-end">
                          <div
                            className={`px-3 py-2 rounded-2xl w-full ${
                              isMe
                                ? "bg-[#e0ebe2] text-gray-800"
                                : "bg-gray-100 text-gray-800"
                            } break-words whitespace-pre-wrap`}
                          >
                            {msg.kind === "deleted" ? (
                              <i className="text-gray-500 italic">
                                {t('chat.deleteMessage')}
                              </i>
                            ) : msg.kind === "image" && url ? (
                              <img
                                src={url}
                                alt=""
                                className="rounded-lg max-w-full cursor-zoom-in"
                                onClick={() => setViewer({ open: true, url })}
                              />
                            ) : msg.kind === "video" && url ? (
                              <video
                                src={url}
                                controls
                                className="rounded-lg max-w-full"
                              />
                            ) : msg.kind === "file" && url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline break-all"
                              >
                                📎 {msg.name || url.split("/").pop()}
                              </a>
                            ) : (
                              msg.text ?? ""
                            )}
                          </div>

                          {/* Time under text */}
                          {timeLabel && (
                            <div className="mt-1 text-[10px] text-gray-400">
                              {timeLabel}
                            </div>
                          )}
                        </div>

                        {/* floating menu */}
                        {menuMsgId === msg.id && (
                          <div
                            ref={menuRef}
                            role="menu"
                            className={`absolute z-20 mt-6 ${
                              isMe ? "right-0" : "left-0"
                            } w-40 rounded-xl border bg-white shadow-lg overflow-hidden`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* delete (only mine) */}
                            {isMe && (
                              <button
                                className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setMenuMsgId(null);
                                  handleDelete(msg.id);
                                }}
                                role="menuitem"
                              >
                                {t('chat.deleteMessage')}
                              </button>
                            )}

                            {/* forward */}
                            <button
                              className="w-full px-3 py-2 text-left hover:bg-gray-50"
                              onClick={() => {
                                setMenuMsgId(null);
                                setForward({ open: true, msg });
                              }}
                              role="menuitem"
                            >
                              {t('chat.forwardMessage')}
                            </button>

                            {/* copy (text only) */}
                            {msg.kind === "text" && msg.text && (
                              <button
                                className="w-full px-3 py-2 text-left hover:bg-gray-50"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.text);
                                  setMenuMsgId(null);
                                }}
                              >
                                {t('chat.copyMessage')}
                              </button>
                            )}

                            {/* download (attachments only) */}
                            {["image", "video", "file"].includes(msg.kind) && msg.url && (
                              <a
                                className="block px-3 py-2 hover:bg-gray-50"
                                href={toAbs(msg.url)}
                                download
                                onClick={() => setMenuMsgId(null)}
                              >
                                {t('chat.downloadFile')}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                });
              })()}
              <div ref={messagesEndRef} />
            </div>

            {/* composer */}
            <form
              onSubmit={handleSend}
              className="border-t bg-white flex items-center gap-3 px-5 py-3 flex-shrink-0"
            >
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

              {/* previews + progress */}
              {pendingFiles.length > 0 && (
                <div className="max-w-xs">
                  <div className="px-3 py-1 flex flex-wrap gap-2 items-start">
                    {pendingFiles.map((p) => (
                      <div
                        key={p.id}
                        className="border rounded-xl px-2 py-2 flex flex-col gap-1 max-w-[190px] bg-white"
                      >
                        {/* Top row: Photo/Video/Filename */}
                        <div className="flex items-center gap-2">
                          {p.isImage ? (
                            <img
                              src={p.url}
                              alt={p.file.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : p.isVideo ? (
                            <video
                              src={p.url}
                              className="w-12 h-10 rounded bg-gray-100"
                              preload="metadata"
                              muted
                              playsInline
                            />
                          ) : (
                            <span className="text-xs px-2 break-words max-w-[130px]">
                              {p.file.name}
                            </span>
                          )}
                        </div>

                        {/* Bottom row: The remove button is always in the frame. */}
                        <button
                          type="button"
                          className="self-end text-[11px] text-red-600"
                          onClick={() => {
                            URL.revokeObjectURL(p.url);
                            setPendingFiles((prev) =>
                              prev.filter((x) => x.id !== p.id)
                            );
                          }}
                        >
                          {t('chat.remove')}
                        </button>
                      </div>
                    ))}
                    {isUploading && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="h-2 w-40 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-2 bg-green-500 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span>{uploadProgress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder={t('chat.typeMessage')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 border rounded-full px-4 py-2.5 focus:ring-2 focus:ring-[#e0ebe2] outline-none"
                disabled={!selected}
              />

              <button
                type="submit"
                className="p-2 bg-[#6dbf74] text-white rounded-full hover:bg-[#5aa862] transition"
                disabled={!selected || isUploading || isSending}
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            {t('chat.selectChat')}
          </div>
        )}

        {/* image viewer */}
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

        {/* forward modal */}
        {forward.open && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => {
              setForward({ open: false, msg: null });
              setForwardTargets(new Set());
            }}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="font-semibold">{t('chat.selectChat')}</div>
                <button
                  onClick={() => {
                    setForward({ open: false, msg: null });
                    setForwardTargets(new Set());
                  }}
                  className="text-gray-500 hover:text-black"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 py-3">
                <input
                  value={forwardSearch}
                  onChange={(e) => setForwardSearch(e.target.value)}
                  placeholder="Find friend…"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="px-5 pb-4 max-h-[50vh] overflow-y-auto space-y-2">
                {uniqueFriendsAll
                  .filter((f) =>
                    f.name.toLowerCase().includes(forwardSearch.toLowerCase())
                  )
                  .map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={forwardTargets.has(f.id)}
                        onChange={() => toggleTarget(f.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <img
                        src={f.avatar}
                        alt={f.name}
                        className="w-8 h-8 rounded-full border object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {f.name}
                          <span className="ml-1 text-xs text-gray-500">
                            @{f.username}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {f.lastMessage}
                        </div>
                      </div>
                    </label>
                  ))}
                {uniqueFriendsAll.filter((f) =>
                  f.name.toLowerCase().includes(forwardSearch.toLowerCase())
                ).length === 0 && (
                  <div className="text-sm text-gray-500 px-1 py-2">
                    {t('chat.notFoundUserName')}
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => {
                    setForward({ open: false, msg: null });
                    setForwardTargets(new Set());
                  }}
                >
                  {t('chat.cancel')}
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-[#6dbf74] text-white disabled:opacity-50"
                  disabled={forwardTargets.size === 0}
                  onClick={forwardToTargets}
                >
                  {t('chat.send')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
