import React, { useState, useEffect} from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const MOCK_POSTRE = [
    {Post_ID: '#203', NumberOfReports: 12, PopularReasons: 'Harassment', LastDate: '2025-10-13', Action: "", status: 'Pending' },
    {Post_ID: '#204', NumberOfReports: 8, PopularReasons: 'Illegal Activity', LastDate: '2025-10-13', Action: 'Hide Post ', status: 'Resolved' },
    {Post_ID: '#205', NumberOfReports: 11, PopularReasons: 'Spam', LastDate: '2025-10-11', Action: '', status: 'Pending' },
    {Post_ID: '#206', NumberOfReports: 6, PopularReasons: 'Privacy Violation', LastDate: '2025-10-10', Action: 'Remove', status: 'Resolved' }
];

const MOCK_USERSRE = [
    {UserName: 'zaza123', NumberOfReports: 12, PopularReasons: 'Harassment', LastDate: '2025-1-13', Action: '', status: 'Pending'},
    {UserName: 'totototo', NumberOfReports: 8, PopularReasons: 'Illegal Activity', LastDate: '2025-8-12', Action: 'Report 1 month', status: 'Resolved'},
    {UserName: 'pigiti', NumberOfReports: 11, PopularReasons: 'Spam', LastDate: '2025-9-11', Action: 'Report 1 week ', status: 'Resolved' },
    {UserName: 'dogneverdie', NumberOfReports: 6, PopularReasons: 'Privacy Violation', LastDate: '2025-10-10', Action: 'Report 1 year', status: 'Resolved' }
];

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
        <span className="w-[8vh] ml-[11vw]">{post.LastDate ?? "-"}</span>
        <span className="w-[8vh] ml-[10vw]">{post.Action ? post.Action : "-"}</span>
        <span className={`w-[8vh] ml-[6vw] flex items-center justify-center text-sm px-2 py-1 rounded-full ${post.status === "Pending" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {post.status ?? "Pending"}
        </span>
      </div>
    );
  };


// component สำหรับแถว user
const InfoUser = ({ user }) => {
    if (!user) return null;
    return (
      <div className="flex items-center py-3 border-b hover:bg-gray-50 text-gray-700">
        <Link to={`/app_admin/report/user/${encodeURIComponent(user.UserName || "")}`} className="text-green-700 hover:underline w-[10vw] ml-[2vw]">
          {user.UserName || "-"}
        </Link>
        <span className="w-[15vh] ml-[4vw]">{user.NumberOfReports ?? "-"}</span>
        <span className="w-[10vh] ml-[6vw]">{user.PopularReasons ?? "-"}</span>
        <span className="w-[8vh] ml-[12vw]">{user.LastDate ?? "-"}</span>
        <span className="w-[8vh] ml-[12vw]">{user.Action ? user.Action : "-"}</span>
        <span className={`w-[8vh] ml-[5vw] flex items-center justify-center text-sm px-2 py-1 rounded-full ${user.status === "Pending" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {user.status ?? "Pending"}
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
    const [error, setError] = useState(null)

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
                status: formatStatus(post.status)
            }));

            const formattedUsers = (data.reported_users || []).map((user) => ({
                UserName: user.UserName ?? "-",
                NumberOfReports: user.NumberOfReports ?? 0,
                PopularReasons: user.PopularReasons ?? "-",
                LastDate: user.LastDate ?? "-",
                Action: user.Action ?? "",
                status: formatStatus(user.status)
            }));

            setNumReports(formattedPosts.length);
            setNumReportUser(formattedUsers.length);
            setResults(lookNow === "post" ? formattedPosts : formattedUsers);
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



    // // initial
    // useEffect(() => {
    //     setNumReports(MOCK_POSTRE.length);
    //     setNumReportUser(MOCK_USERSRE.length);
    //     setResults(lookNow === "post" ? MOCK_POSTRE : MOCK_USERSRE);
    //     setIsLoading(false);
    // }, []); // mount

    // update results whenever lookNow changes — set results first, then stop loading
    // useEffect(() => {
    //     setIsLoading(true);
    //     setError(null);

    //     // get data (mock here; replace by fetch when ready)
    //     const data = lookNow === "post" ? MOCK_POSTRE : MOCK_USERSRE;

    //     // small timeout ensures state updates occur in safe order
    //     setTimeout(() => {
    //     setResults(data);
    //     setIsLoading(false);
    //     }, 0);
    // }, [lookNow]);

    // optional debug helper — remove in production
    useEffect(() => {
        // console.log("lookNow:", lookNow, "results:", results);
    }, [lookNow, results]);

    return (
        <div className="flex flex-col">
            {/* num of report post and user */}
            <div className="flex flex-row gap-4">
                <div className="w-[50vw] h-[20vh] bg-[#fdfaf6] rounded-xl shadow-2xl">
                    <div className="flex flex-col h-full ml-4">
                        <h1 className="mt-4 text-xl">Number of report posts</h1>
                        <div className="flex justify-center items-center h-full -mt-6">
                            <div className="text-6xl font-bold">
                                {isLoading ? "..." : numReports}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-[50vw] h-[20vh] bg-[#fdfaf6] rounded-xl shadow-2xl">
                    <div className="flex flex-col h-full ml-4">
                        <h1 className="mt-4 text-xl">Number of report users</h1>
                        <div className="flex justify-center items-center h-full -mt-6">
                            <div className="text-6xl font-bold">
                                {isLoading ? "..." : numReportsUser}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* post or user */}
            <div className="flex flex-row gap-x-12 mt-12">
                {/* Repost post */}
                <motion.button
                    type="button"
                    onClick={() => {
                        setLookNow("post");
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`ml-[15vw] text-xl rounded-3xl px-8 transition ${lookNow === "post" ? "bg-[#e0ebe2]" : "bg-[#ffffff]"} hover:opacity-90`}>
                        Report posts
                    </motion.button>
                {/* Report user */}
                <motion.button
                    type="button"
                    onClick={() => {
                        setLookNow("user");
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`ml-[27vw] text-xl rounded-3xl px-8 transition ${lookNow === "user" ? "bg-[#e0ebe2]" : "bg-[#ffffff]"} hover:opacity-90`}>
                        Report users
                </motion.button>
            </div>

            {/* topic */}
            <div className="flex flex-row gap-x-[13vh] mt-12 mb-6">
                <span className="font-bold ml-[2vw]">
                    {lookNow === 'post' ? "Post ID":"Name"}
                </span>
                <span className="font-bold">Number of reports</span>
                <span className="font-bold">Popular reasons</span>
                <span className="font-bold">last date of report</span>
                <span className="font-bold">Action</span>
                <span className="font-bold">Status</span>
            </div>

            {/* ส่วนแสดงรายการผู้ใช้ */}
            <div className="bg-white rounded-lg shadow">
                {error && <p className="p-4 text-red-600">{error}</p>}
                
                {isLoading && <p className="p-4 text-gray-500">Loading...</p>}
                
                {!isLoading && results.length === 0 && !error && (
                    <p className="p-4 text-gray-500">Not found the user</p>
                )}
                
                {!isLoading && results.length > 0 && (
                    <div>
                        {lookNow === "post"
                        ? results.map((p) => <InfoPost key={p.Post_ID ?? p.id ?? JSON.stringify(p)} post={p} />)
                        : results.map((u) => <InfoUser key={u.UserName ?? u.id ?? JSON.stringify(u)} user={u} />)
                        }
                    </div>
                )}
            </div>
        </div>
    );
}