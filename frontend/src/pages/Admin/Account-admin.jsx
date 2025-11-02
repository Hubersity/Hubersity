import React, { useState, useEffect} from "react";
import { Search, User} from "lucide-react";

// funvtion call API
const searchAPI= async (query) => {
    // API_URL = link the connet to backend
    const API_URL = `http://backend-api.com/search/users?name=${query}`;

    const response = await fetch(API_URL);
    if (!response.ok) {
        // throw is stop run because it error, new Error('Search failed'); new Error is create the odj of error message.
        throw new Error('Search failed');
    }
    return response.json();
};

// ********** ข้อมูลจำลองสำหรับทดสอบ (ลบออกเมื่อใช้ API จริง) **********
const MOCK_USERS = [
    {profile: 'url_a', name: 'Aong12345', email: 'aong123@gmail.com', university: 'Kasetsart', joinDate: '2025-10-04', status: 'Public' },
    {profile: 'url_b', name: 'Skibidy', email: 'skibidy@gmail.com', university: 'Chulalongkorn', joinDate: '2025-9-30', status: 'Private' },
    {profile: 'url_c', name: 'RoseAisp', email: 'rose@gmail.com', university: 'Mahidol', joinDate: '2025-3-17', status: 'Public' },
    {profile: 'url_d', name: 'DogDogbod34', email: 'dogbod@gmail.com', university: 'Thammasat', joinDate: '2025-6-21', status: 'Private' },
    {profile: 'url_e', name: 'Fai876', email: 'fai@gmail.com', university: 'Chiang Mai', joinDate: '2025-10-26', status: 'Private' },
    {profile: 'url_f', name: 'gigi78', email: 'gigi@gmail.com', university: 'Kasetsart', joinDate: '2025-8-26', status: 'Public' }
];

export default function SerachAccount() {
    // สถานะสำหรับเก็บคำค้นหาจากผู้ใช้
    const [searchTerm, setSearchTerm] = useState("");
    // สถานะสำหรับเก็บผลลัพธ์ที่ได้ (Array ของ Object ผู้ใช้)
    // const [results, setResults] = useState([]);
    const [results, setResults] = useState(MOCK_USERS);
    // สถานะสำหรับ Loading และ Error
    const [isLoading, setIsLoading] = useState(false); // เริ่มต้นเป็น true เพื่อโหลดข้อมูลครั้งแรก
    const [error, setError] = useState(null);

    // useEffect(() => {
    //     const fetchAllUsers = async () => {
    //         setIsLoading(true);
    //         setError(null);
    //         try {
    //             const data = await searchAPI(""); // ดึงข้อมูลทั้งหมดเมื่อ searchTerm เป็นค่าว่าง
    //             setResults(data); 
    //         }
    //         catch {
    //             setError("Can not load information of the user");
    //             setResults([]);
    //         }
    //         finally {
    //             setIsLoading(false);
    //         }
    //     };
    //     fetchAllUsers();
    // }, []); // Array ว่าง [] ทำให้รันครั้งเดียวเมื่อโหลด

    // function sreach when the admin search
    const handleSearch = async (e) => {
        e.preventDefault(); // ป้องกันเบราว์เซอร์รีโหลดหน้า

        setIsLoading(true)
        setError(null);
        setResults([]); // ล้างผลลัพธ์เดิม

        // try {
        //     // ส่ง searchTerm ปัจจุบัน (ถ้าว่างก็จะดึงทั้งหมด ถ้ามีก็จะค้นหาเฉพาะเจาะจง)
        //     const data = await searchAPI(searchTerm);
        //     // assume data is Array of the user that found
        //     setResults(data);
        // }
        // catch {
        //     setError("Not found, pls try agian")
        // }
        // finally {
        //     setIsLoading(false);
        // }

        // Filter users by name (case-insensitive), .filter(...) → คืน array ใหม่ที่ผ่านเงื่อนไขเท่านั้น
        const filterred = MOCK_USERS.filter((user) => 
            user.name.toLocaleLowerCase().includes(searchTerm.toLowerCase()));
        if (filterred.length == 0) {
            setError("Not found, please try again");
            setResults([]);
        }
        else {
            setResults(filterred);
        }

        setIsLoading(false);
    };

    const UserRow = ({ user }) => (
        <div className="flex items-center gap-x-[12vh] py-3 border-b hover:bg-gray-50 text-gray-700">
        <img
            src={user.profile || 'placeholder.jpg'}
            alt={user.name}
            className="w-8 h-8 rounded-full ml-10"
        />
        <span className="w-[10vh] font-medium">{user.name}</span>
        <span className="w-[15vh]">{user.email}</span>
        <span className="w-[10vh] ml-[2vw]">{user.university}</span>
        <span className="w-[8vh] ml-[2vw]">{user.joinDate}</span>
        <span
            className={`w-[8vh] ml-[4vw] flex items-center justify-center text-sm px-2 py-1 rounded-full ${
            user.status === "Public"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
        >
            {user.status}
        </span>
        </div>
    );
    return (
        <div className="flex flex-col p-2 gap-4">
            {/* ส่วนกล่องค้นหา (Search Input Box) */}
            <div className="relative flex-1">
                <form onSubmit={handleSearch} className="flex gap-4 mb-10">
                    <Search className="absolute left-3 top-[2.3vh] -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search user name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border rounded-full pl-10 pr-10 py-2"
                    />
                </form>
            </div>
            <div className="flex flex-row gap-x-[17vh]">
                <span className="text-xl font-bold ml-[23vh]">Name</span>
                <span className="text-xl font-bold">Gmail</span>
                <span className="text-xl font-bold">University</span>
                <span className="text-xl font-bold">Join date</span>
                <span className="text-xl font-bold">Status</span>
            </div>
            {/* ส่วนแสดงรายการผู้ใช้ */}
            <div className="bg-white rounded-lg shadow">
                {error && <p className="p-4 text-red-600">{error}</p>}
                
                {isLoading && <p className="p-4 text-gray-500">Loading...</p>}
                
                {!isLoading && results.length === 0 && !error && (
                    <p className="p-4 text-gray-500">Not found the user</p>
                )}
                
                {!isLoading && results.length > 0 && (
                    <div className="divide-y divide-gray-200">
                        {results.map(user => (
                            <UserRow key={user.name} user={user} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}