export async function getCurrentUser() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`);
    if (!res.ok) throw new Error("Failed to fetch user");
    return await res.json();
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
}