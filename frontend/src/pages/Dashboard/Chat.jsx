import { useState } from "react";
import { Search, Send, Image, Paperclip, Video } from "lucide-react"; 

export default function Chat() {
  const userProfiles = {
    aong: "/images/Watcharapat.jpg",
    Skibidi: "/images/Patthiaon.jpg",
    Rose: "/images/Karnpon.jpg",
    Dog: "/images/Khittitaj.jpg",
  };

  const mutualFriends = [
    {
      id: 1,
      name: "Focus",
      username: "Focus12345",
      avatar: userProfiles.aong,
      lastMessage: "Typing...",
      messages: [
        { sender: "Focus", text: "Hiiiii, what your name" },
        { sender: "me", text: "Hi 👋 I'm Killua. What you" },
        { sender: "Focus", text: "I'm Focus" },
      ],
    },
    {
      id: 2,
      name: "Skibidi",
      username: "Skibidy",
      avatar: userProfiles.Skibidi,
      lastMessage: "Around 11 a.m.",
      messages: [
        { sender: "Skibidi", text: "Yo Killua!" },
        { sender: "me", text: "What's up bro 😎" },
      ],
    },
    {
      id: 3,
      name: "Rose",
      username: "RoseAisp",
      avatar: userProfiles.Rose,
      lastMessage: "tmr you will come to...",
      messages: [
        { sender: "Rose", text: "Tomorrow you will come to KU?" },
        { sender: "me", text: "Yes sure 💚" },
      ],
    },
    {
      id: 4,
      name: "Dog",
      username: "DogDogbodbod34",
      avatar: userProfiles.Dog,
      lastMessage: "Do you know...",
      messages: [
        { sender: "Dog", text: "Do you know Pikachu?" },
        { sender: "me", text: "Of course I do 😂" },
      ],
    },
  ];

  const [friends] = useState(mutualFriends);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(mutualFriends[0]);
  const [message, setMessage] = useState("");

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() === "") return;
    const newMsg = { sender: "me", text: message.trim() };
    setSelected((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));
    setMessage("");
  };

  // handle uploads
  const handleUpload = (type) => {
    alert(`Upload ${type} feature coming soon!`);
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

        {/* รายชื่อเพื่อน (scroll ได้เอง) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
          {filteredFriends.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelected(f)}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                selected?.id === f.id ? "bg-[#e0ebe2]" : "hover:bg-gray-100"
              }`}
            >
              <img
                src={f.avatar}
                alt={f.name}
                className="w-12 h-12 rounded-full object-cover border"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{f.name}</p>
                <p className="text-sm text-gray-500 truncate">{f.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Box */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3 flex-shrink-0">
          <img
            src={selected.avatar}
            alt={selected.name}
            className="w-10 h-10 rounded-full border"
          />
          <p className="text-lg font-semibold">{selected.name}</p>
        </div>

        {/* กล่องข้อความ (scroll ได้เฉพาะนี้) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
          {selected.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.sender === "me" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                  msg.sender === "me"
                    ? "bg-[#e0ebe2] text-gray-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* ช่องพิมพ์ + ปุ่มแนบไฟล์ */}
        <form
          onSubmit={handleSend}
          className="border-t bg-white flex items-center gap-3 px-5 py-3 flex-shrink-0"
        >
          {/* ปุ่มแนบไฟล์ 3 อัน */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleUpload("File")}
              className="p-2 rounded-full hover:bg-gray-100 transition"
              title="Add File"
            >
              <Paperclip size={20} className="text-gray-500" />
            </button>
            <button
              type="button"
              onClick={() => handleUpload("Image")}
              className="p-2 rounded-full hover:bg-gray-100 transition"
              title="Add Image"
            >
              <Image size={20} className="text-gray-500" />
            </button>
            <button
              type="button"
              onClick={() => handleUpload("Video")}
              className="p-2 rounded-full hover:bg-gray-100 transition"
              title="Add Video"
            >
              <Video size={20} className="text-gray-500" />
            </button>
          </div>

          {/* ช่องพิมพ์ข้อความ */}
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border rounded-full px-4 py-2.5 focus:ring-2 focus:ring-[#e0ebe2] outline-none"
          />

          {/* ปุ่มส่งข้อความ */}
          <button
            type="submit"
            className="p-2 bg-[#6dbf74] text-white rounded-full hover:bg-[#5aa862] transition"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}