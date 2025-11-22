import { useState, useEffect } from "react";
import { UserCheck, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_URL = `${import.meta.env.VITE_API_URL}`;

/* ========================================================= */
/* =================== DELETE CONFIRM MODAL ================= */
/* ========================================================= */
function DeleteFollowerModal({ open, user, onCancel, onConfirm }) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-white rounded-2xl shadow-xl border w-full max-w-md mx-4 animate-fadeIn overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-red-50 to-rose-50">
          <h3 className="text-xl font-semibold text-red-600 flex items-center gap-2">
            <UserX size={20} /> {t('Followers.RemoveFollower')}
          </h3>
        </div>

        <div className="px-6 py-6 space-y-4 text-gray-700">
          <p className="text-lg font-medium">
            {t('Followers.AreYouSureRemove')}{" "}
            <span className="font-semibold text-gray-900">@{user?.username}</span>?
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t('Followers.RemoveDetail')}
          </p>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3 bg-gray-50 border-t">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border">
            {t('Followers.Cancel')}
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            {t('Followers.ConfirmRemove')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* ======================== MAIN PAGE ======================= */
/* ========================================================= */

export default function FollowerPage() {
  const navigate = useNavigate();

  const [followers, setFollowers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);

  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);

  const currentKey = localStorage.getItem("currentUserKey");
  const authData = currentKey ? JSON.parse(localStorage.getItem(currentKey)) : {};
  const token = authData?.token;
  const { t } = useTranslation();

  /* load user */
  useEffect(() => {
    if (!token) return;

    async function fetchMe() {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(await res.json());
    }

    fetchMe();
  }, [token]);

  const isPrivate = user?.is_private === true;

  /* load followers */
  const loadFollowers = async () => {
    if (!token) return;

    const res = await fetch(`${API_URL}/follow/followers`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) setFollowers(await res.json());
  };

  useEffect(() => {
    loadFollowers();
  }, [token]);

  /* load follow requests */
  const loadRequests = async () => {
    if (!token || !isPrivate) return;

    const res = await fetch(`${API_URL}/follow/requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) setRequests(await res.json());
  };

  useEffect(() => {
    loadRequests();
  }, [token, isPrivate]);

  const getImage = (u) => {
    if (!u?.profile_image) return "/images/default.jpg";
    if (u.profile_image.startsWith("http")) return u.profile_image;
    return `${API_URL}${u.profile_image}`;
  };

  const goToProfile = (id) => navigate(`/app/user/${id}`);

  /* ====================== ACCEPT REQUEST ====================== */
  const approveRequest = async (req) => {
    await fetch(`${API_URL}/follow/requests/${req.id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    // remove request card
    setRequests((prev) => prev.filter((x) => x.id !== req.id));

    // add to followers list
    const u = req.from_user || req;
    setFollowers((prev) =>
      prev.some((x) => x.uid === u.uid) ? prev : [u, ...prev]
    );

    // ⭐⭐ ส่ง event เพื่อ refresh หน้า user profile ⭐⭐
    window.dispatchEvent(new Event("refresh_user_profile"));
  };

  const rejectRequest = async (req) => {
    await fetch(`${API_URL}/follow/requests/${req.id}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    setRequests((prev) => prev.filter((x) => x.id !== req.id));
  };

  const confirmRemove = async () => {
    if (!targetUser) return;

    await fetch(`${API_URL}/follow/followers/${targetUser.uid}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setFollowers((prev) => prev.filter((x) => x.uid !== targetUser.uid));
    setRemoveModalOpen(false);

    // ⭐ แจ้ง profile refresh ด้วย
    window.dispatchEvent(new Event("refresh_user_profile"));
  };

  return (
    <div className="p-10 w-full h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">{t('Followers.followers')}</h1>

      {/* ==================== FOLLOW REQUESTS ==================== */}
      {isPrivate && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800">{t('Followers.FollowRequests')}</h2>
          </div>

          <div className="space-y-4">
            {requests.length === 0 ? (
              <p className="text-sm text-gray-500">{t('Followers.NoFollowRequests')}</p>
            ) : (
              requests.map((req) => {
                const u = req.from_user || req;
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
                  >
                    <div
                      className="flex items-center gap-4 cursor-pointer"
                      onClick={() => goToProfile(u.uid)}
                    >
                      <img src={getImage(u)} className="w-12 h-12 rounded-full border object-cover" />
                      <div>
                        <p className="font-semibold text-gray-800">{u.name || u.username}</p>
                        <p className="text-sm text-gray-500">@{u.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveRequest(req)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#6dbf74] text-white hover:bg-[#5aa862]"
                      >
                        {t('Followers.Accept')}
                      </button>
                      <button
                        onClick={() => rejectRequest(req)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                      >
                        {t('Followers.Delete')}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ======================== FOLLOWERS ======================== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <UserX className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-semibold text-gray-800">{t('Followers.YourFollowers')}</h2>
        </div>

        <div className="space-y-4">
          {followers.length === 0 ? (
            <p className="text-sm text-gray-500">{t('Followers.NoFollowersYet')}</p>
          ) : (
            followers.map((u) => (
              <div
                key={u.uid}
                className="flex items-center justify-between bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
              >
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => goToProfile(u.uid)}
                >
                  <img src={getImage(u)} className="w-12 h-12 rounded-full border object-cover" />

                  <div>
                    <p className="font-semibold text-gray-800">{u.name || u.username}</p>
                    <p className="text-sm text-gray-500">@{u.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTargetUser(u);
                    setRemoveModalOpen(true);
                  }}
                  className="px-5 py-1.5 rounded-full text-sm bg-red-600 text-white hover:bg-red-700"
                >
                  {t('Followers.Delete')}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <DeleteFollowerModal
        open={removeModalOpen}
        user={targetUser}
        onCancel={() => setRemoveModalOpen(false)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}