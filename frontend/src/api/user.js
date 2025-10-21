export async function getCurrentUser() {
  try {
    const authData = JSON.parse(localStorage.getItem("authData") || "{}");
    const token = authData.token;
    if (!token) throw new Error("No token found");

    const res = await fetch(`http://localhost:8000/users/me`, {
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
