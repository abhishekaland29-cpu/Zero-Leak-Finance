import React, { useState } from 'react';
import { CheckCircle, FileText, IndianRupee, Calendar, Tag } from 'lucide-react';

export default function ResultCard({ data, onConfirm }) {
  // Local state to allow user to "fix" any OCR mistakes
  const [editedData, setEditedData] = useState(data);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-blue-100 animate-in fade-in zoom-in duration-300">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
        <CheckCircle className="text-green-500" /> Verify AI Extraction
      </h2>
      
      <div className="space-y-4">
        {/* GSTIN - Force Uppercase */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Vendor GSTIN</label>
          <input 
            className="w-full p-3 bg-slate-50 rounded-xl font-mono font-bold text-blue-600 border border-transparent focus:border-blue-200 outline-none transition-all"
            value={editedData.gstin}
            onChange={(e) => setEditedData({...editedData, gstin: e.target.value.toUpperCase()})}
          />
        </div>

        {/* Amount - Numeric Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Amount</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              type="number"
              className="w-full p-3 pl-10 bg-slate-50 rounded-xl font-bold text-xl border border-transparent focus:border-blue-200 outline-none transition-all"
              value={editedData.totalAmount}
              onChange={(e) => setEditedData({...editedData, totalAmount: parseFloat(e.target.value)})}
            />
          </div>
        </div>

        {/* Category Dropdown (The "Leak" Preventer) */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Expense Category</label>
          <select 
            className="w-full p-3 bg-slate-50 rounded-xl font-semibold text-slate-700 border border-transparent focus:border-blue-200 outline-none appearance-none cursor-pointer"
            onChange={(e) => setEditedData({...editedData, category: e.target.value})}
          >
            <option value="General">General Office</option>
            <option value="Travel">Travel & Transport</option>
            <option value="Food">Meals & Entertainment</option>
            <option value="Software">Software/SaaS</option>
          </select>
        </div>
      </div>

      <button 
        onClick={() => onConfirm(editedData)}
        className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
      >
        Confirm & Save to Ledger
      </button>
    </div>
  );
}