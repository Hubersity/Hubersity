export default function DeleteAccount() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Delete Account</h2>
      <p className="text-gray-600 mb-4">
        Once you delete your account, all your data will be permanently removed.
      </p>
      <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium">
        Delete Account
      </button>
    </div>
  );
}