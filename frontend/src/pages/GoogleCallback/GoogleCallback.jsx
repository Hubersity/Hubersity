import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const newUser = searchParams.get("new_user") === "true";
    const uid = searchParams.get("uid");
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const picture = searchParams.get("picture");

    if (!token || !uid) {
      setError("Missing token or uid from Google callback");
      return;
    }

    const usernameKey = name || email?.split("@")[0] || "guest";

    const handleGoogleFlow = async () => {
      try {
        if (newUser) {
          // Save session
          localStorage.setItem(
            `authData_${usernameKey}`,
            JSON.stringify({
              uid,
              username: usernameKey,
              token,
              name,
              email,
            })
          );
          localStorage.setItem("currentUserKey", `authData_${usernameKey}`);

          console.log("💾 New Google user session saved:", usernameKey);

          // Navigate to create-account with prefilled info
          navigate("/create-account", {
            state: { email, name, picture },
          });
        } else {
          // Existing user
          const meRes = await fetch("http://localhost:8000/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!meRes.ok) {
            setError("Cannot load user profile.");
            return;
          }

          const userData = await meRes.json();

          const key = `authData_${userData.username}`;
          const saveData = {
            token,
            uid: userData.uid,
            username: userData.username,
            name: userData.name,
            email: userData.email,
            profile_image: userData.profile_image,
            birthdate: userData.birthdate,
            university: userData.university,
            privacy: userData.privacy,
            description: userData.description,
          };

          localStorage.setItem(key, JSON.stringify(saveData));
          localStorage.setItem("currentUserKey", key);

          console.log("✨ Existing Google user session saved:", saveData);

          navigate("/app/board");
        }
      } catch (err) {
        console.error("Connection error:", err);
        setError("Cannot connect to server.");
      }
    };

    handleGoogleFlow();
  }, [searchParams, navigate]);

  return <p>{error ? error : "Loading Google login..."}</p>;
}