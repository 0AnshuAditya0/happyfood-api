export default function Simple() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Tailwind Test</h1>
        <p className="text-gray-700 mb-4">If you see this styled properly, Tailwind is working!</p>
        <div className="space-y-2">
          <div className="bg-red-500 text-white p-2 rounded">Red Box</div>
          <div className="bg-green-500 text-white p-2 rounded">Green Box</div>
          <div className="bg-yellow-500 text-white p-2 rounded">Yellow Box</div>
        </div>
        <button className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors">
          Test Button
        </button>
      </div>
    </div>
  );
} 
