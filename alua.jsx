import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText, X, Radio, ShieldCheck, Activity, Users } from 'lucide-react';

const App = () => {
  const [systemStatus, setSystemStatus] = useState('MONITORING'); // MONITORING vs REPORTED
  const [isPressed, setIsPressed] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [time, setTime] = useState(new Date());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Stati per i dati personalizzabili via URL
  const [partyA, setPartyA] = useState({ name: 'ALESSANDRO V.', id: '9920-X' });
  const [partyB, setPartyB] = useState({ name: 'ELENA R.', id: '4421-Y' });
  const [contractRef, setContractRef] = useState('8X99-REL-04');

  // Aggiorna l'orologio e legge i parametri URL
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    // LOGICA DI LETTURA PARAMETRI URL (Per i QR Code)
    const params = new URLSearchParams(window.location.search);

    // Se ci sono parametri nell'URL, aggiorna i dati
    if (params.get('partyA_name')) {
      setPartyA({
        name: params.get('partyA_name').toUpperCase(),
        id: params.get('partyA_id') || 'ID-GENERIC'
      });
    }
    if (params.get('partyB_name')) {
      setPartyB({
        name: params.get('partyB_name').toUpperCase(),
        id: params.get('partyB_id') || 'ID-GENERIC'
      });
    }
    if (params.get('ref')) {
      setContractRef(params.get('ref'));
    }

    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e) => {
    if (window.innerWidth > 768) {
      const { clientX, clientY } = e;
      const moveX = clientX - window.innerWidth / 2;
      const moveY = clientY - window.innerHeight / 2;
      setMousePosition({ x: moveX * 0.005, y: moveY * 0.005 });
    }
  };

  const handleReport = () => {
    setIsPressed(true);
    if (navigator.vibrate) navigator.vibrate(100);

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

  // Texture rumore di fondo ottimizzata
  const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[#C0C0C0] font-sans text-[#0a0a0a] selection:bg-[#B0E0E6] p-4 md:p-0"
      onMouseMove={handleMouseMove}
      style={{
        backgroundImage: `linear-gradient(135deg, #E0E0E0 0%, #C0C0C0 100%)`,
      }}
    >
      {/* Noise Texture Layer */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: noiseBg }}></div>

      {/* Grid Overlay Layer */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)'
      }}></div>

      {/* Main Device Chassis */}
      <div
        className="relative w-full max-w-md bg-[#F5F5F5] shadow-2xl border border-white/50 flex flex-col md:h-auto md:min-h-[700px] rounded-sm overflow-hidden z-10 transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          boxShadow: '20px 20px 60px #a3a3a3, -20px -20px 60px #ffffff',
        }}
      >
        {/* Viti in alto rimosse per pulizia visiva */}

        {/* Viti in basso (solo decorative bottom) */}
        <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-[#d4d4d4] shadow-inner border border-[#b0b0b0] flex items-center justify-center z-20"><div className="w-1 h-[1px] bg-[#808080] rotate-45"></div></div>
        <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-[#d4d4d4] shadow-inner border border-[#b0b0b0] flex items-center justify-center z-20"><div className="w-1 h-[1px] bg-[#808080] rotate-45"></div></div>

        {/* Header */}
        <header className="pt-10 px-6 pb-4 flex justify-between items-start border-b border-[#0a0a0a]/10 bg-[#F5F5F5]">
          <div>
            <h1 className="text-3xl font-bold tracking-[0.2em] text-[#0a0a0a] leading-none">ALUA</h1>
            <div className="flex items-center mt-2 space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${systemStatus === 'MONITORING' ? 'bg-[#C1E1C1] animate-pulse' : 'bg-[#FFD700]'}`}></div>
              <p className="text-[0.5rem] uppercase tracking-widest text-[#666]">
                {systemStatus === 'MONITORING' ? 'Compliance Monitor' : 'Claim Processing'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-[0.6rem] text-[#0a0a0a] block">{formattedDate}</span>
            <span className="font-mono text-[0.6rem] text-[#888] block">{formattedTime} UTC+1</span>
          </div>
        </header>

        {/* Body Content */}
        <div className={`flex-1 flex flex-col relative transition-colors duration-700 ${systemStatus === 'REPORTED' ? 'bg-[#fffbe6]' : 'bg-[#F5F5F5]'}`}>

          {/* Contract Info Strip - CON NOMI VISIBILI */}
          <div className="px-6 py-5 border-b border-[#0a0a0a]/5 flex flex-col gap-4 bg-white/30 backdrop-blur-sm">
            {/* Top Row: Policy & Rules */}
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[0.45rem] uppercase tracking-widest text-[#888]">Active Policy Ref</span>
                <span className="font-mono text-xs tracking-wider">{contractRef}</span>
              </div>
              <button
                onClick={() => setShowContract(true)}
                disabled={systemStatus === 'REPORTED'}
                className={`
                     flex items-center gap-2 px-3 py-1.5 border border-[#0a0a0a]/20 hover:bg-[#0a0a0a] hover:text-white transition-all uppercase tracking-widest text-[0.5rem]
                     ${systemStatus === 'REPORTED' ? 'opacity-30 cursor-not-allowed' : ''}
                   `}
              >
                <FileText size={10} /> Stipulations
              </button>
            </div>

            {/* New Row: THE NAMES (Subject A / Subject B) */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#0a0a0a]/5">
              <div className="flex flex-col">
                <span className="text-[0.4rem] uppercase tracking-widest text-[#666] mb-1 flex items-center gap-1">
                  <Users size={8} /> Party A
                </span>
                <span className="font-mono text-[0.7rem] font-bold text-[#0a0a0a] truncate">{partyA.name}</span>
                <span className="font-mono text-[0.4rem] text-[#888]">{partyA.id}</span>
              </div>
              <div className="flex flex-col text-right items-end">
                <span className="text-[0.4rem] uppercase tracking-widest text-[#666] mb-1 flex items-center gap-1">
                  Party B <Users size={8} />
                </span>
                <span className="font-mono text-[0.7rem] font-bold text-[#0a0a0a] truncate">{partyB.name}</span>
                <span className="font-mono text-[0.4rem] text-[#888]">{partyB.id}</span>
              </div>
            </div>
          </div>

          {/* Main Interaction Zone */}
          <div className="flex-1 flex flex-col items-center justify-center py-8 relative">

            {/* Text Status */}
            <div className="mb-8 text-center h-20 flex items-center justify-center w-full px-8">
              {systemStatus === 'MONITORING' ? (
                <div className="text-[0.55rem] uppercase tracking-[0.2em] text-[#666] leading-loose">
                  Monitoring Partner Activity<br />
                  <span className="text-[#0a0a0a] font-bold">Report deviations immediately</span>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 text-[#B8860B] mb-2">
                    <Activity size={16} strokeWidth={1.5} />
                    <span className="text-xs font-bold uppercase tracking-widest">Violation Logged</span>
                  </div>
                  <div className="w-full bg-white border border-[#0a0a0a]/10 p-3 shadow-sm text-left">
                    <p className="font-mono text-[0.5rem] text-[#888] mb-1">STATUS REPORT:</p>
                    <p className="font-mono text-[0.6rem] text-[#0a0a0a] leading-relaxed">
                      {'>'} INCIDENT TIMESTAMPED<br />
                      {'>'} EVIDENCE BUFFER UPLOADED<br />
                      {'>'} INSURANCE AGENT ASSIGNED
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* THE BUTTON */}
            <div className="relative group z-10">
              {/* Caution Stripes */}
              <div className="absolute -inset-4 rounded-full border border-dashed border-[#0a0a0a]/20 animate-spin-slow opacity-30 pointer-events-none"></div>

              {/* Outer Ring */}
              <div className="w-56 h-56 rounded-full bg-[#E5E5E5] border border-white shadow-[-10px_-10px_30px_#ffffff,10px_10px_30px_#aeaec0] flex items-center justify-center">
                {/* Inner Ring */}
                <div className="w-44 h-44 rounded-full bg-[#d4d4d4] shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] flex items-center justify-center border border-[#c0c0c0]">

                  <button
                    onClick={handleReport}
                    disabled={systemStatus === 'REPORTED'}
                    className={`
                          w-32 h-32 rounded-full transition-all duration-200 ease-out outline-none
                          flex flex-col items-center justify-center relative overflow-hidden
                          ${systemStatus === 'REPORTED' ? 'cursor-not-allowed brightness-90 grayscale opacity-80' : 'cursor-pointer active:scale-[0.96] hover:shadow-[0px_0px_30px_rgba(196,30,58,0.4)]'}
                          ${isPressed ? 'scale-[0.96] shadow-[inset_0px_5px_15px_rgba(0,0,0,0.5)]' : 'shadow-[0px_10px_25px_rgba(160,0,40,0.3),inset_0px_2px_5px_rgba(255,255,255,0.4)]'}
                        `}
                    style={{
                      background: systemStatus === 'MONITORING'
                        ? 'radial-gradient(120% 120% at 30% 30%, #C41E3A 0%, #800020 100%)'
                        : '#e0e0e0',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-full"></div>

                    {systemStatus === 'MONITORING' && (
                      <>
                        <AlertTriangle size={24} className="text-white/90 mb-1" strokeWidth={1.5} />
                        <span className="text-white/90 font-mono text-[0.55rem] tracking-[0.2em] font-bold mt-1">REPORT</span>
                        <span className="text-white/50 font-mono text-[0.4rem] tracking-widest">VIOLATION</span>
                      </>
                    )}
                    {systemStatus === 'REPORTED' && (
                      <ShieldCheck size={32} className="text-[#B8860B] opacity-50" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-[#E8E8E8] p-4 border-t border-white flex justify-between items-center text-[#0a0a0a] z-20">
            <div className="flex flex-col">
              <span className="font-mono text-[0.45rem] uppercase tracking-widest text-[#666]">Device ID</span>
              <span className="font-mono text-[0.5rem]">ALUA</span>
            </div>
            <div className="flex items-center space-x-2">
              {systemStatus === 'REPORTED' && (
                <button onClick={resetSystem} className="text-[0.5rem] underline text-[#888] uppercase tracking-widest mr-4 hover:text-[#0a0a0a]">
                  [ New Report ]
                </button>
              )}
              <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${systemStatus === 'MONITORING' ? 'bg-[#0a0a0a]' : 'bg-[#B8860B]'}`}></div>
              <span className="font-mono text-[0.5rem] tracking-widest uppercase">
                {systemStatus === 'MONITORING' ? 'Observing' : 'Processing'}
              </span>
            </div>
          </footer>

          {/* CONTRACT MODAL */}
          {showContract && (
            <div className="absolute inset-0 z-50 bg-[#F5F5F5]/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom-10 duration-300">
              <div className="p-6 border-b border-[#0a0a0a]/10 flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-2">
                  <FileText size={14} />
                  <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase">Rules of Conduct</span>
                </div>
                <button
                  onClick={() => setShowContract(false)}
                  className="p-2 hover:bg-[#0a0a0a]/5 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 font-mono text-[0.65rem] text-[#333] space-y-4 leading-relaxed custom-scrollbar">
                <p className="uppercase tracking-widest font-bold text-[#0a0a0a] mb-4 border-b border-black pb-2">Policy Ref: {contractRef}</p>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio size={12} className="text-[#800020]" />
                    <strong className="text-[#0a0a0a]">REPORTING PROTOCOL</strong>
                  </div>
                  <p>Use the main interface button to signal immediate breaches of the following stipulations. False reporting carries a penalty to the user's Trust Score.</p>
                </div>

                <p>
                  <strong className="block text-[#0a0a0a] mb-1">§1. EMOTIONAL FIDELITY</strong>
                  Any detected emotional variance exceeding 15% towards third parties must be reported.
                </p>

                <p>
                  <strong className="block text-[#0a0a0a] mb-1">§2. TIME ALLOCATION</strong>
                  Failure to provide the agreed minimum of 20 hours/week of quality interaction is grounds for a Level 1 Alert.
                </p>

                <p className="bg-[#E0E0E0] p-2 border-l-2 border-[#800020]">
                  <strong className="block text-[#800020] mb-1">§3. INSURANCE ACTION</strong>
                  Upon receiving a Violation Signal, ALUA will freeze joint assets and initiate a logic-based arbitration process.
                </p>

                <div className="mt-8 pt-4 border-t border-dashed border-[#ccc] flex justify-between text-[0.5rem] text-[#888]">
                  <span>MONITORING ACTIVE</span>
                  <span>SENSORS: CALIBRATED</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default App;
