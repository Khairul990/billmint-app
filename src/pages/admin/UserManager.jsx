import React from 'react';

const UserManager = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">User Manager</h2>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <input 
            type="text" 
            placeholder="Search users..." 
            className="bg-[#0f172a] text-slate-200 border border-slate-700 rounded-lg px-4 py-2 w-64 text-sm focus:outline-none focus:border-rose-500"
          />
        </div>
        <div className="p-8 text-center text-slate-500 text-sm font-semibold">
          No users found or loading users...
        </div>
      </div>
    </div>
  );
};

export default UserManager;
