import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText, ArrowRight, ShieldCheck, Activity, Users, Server, Database, X } from 'lucide-react';

const App = () => {
  // Stati dell'app
  const [view, setView] = useState('LOGIN'); // LOGIN o DASHBOARD
  const [systemStatus, setSystemStatus] = useState('MONITORING'); // MONITORING o REPORTED
  const [isPressed, setIsPressed] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [time, setTime] = useState(new Date());
  
  // Dati
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [machineData, setMachineData] = useState({
    contractRef: 'UNK-00',
    machineId: 'DEV-01',
    sessionToken: '---'
  });

  // 1. All'avvio: Leggi il QR Code (URL)
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Legge i parametri dall'URL
    const params = new URLSearchParams(window.location.search);
    
    // Se il QR ha i nomi, pre-compilali
    if (params.get('partyA_name')) setPartyA(params.get('partyA_name'));
    if (params.get('partyB_name')) setPartyB(params.get('partyB_name'));

    // Dati tecnici della macchina (dal QR o default)
    setMachineData({
      contractRef: params.get('ref') || '8X99-REL-04',
      machineId: params.get('mid') || 'ALUA-M-V1',
      sessionToken: Math.random().toString(36).substr(2, 9).toUpperCase()
    });

    return () => clearInterval(timer);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (partyA && partyB) {
      // Feedback vibrazione leggero
      if (navigator.vibrate) navigator.vibrate(50);
      setView('DASHBOARD');
    }
  };

  const handleReport = () => {
    setIsPressed(true);
    if (navigator.vibrate) navigator.vibrate(200); // Vibrazione più lunga per l'azione critica
    
    setTimeout(() => {
      setSystemStatus('REPORTED');
      setIsPressed(false);
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }, 800);
  };

  const resetSystem = () => {
    setSystemStatus('MONITORING');
  };

  const formattedTime = time.toLocaleTimeString('it-IT', { hour12: false });
  const formattedDate = time.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });

  // --- VISTA 1: IDENTIFICAZIONE (LOGIN) ---
  if (view === 'LOGIN') {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-white p-6 font-sans text-[#0a0a0a]">
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-700">
          
          {/* Header minimale */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-[0.3em] text-black">ALUA</h1>
            <p className="text-[0.6rem] uppercase tracking-widest text-gray-400">Identity Verification Protocol</p>
          </div>

          {/* Dati Macchina (Letti dal QR) */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-gray-400 border-b border-gray-200 pb-2 mb-2">
               <Server size={12} />
               <span className="text-[0.5rem] uppercase tracking-widest">Source Data (QR)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <span className="block text-[0.5rem] uppercase text-gray-400">Contract Ref</span>
                 <span className="font-mono text-xs">{machineData.contractRef}</span>
               </div>
               <div className="text-right">
                 <span className="block text-[0.5rem] uppercase text-gray-400">Machine ID</span>
                 <span className="font-mono text-xs">{machineData.machineId}</span>
               </div>
            </div>
          </div>

          {/* Form di Input */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <label className="text-[0.6rem] uppercase font-bold tracking-widest mb-1 block ml-1 text-gray-500">Subject A</label>
                <input 
                  type="text" 
                  value={partyA}
                  onChange={(e) => setPartyA(e.target.value)}
                  placeholder="Enter Name..."
                  className="w-full bg-transparent border-b border-black/20 py-3 px-1 text-lg font-mono focus:outline-none focus:border-black transition-colors uppercase placeholder:text-gray-300"
                  required
                />
              </div>
              <div className="relative group">
                <label className="text-[0.6rem] uppercase font-bold tracking-widest mb-1 block ml-1 text-gray-500">Subject B</label>
                <input 
                  type="text" 
                  value={partyB}
                  onChange={(e) => setPartyB(e.target.value)}
                  placeholder="Enter Name..."
                  className="w-full bg-transparent border-b border-black/20 py-3 px-1 text-lg font-mono focus:outline-none focus:border-black transition-colors uppercase placeholder:text-gray-300"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-black text-white py-4 mt-8 flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98]"
            >
              <span className="text-xs font-bold tracking-[0.2em] uppercase">Initialize Session</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
        
        <footer className="absolute bottom-6 text-[0.5rem] text-gray-300 font-mono uppercase tracking-widest">
          Secure Connection Established
        </footer>
      </div>
    );
  }

  // --- VISTA 2: INTERFACCIA PRINCIPALE (DASHBOARD) ---
  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-white font-sans text-[#0a0a0a] overflow-hidden relative">
      
      {/* Background Grid sottilissima */}
      <div className="absolute inset-0 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Header Fisso */}
      <header className="px-6 py-6 flex justify-between items-start bg-white/80 backdrop-blur-sm border-b border-gray-100 z-20 sticky top-0">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.2em] leading-none">ALUA</h1>
          <div className="flex items-center mt-2 space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${systemStatus === 'MONITORING' ? 'bg-green-400 animate-pulse' : 'bg-yellow-500'}`}></div>
            <p className="text-[0.5rem] uppercase tracking-widest text-gray-500">
              {systemStatus === 'MONITORING' ? 'System Active' : 'Processing Claim'}
            </p>
          </div>
        </div>
        <div className="text-right">
           <span className="font-mono text-[0.6rem] block">{formattedDate}</span>
           <span className="font-mono text-[0.6rem] text-gray-400 block">{formattedTime}</span>
        </div>
      </header>

      {/* Contenuto Scrollabile */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto pb-20">
        
        {/* Info Card: Dati Macchina + Nomi */}
        <div className="m-6 p-6 bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>
           
           <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4">
              <div>
                <span className="text-[0.5rem] uppercase tracking-widest text-gray-400 block mb-1">Linked Contract</span>
                <span className="font-mono text-sm tracking-wider">{machineData.contractRef}</span>
              </div>
              <button 
                onClick={() => setShowContract(true)} 
                className="bg-gray-50 hover:bg-black hover:text-white transition-colors px-3 py-1 text-[0.5rem] uppercase tracking-widest border border-gray-100 rounded-full flex items-center gap-1"
              >
                <FileText size={10} /> View Rules
              </button>
           </div>

           <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                      <span className="text-[0.45rem] uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">Subject A</span>
                      <span className="font-mono text-sm font-bold truncate uppercase">{partyA}</span>
                  </div>
                  <Users size={12} className="text-gray-200"/>
              </div>
              <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                      <span className="text-[0.45rem] uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">Subject B</span>
                      <span className="font-mono text-sm font-bold truncate uppercase">{partyB}</span>
                  </div>
                  <Users size={12} className="text-gray-200"/>
              </div>
           </div>
        </div>

        {/* Zona Azione (Pulsante) */}
        <div className={`flex-1 flex flex-col items-center justify-center py-8 transition-colors duration-700 ${systemStatus === 'REPORTED' ? 'bg-yellow-50/50' : ''}`}>
           
           <div className="mb-8 text-center px-8 h-16 flex items-center justify-center">
             {systemStatus === 'MONITORING' ? (
               <div className="text-[0.6rem] uppercase tracking-[0.15em] text-gray-500 leading-loose">
                  Tap button to log<br/>
                  <span className="text-black font-bold">contractual violation</span>
               </div>
             ) : (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-gray-100 p-4 shadow-sm w-full max-w-xs text-left">
                  <div className="flex items-center gap-2 text-yellow-600 mb-2 border-b border-gray-50 pb-2">
                     <Activity size={14} />
                     <span className="text-[0.6rem] font-bold uppercase tracking-widest">Report Logged</span>
                  </div>
                  <p className="font-mono text-[0.55rem] text-gray-400 leading-relaxed">
                     TOKEN: {machineData.sessionToken}<br/>
                     STATUS: UPLOADING EVIDENCE...
                  </p>
               </div>
             )}
           </div>

           {/* IL BOTTONE */}
           <div className="relative group">
              {/* Anelli decorativi */}
              <div className="absolute -inset-6 border border-gray-100 rounded-full"></div>
              <div className="absolute -inset-12 border border-gray-50 rounded-full"></div>

              <div className="w-48 h-48 rounded-full bg-white border border-gray-200 shadow-[10px_10px_30px_#eaeaeb,-10px_-10px_30px_#ffffff] flex items-center justify-center relative z-10">
                <button 
                  onClick={handleReport}
                  disabled={systemStatus === 'REPORTED'}
                  className={`
                    w-36 h-36 rounded-full transition-all duration-200 ease-out outline-none
                    flex flex-col items-center justify-center relative overflow-hidden
                    ${systemStatus === 'REPORTED' ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer active:scale-[0.95] hover:shadow-lg'}
                    shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,1)]
                  `}
                  style={{
                    background: systemStatus === 'MONITORING' 
                      ? 'radial-gradient(circle at 30% 30%, #ff3b30, #c41e3a)' // Rosso acceso ma clinico
                      : '#f3f4f6',
                  }}
                >
                    {/* Gloss effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
                    
                    {systemStatus === 'MONITORING' && (
                      <>
                        <AlertTriangle size={28} className="text-white mb-2" strokeWidth={1.5} />
                        <span className="text-white font-mono text-[0.6rem] tracking-[0.2em] font-bold">REPORT</span>
                      </>
                    )}
                    {systemStatus === 'REPORTED' && (
                      <ShieldCheck size={32} className="text-yellow-500/50" />
                    )}
                </button>
              </div>
           </div>

        </div>
      </main>

      {/* Footer Fisso */}
      <footer className="px-6 py-4 border-t border-gray-100 bg-white text-black flex justify-between items-center text-[0.5rem] uppercase tracking-widest">
        <div className="flex flex-col text-gray-400">
           <span>Unit ID: {machineData.machineId}</span>
        </div>
        {systemStatus === 'REPORTED' && (
           <button onClick={resetSystem} className="underline hover:text-red-600">New Report</button>
        )}
      </footer>

      {/* MODAL CONTRATTO */}
      {showContract && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-10 duration-300">
           <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <Database size={14} />
                 <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase">Contract Data</span>
              </div>
              <button onClick={() => setShowContract(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={18} />
              </button>
           </div>
           <div className="flex-1 overflow-y-auto p-8 font-mono text-xs text-gray-600 space-y-6 leading-relaxed">
              <p className="text-black font-bold border-b border-black pb-2">CONTRACT {machineData.contractRef}</p>
              <p>
                <strong>PARTIES:</strong><br/>
                A: {partyA || 'UNDEFINED'}<br/>
                B: {partyB || 'UNDEFINED'}
              </p>
              <p>
                <strong>PROTOCOL:</strong><br/>
                This digital interface serves as a binding communication channel for reporting behavioral deviations.
              </p>
              <p className="text-[0.6rem] text-gray-400 mt-8">
                GENERATED BY ALUA SYSTEMS.<br/>
                SESSION TOKEN: {machineData.sessionToken}
              </p>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;
