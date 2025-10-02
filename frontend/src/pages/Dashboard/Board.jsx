import { useState } from "react";

const initialPosts = [
  { id: 1, user: "aong", text: "Has anyone ever taken the ISP course?", minutes: 10, likes: 48, comments: 2 },
  { id: 2, user: "Skibidi", text: "Yes, I've taken the ISP course before.", minutes: 2, likes: 9, comments: 0 },
  { id: 3, user: "Pysart", text: "Share the summary file for English 2, course code 01355102-64", minutes: 32, likes: 102, comments: 0 },
  { id: 4, user: "Dog", text: "Is anyone taking Physics Lab 450? I’m looking for a study buddy.", minutes: 60, likes: 14, comments: 1 },
  { id: 5, user: "Rose", text: "Yes, I’m taking it! Let’s be friends. Just DM me.", minutes: 45, likes: 6, comments: 0 },
];

export default function Board() {
  const [posts, setPosts] = useState(initialPosts);

  const handleLike = (id) => {
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleComment = (id) => {
    setPosts(posts.map(p => p.id === id ? { ...p, comments: p.comments + 1 } : p));
  };

  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <div key={p.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{p.user}</span>
            <span>• post {p.minutes} minute ago…</span>
          </div>
          <p className="mt-2 text-slate-800">{p.text}</p>
          <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
            <button
              onClick={() => handleLike(p.id)}
              className="flex items-center gap-1 hover:text-red-600"
            >
              ❤️ {p.likes}
            </button>
            <button
              onClick={() => handleComment(p.id)}
              className="flex items-center gap-1 hover:text-blue-600"
            >
              💬 {p.comments}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}