import React, { useState, useEffect} from "react";
import { Search, User} from "lucide-react";

const API_URL = `http://localhost:8000`; 

export default function SearchAccount() {
    // Status for storing search terms from users
    const [searchTerm, setSearchTerm] = useState("");
    const [allUsers, setAllUsers] = useState([]);
    // State for storing the resulting result (Array of user objects)
    // const [results, setResults] = useState([]);
    const [results, setResults] = useState(MOCK_USERS);
    // Status for Loading and Error
    const [isLoading, setIsLoading] = useState(false); // Defaults to true to load the first data.
    const [error, setError] = useState(null);


    const formatUser = (user) => ({
        profile: user.profile_image,
        name: user.username,
        email: user.email,
        university: user.university || "-",
        joinDate: user.created_at.split("T")[0],
        status: user.is_private ? "Private" : "Public"
    });
    

    const fetchAllUsers = async () => {
        const API_URL = `http://localhost:8000/admin/users/all`; 
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error("Failed to fetch users");
        }
        return response.json();
    };


    useEffect(() => {
        const loadUsers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchAllUsers();
                const formatted = data.map(formatUser);
                setAllUsers(formatted);
                setResults(formatted); // show all 
            } catch {
                setError("Cannot load user information");
            } finally {
                setIsLoading(false);
            }
        };
        loadUsers();
    }, []);


    // function sreach when the admin search
    const handleSearch = (e) => {
        e.preventDefault(); // Prevent page reload

        setIsLoading(true);
        setError(null);

        // Trim and lowercase the search term
        const keyword = searchTerm.trim().toLowerCase();

        // Filter users by username (case-insensitive)
        const filtered = allUsers.filter((user) =>
            user.name.toLowerCase().includes(keyword)
        );

        if (filtered.length === 0) {
            setError("Not found, please try again");
            setResults([]);
        } else {
            setResults(filtered);
        }

        setIsLoading(false);
    };


    const UserRow = ({ user }) => (
        <div className="flex items-center gap-x-[12vh] py-3 border-b hover:bg-gray-50 text-gray-700">
        <img
            src={`${API_URL}${user.profile}` || 'placeholder.jpg'}
            alt={user.name}
            className="w-8 h-8 rounded-full ml-10"
        />
        <span className="w-[10vh] font-medium">{user.name}</span>
        <span className="w-[15vh]">{user.email}</span>
        <span className="w-[10vh] ml-[2vw]">{user.university}</span>
        <span className="w-[8vh] ml-[2vw] whitespace-nowrap">{user.joinDate}</span>
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
            {/* Search Input Box */}
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
                <span className="text-xl font-bold ml-[4vh]">Gmail</span>
                <span className="text-xl font-bold">University</span>
                <span className="text-xl font-bold">Join date</span>
                <span className="text-xl font-bold ml-[4vh]">Status</span>
            </div>
            {/* User list section */}
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
