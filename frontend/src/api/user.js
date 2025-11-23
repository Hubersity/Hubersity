export async function getCurrentUser() {
  try {
    const currentKey = localStorage.getItem("currentUserKey");
    if (!currentKey) throw new Error("No current user key found");

    const authData = JSON.parse(localStorage.getItem(currentKey) || "{}");
    const token = authData.token;
    if (!token) throw new Error("No token found");

    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch user");
    return await res.json();
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
}
