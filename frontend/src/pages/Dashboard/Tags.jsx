import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_URL = `${import.meta.env.VITE_API_URL}`;

export default function Tags() {
  const { t } = useTranslation();

  const [allTags, setAllTags] = useState([]);
  const [tags, setTags] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const PAGE_SIZE = 12;
  const navigate = useNavigate();

  const colors = ["#4b6043", "#75975e", "#95bb72", "#b3cf99", "#c7ddb5", "#ddead1"];

  // Load posts → extract hashtags
  useEffect(() => {
    const currentKey = localStorage.getItem("currentUserKey");
    const token = currentKey
      ? JSON.parse(localStorage.getItem(currentKey) || "{}")?.token
      : null;

    if (!token) {
      setError("Please log in to view tags.");
      return;
    }

    const fetchTags = async () => {
      try {
        const res = await fetch(`${API_URL}/posts/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();

        // Count hashtags
        const tagCount = {};
        data.forEach((post) => {
          const text = post.post_content || "";
          const tags = text.match(/#[A-Za-z0-9_ก-๙]+/g) || [];
          tags.forEach((t) => {
            const key = t.replace("#", "");
            tagCount[key] = (tagCount[key] || 0) + 1;
          });
        });

        const formatted = Object.entries(tagCount).map(([name, num]) => ({
          name,
          num,
        })).sort((a, b) => b.num - a.num);

        setAllTags(formatted);

        const others = formatted.slice(6);
        const initial = others.slice(0, PAGE_SIZE);

        setTags(initial);
        setOffset(initial.length);
        setHasMore(others.length > initial.length);

      } catch (err) {
        console.error(err);
        setError("Error loading tags.");
      }
    };

    fetchTags();
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    await new Promise((r) => setTimeout(r, 200));

    const others = allTags.slice(6);
    const next = others.slice(offset, offset + PAGE_SIZE);

    setTags((prev) => [...prev, ...next]);

    const newOffset = offset + next.length;
    setOffset(newOffset);
    setHasMore(others.length > newOffset);

    setLoadingMore(false);
  };

  if (error)
    return <div className="p-10 text-center text-red-500">{error}</div>;

  if (allTags.length === 0)
    return (
      <div className="p-10 text-center text-gray-500">
        {t("tagsPage.noTags")}
      </div>
    );

  const top6 = allTags.slice(0, 6);
  const others = allTags.slice(6);

  const handleTagClick = (tagName) => {
    navigate(`/app/tags/${encodeURIComponent(tagName)}`);
  };

  return (
    <div className="flex flex-row bg-[#f7f7f5] min-h-screen p-6">

      {/* Popular Tags */}
      <div className="w-3/4 h-[80vh] bg-[#fdfaf6] rounded-xl shadow-xl mt-4 p-6">
        <h1 className="text-2xl font-semibold mb-4">
          {t("tagsPage.popular6")}
        </h1>

        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            layout="vertical"
            data={top6.map((t, i) => ({ ...t, rank: i + 1 }))}
            margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <YAxis
              type="category"
              dataKey="name"
              tick={(props) => {
                const { x, y, payload } = props;
                const tag = payload.value;
                const rank = top6.findIndex((t) => t.name === tag) + 1;

                return (
                  <text
                    x={x - 10}
                    y={y + 5}
                    textAnchor="end"
                    fill="#374151"
                    fontWeight="500"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleTagClick(tag)}
                  >
                    {rank}. {tag}
                  </text>
                );
              }}
            />
            <XAxis type="number" />
            <Tooltip />
            <Bar dataKey="num" radius={[8, 8, 0, 0]}>
              {top6.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={colors[index % colors.length]}
                  cursor="pointer"
                  onClick={() => handleTagClick(entry.name)}
                  onMouseOver={(e) => (e.target.style.filter = "brightness(0.9)")}
                  onMouseOut={(e) => (e.target.style.filter = "none")}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Other Tags */}
      <div className="w-1/4 bg-[#fdfaf6] rounded-xl shadow-xl mt-4 ml-3">
        <h3 className="text-md font-semibold mt-3 mb-3 ml-4">
          {t("tagsPage.otherTags")}
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {tags.map((tag, idx) => (
            <div
              key={tag.name}
              className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 cursor-pointer transition"
              onClick={() => handleTagClick(tag.name)}
            >
              <span className="truncate block" title={tag.name}>
                {idx + 7}. {tag.name}
              </span>
              <span className="font-medium">{tag.num}</span>
            </div>
          ))}

          {others.length === 0 && (
            <div className="text-sm text-gray-500 px-4">
              {t("tagsPage.noOtherTags")}
            </div>
          )}
        </div>

        {/* Load more */}
        <div className="mt-4 flex justify-center">
          {hasMore ? (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-4 py-2 border mb-2 hover:bg-gray-200 rounded-lg"
            >
              {loadingMore ? t("tagsPage.loading") : t("tagsPage.loadMore")}
            </button>
          ) : (
            <div className="text-sm text-gray-500 mb-2">
              {t("tagsPage.noMore")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}