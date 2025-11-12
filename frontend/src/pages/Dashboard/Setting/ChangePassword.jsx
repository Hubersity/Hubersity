export default function ChangePassword() {
  return (
    <div className="flex flex-col items-start justify-center px-10 py-8 w-full">
      {/* หัวข้อ */}
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Change Password
      </h2>

      {/* ฟอร์มกรอกรหัสผ่าน */}
      <div className="flex flex-col space-y-5 w-full max-w-md">
        {/* Current Password */}
        <div className="flex flex-col">
          <label className="text-gray-700 text-sm font-medium mb-2">
            Current Password
          </label>
          <input
            type="password"
            placeholder=""
            className="w-full bg-[#f4f4f4] border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#8cab93]"
          />
        </div>

        {/* New Password */}
        <div className="flex flex-col">
          <label className="text-gray-700 text-sm font-medium mb-2">
            New Password
          </label>
          <input
            type="password"
            placeholder=""
            className="w-full bg-[#f4f4f4] border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#8cab93]"
          />
        </div>

        {/* New Password again */}
        <div className="flex flex-col">
          <label className="text-gray-700 text-sm font-medium mb-2">
            New Password again
          </label>
          <input
            type="password"
            placeholder=""
            className="w-full bg-[#f4f4f4] border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#8cab93]"
          />
        </div>

        {/* ปุ่ม Confirm */}
        <div className="pt-4">
          <button
            className="bg-[#8cab93] text-white font-medium px-8 py-2 rounded-full hover:bg-[#7da186] transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}