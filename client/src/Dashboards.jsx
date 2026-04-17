import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Download, Receipt, IndianRupee, ShieldCheck, Trash2, AlertCircle } from 'lucide-react';

const Dashboards = ({ refreshTrigger }) => {
    const [chartData, setChartData] = useState([]);
    const [recentBills, setRecentBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [statsRes, billsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/analytics/spending'),
                axios.get('http://localhost:5000/api/reports/gst?format=json')
            ]);

            setChartData(statsRes.data);
            setRecentBills(Array.isArray(billsRes.data) ? billsRes.data : []);
        } catch (err) {
            setError("⚠️ Connection Lost. Ensure the backend server is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshDashboard();
    }, [refreshTrigger]); 

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this bill and its image from the server?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/expenses/${id}`);
            refreshDashboard();
        } catch (err) {
            alert("❌ Cleanup failed.");
        }
    };

    const totalOutflow = chartData.reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0);
    const estTaxCredit = totalOutflow * 0.1525; 
    
    // Step 25: Version 1.0 "Ready for Filing" Logic
    const validGstinCount = recentBills.filter(b => b.gstin !== 'NOT_FOUND').length;
    const complianceScore = recentBills.length > 0 ? (validGstinCount / recentBills.length) * 100 : 0;
    const isReady = recentBills.length >= 5 && complianceScore > 80;

    // Calculate Leakage: 18% of bills where GSTIN was not found
    const leakageAmount = recentBills
        .filter(b => b.gstin === 'NOT_FOUND')
        .reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0) * 0.18;

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-2 font-bold text-sm animate-pulse">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* --- STEP 25: ACTION CENTER --- */}
            <div className={`p-6 rounded-3xl mb-6 border-2 flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                isReady 
                ? 'bg-green-50 border-green-200' 
                : 'bg-slate-50 border-slate-200'
            }`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isReady ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-slate-300'}`}>
                        <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div>
                        <h5 className="text-base font-black text-slate-800">
                            {isReady ? "Audit Ready" : "Compliance Pending"}
                        </h5>
                        <p className="text-xs text-slate-500 font-medium max-w-md">
                            {isReady 
                                ? "Your ledger has enough high-quality data to file for Input Tax Credit (ITC)." 
                                : `Your health is at ${Math.round(complianceScore)}%. Scan at least 5 bills with clear GSTINs to unlock professional export.`}
                        </p>
                    </div>
                </div>

                {leakageAmount > 0 && (
                    <div className="bg-white px-4 py-3 rounded-2xl border border-amber-100 flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">Potential Leakage</p>
                            <p className="text-lg font-black text-slate-900 leading-tight">
                                ₹{leakageAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-100" />
                        <AlertCircle size={20} className="text-amber-500" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Outflow</p>
                    <h4 className="text-2xl font-black text-slate-900 flex items-center mt-1">
                        <IndianRupee size={20} className="text-slate-300 mr-1" />
                        {totalOutflow.toLocaleString('en-IN')}
                    </h4>
                </div>

                <div className="bg-blue-600 p-5 rounded-3xl shadow-lg shadow-blue-100">
                    <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Saved GST (Credit)</p>
                    <h4 className="text-2xl font-black text-white mt-1">
                        ₹{estTaxCredit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </h4>
                    <p className="text-[10px] text-blue-100 mt-1 flex items-center gap-1">
                        <ShieldCheck size={10} /> Compliance Optimized
                    </p>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Compliance Health</p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${complianceScore > 70 ? 'bg-green-500' : 'bg-amber-500'}`} 
                                style={{ width: `${complianceScore}%` }} 
                            />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{Math.round(complianceScore)}%</span>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-white rounded-3xl shadow-xl border border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-black flex items-center gap-2">
                            <TrendingUp className="text-blue-600" size={20} /> Spending Trends
                        </h2>
                        <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter inline-flex items-center gap-1.5 ${
                            isReady ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${isReady ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                            {isReady ? 'Ready for GST Filing' : `${Math.max(0, 5 - recentBills.length)} More Bills Recommended`}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => window.open('http://localhost:5000/api/reports/gst?format=csv', '_blank')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                            isReady ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        disabled={!isReady}
                    >
                        <Download size={14} /> Export GST CSV
                    </button>
                </div>

                <div className="h-64 w-full">
                    {loading ? (
                        <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse text-slate-400 text-xs font-bold">
                            SYNCING LEDGER...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                                    cursor={{fill: '#f8fafc'}}
                                />
                                <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={45} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                    <Receipt className="text-slate-400" size={18} /> Recent Ledger Entries
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-400 border-b border-slate-50">
                                <th className="pb-3 font-black uppercase text-[10px] tracking-widest">Date</th>
                                <th className="pb-3 font-black uppercase text-[10px] tracking-widest">Vendor GSTIN / Inv</th>
                                <th className="pb-3 font-black uppercase text-[10px] tracking-widest text-right">Amount</th>
                                <th className="pb-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentBills.length > 0 ? recentBills.map((bill) => (
                                <tr key={bill.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="py-4 text-slate-500 font-medium">{bill.bill_date}</td>
                                    <td className="py-4">
                                        <div className={`font-mono font-bold uppercase tracking-tighter ${bill.gstin === 'NOT_FOUND' ? 'text-amber-500' : 'text-blue-600'}`}>
                                            {bill.gstin}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">#{bill.invoice_no}</div>
                                    </td>
                                    <td className="py-4 text-right font-black text-slate-900">
                                        ₹{parseFloat(bill.total_amount).toLocaleString('en-IN')}
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <button 
                                            onClick={() => handleDelete(bill.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-slate-400 font-medium italic">
                                        No verified bills in the ledger.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboards;