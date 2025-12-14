'use client';

export default function RealtimeStats() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold text-[#1f2937]">Status</h3>
      </div>
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
        <div className="text-sm text-[#6b7280]">Active</div>
        <div className="text-base font-semibold text-[#16a34a]">Online</div>
      </div>
    </div>
  );
}
