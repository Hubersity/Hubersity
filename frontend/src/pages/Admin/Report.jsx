import React, { useState, useEffect} from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const InfoPost = ({ post }) => {
    if (!post) return null;
    const rawId = String(post.Post_ID || "");
    const idForUrl = rawId.replace("#", "");
    return (
      <div className="flex items-center py-3 border-b hover:bg-gray-50 text-gray-700">
        <Link to={`/app_admin/report/${idForUrl}`} className="text-green-700 hover:underline w-[10vw] ml-[2vw]">
          {rawId || "-"}
        </Link>
        <span className="w-[15vh] ml-[6vw]">{post.NumberOfReports ?? "-"}</span>
        <span className="w-[10vh] ml-[6vw]">{post.PopularReasons ?? "-"}</span>
        <span className="w-[8vh] ml-[11vw] whitespace-nowrap">{post.LastDate ?? "-"}</span>
        <span className="w-[8vh] ml-[11.5vw]">{post.Action ? post.Action : "-"}</span>
        <span className={`w-[8vh] ml-[5vw] flex items-center justify-center text-sm px-2 py-1 rounded-full ${post.status === "Pending" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {post.status ?? "Pending"}
        </span>
      </div>
    );
  };


// component for user row
const InfoUser = ({ user }) => {
    if (!user) return null;
    return (
      <div className="flex items-center py-3 border-b hover:bg-gray-50 text-gray-700">
        <Link to={`/app_admin/report/user/${encodeURIComponent(user.UserName || "")}`} className="text-green-700 hover:underline w-[10vw] ml-[2vw]">
          {user.UserName || "-"}
        </Link>
        <span className="w-[15vh] ml-[6vw]">{user.NumberOfReports ?? "-"}</span>
        <span className="w-[10vh] ml-[6vw]">{user.PopularReasons ?? "-"}</span>
        <span className="w-[8vh] ml-[11vw] whitespace-nowrap">{user.LastDate ?? "-"}</span>
        <span className="w-[8vh] ml-[11vw]">{user.Action ? user.Action : "-"}</span>
        <span className={`w-[8vh] ml-[5vw] flex items-center justify-center text-sm px-2 py-1 rounded-full ${user.status === "Banned" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {user.status ?? "Pending"}
        </span>
      </div>
    );
  };


// component of comment
const InfoComment = ({ comment }) => {
  if (!comment) return null;
  const rawId = String(comment.Comment_ID || "");
  const idForUrl = rawId.replace("#", "");


  return (
    <div className="flex items-center py-3 border-b hover:bg-gray-50 text-gray-700">
      <Link
        to={`/app_admin/report/comment/${idForUrl}`}
        className="text-green-700 hover:underline w-[10vw] ml-[2vw]">
        {rawId || "-"}
      </Link>
      <span className="w-[15vh] ml-[6vw]">{comment.NumberOfReports ?? "-"}</span>
      <span className="w-[10vh] ml-[6vw]">{comment.PopularReasons ?? "-"}</span>
      <span className="w-[8vh] ml-[11vw] whitespace-nowrap">{comment.LastDate ?? "-"}</span>
      <span className="w-[8vh] ml-[11.5vw]">{comment.Action ? comment.Action : "-"}</span>
      <span
        className={`w-[8vh] ml-[5vw] flex items-center justify-center text-sm px-2 py-1 rounded-full ${
          comment.status === "Pending"
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
        }`}>
        {comment.status ?? "Pending"}
      </span>
    </div>
  );
};


export default function Report() {
    const [numReports, setNumReports] = useState(0);
    const [numReportsUser, setNumReportUser] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [lookNow, setLookNow] = useState("post");
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [numReportsComment, setNumReportComment] = useState(0);


    useEffect(() => {
        const fetchReports = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch("http://127.0.0.1:8000/admin/reports");
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                const formatStatus = (status) =>
                    typeof status === "string"
                        ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
                        : "Pending";

                const formattedPosts = (data.reported_posts || []).map((post) => ({
                    Post_ID: `#${post.Post_ID ?? "-"}`,
                    Post_Content: post.Post_Content ?? "-",
                    NumberOfReports: post.NumberOfReports ?? 0,
                    PopularReasons: post.PopularReasons ?? "-",
                    LastDate: post.LastDate ?? "-",
                    Action: post.Action ?? "",
                    status: formatStatus(post.status),
                }));

                const formattedUsers = (data.reported_users || []).map((user) => ({
                    UserName: user.UserName ?? "-",
                    NumberOfReports: user.NumberOfReports ?? 0,
                    PopularReasons: user.PopularReasons ?? "-",
                    LastDate: user.LastDate ?? "-",
                    Action: user.Action ?? "",
                    status: formatStatus(user.status),
                }));

                const formattedComments = (data.reported_comments || []).map((comment) => ({
                    Comment_ID: `#${comment.Comment_ID ?? "-"}`,
                    Comment_Content: comment.Comment_Content ?? "-",
                    NumberOfReports: comment.NumberOfReports ?? 0,
                    PopularReasons: comment.PopularReasons ?? "-",
                    LastDate: comment.LastDate ?? "-",
                    Action: comment.Action ?? "",
                    status: formatStatus(comment.status),
                }));

                setNumReports(formattedPosts.length);
                setNumReportUser(formattedUsers.length);
                setNumReportComment(formattedComments.length);
                console.log("lookNow:", lookNow, "posts:", formattedPosts, "users:", formattedUsers, "comments:", formattedComments);
                setResults(
                        lookNow === "post"
                            ? formattedPosts
                            : lookNow === "user"
                            ? formattedUsers
                            : lookNow === "comment"
                            ? formattedComments
                            : []
                );

            } catch (err) {
                console.error("Error fetching reports:", err);
                setError("Failed to load report data.");
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [lookNow]);


    // optional debug helper — remove in production
    useEffect(() => {
        // console.log("lookNow:", lookNow, "results:", results);
    }, [lookNow, results]);


    return (
        <div className="flex flex-col">
            {/* num of report post and user and comment */}
            <div className="flex flex-row gap-4">
                <div className="w-[50vw] h-[20vh] bg-[#fdfaf6] rounded-xl shadow-2xl">
                    <div className="flex flex-col h-full ml-4">
                        <h1 className="mt-4 text-xl">Number of reported posts</h1>
                        <div className="flex justify-center items-center h-full -mt-6">
                            <div className="text-6xl font-bold">
                                {isLoading ? "..." : numReports}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-[50vw] h-[20vh] bg-[#fdfaf6] rounded-xl shadow-2xl">
                    <div className="flex flex-col h-full ml-4">
                        <h1 className="mt-4 text-xl">Number of reported users</h1>
                        <div className="flex justify-center items-center h-full -mt-6">
                            <div className="text-6xl font-bold">
                                {isLoading ? "..." : numReportsUser}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-[50vw] h-[20vh] bg-[#fdfaf6] rounded-xl shadow-2xl">
                    <div className="flex flex-col h-full ml-4">
                        <h1 className="mt-4 text-xl">Number of reported comment</h1>
                        <div className="flex justify-center items-center h-full -mt-6">
                            <div className="text-6xl font-bold">
                                {isLoading ? "..." : numReportsComment}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* post or user or comment*/}
            <div className="flex flex-row gap-x-12 mt-12">
                {/* Repost post */}
                <motion.button
                    type="button"
                    onClick={() => {
                        setLookNow("post");
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`ml-[10vw] text-xl rounded-3xl px-8 transition ${lookNow === "post" ? "bg-[#e0ebe2]" : "bg-[#ffffff]"} hover:opacity-90`}>
                        Reported posts
                </motion.button>
                {/* Report user */}
                <motion.button
                    type="button"
                    onClick={() => {
                        setLookNow("user");
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`ml-[10vw] text-xl rounded-3xl px-8 transition ${lookNow === "user" ? "bg-[#e0ebe2]" : "bg-[#ffffff]"} hover:opacity-90`}>
                        Reported users
                </motion.button>
                {/* comment */}
                <motion.button
                    type="button"
                    onClick={() => {
                        setLookNow("comment");
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`ml-[10vw] text-xl rounded-3xl px-8 transition ${lookNow === "comment" ? "bg-[#e0ebe2]" : "bg-[#ffffff]"} hover:opacity-90`}>
                        Reported comment
                </motion.button>
            </div>

            {/* topic */}
            <div className="flex flex-row gap-x-[15vh] mt-12 mb-6">
                <span className="font-bold ml-[2vw]">
                    {lookNow === 'post' ? "Post ID": lookNow === 'user' ? "Name" : "Comment ID"}
                </span>
                <span className="font-bold">Number of reports</span>
                <span className="font-bold">Popular reasons</span>
                <span className="font-bold whitespace-nowrap">last date of report</span>
                <span className="font-bold">Action</span>
                <span className="font-bold mr-4">Status</span>
            </div>

            {/* User list section */}
            <div className="bg-white rounded-lg shadow">
                {error && <p className="p-4 text-red-600">{error}</p>}
                
                {isLoading && <p className="p-4 text-gray-500">Loading...</p>}
                
                {!isLoading && results.length === 0 && !error && (
                    <p className="p-4 text-gray-500">Not found the user</p>
                )}
                
                {!isLoading && results.length > 0 && (
                    <div>
                    {lookNow === "post" &&
                        results.map((p) => (
                            <InfoPost key={p.Post_ID ?? p.id ?? JSON.stringify(p)} post={p} />
                        ))}

                    {lookNow === "user" &&
                        results.map((u) => (
                            <InfoUser key={u.UserName ?? u.id ?? JSON.stringify(u)} user={u} />
                        ))}

                    {lookNow === "comment" &&
                        results.map((c) => (
                            <InfoComment
                            key={c.Comment_ID ?? c.id ?? JSON.stringify(c)} comment={c}
                          />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
