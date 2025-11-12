export default function Language() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Language</h2>
      <select className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-400 outline-none">
        <option>English</option>
        <option>ไทย (Thai)</option>
      </select>
    </div>
  );
}