import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Upload, AlertCircle } from 'lucide-react';
import Dashboards from './Dashboards'; 
import ResultCard from './components/ResultCard';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [message, setMessage] = useState('');
  
  // This state tells Dashboards to re-fetch data (Synced with Step 21)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Final Step: When the user confirms the OCR data is correct,
   * we clear the scanner UI and ping the dashboard to update.
   */
  const handleFinalConfirm = (finalData) => {
    // 1. Reset Scanner State
    setExtractedData(null);
    setFile(null);
    setPreview(null);
    
    // 2. Visual Feedback
    setMessage('✅ Bill added to ledger successfully!');
    
    // 3. Sync Dashboard: This triggers refreshDashboard() in Dashboards.jsx
    setRefreshTrigger(prev => prev + 1);

    // 4. Auto-clear success message after 5 seconds
    setTimeout(() => setMessage(''), 5000);
  };

  const uploadBill = async () => {
    if (!file) return;
    setLoading(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('bill', file);

    try {
      // Points to your Step 21 backend
      const res = await axios.post('http://localhost:5000/api/upload-bill', formData);
      setExtractedData(res.data.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Upload failed';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-12 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Brand Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-black text-blue-600 tracking-tight">ZERO-LEAK</h1>
          <p className="text-slate-500 font-medium italic">Smart Financial Compliance Engine</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: The Scanner & Result Logic */}
          <section className="lg:col-span-5 xl:col-span-4">
            {!extractedData ? (
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-8">
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-10 mb-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden">
                  {preview ? (
                    <div className="relative w-full">
                        <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                        <button 
                            onClick={() => { setFile(null); setPreview(null); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                        >
                            <AlertCircle size={16} />
                        </button>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-medium">Capture or Upload Bill</p>
                    </div>
                  )}
                  
                  {/* File Input Overlay */}
                  {!preview && (
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => {
                        if(e.target.files[0]) {
                            setFile(e.target.files[0]);
                            setPreview(URL.createObjectURL(e.target.files[0]));
                            setMessage('');
                        }
                        }} 
                    />
                  )}
                </div>

                <button 
                  onClick={uploadBill} 
                  disabled={loading || !file} 
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        AI Processing...
                    </span>
                  ) : (
                    <><Upload size={20} /> Process Invoice</>
                  )}
                </button>

                {message && (
                  <div className={`mt-4 p-3 rounded-xl text-center text-sm font-bold animate-pulse ${message.includes('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {message}
                  </div>
                )}
              </div>
            ) : (
              <ResultCard data={extractedData} onConfirm={handleFinalConfirm} />
            )}
          </section>

          {/* RIGHT COLUMN: Real-time Analytics Dashboard */}
          <section className="lg:col-span-7 xl:col-span-8">
            <Dashboards refreshTrigger={refreshTrigger} />
          </section>

        </main>
      </div>
    </div>
  );
}

export default App;