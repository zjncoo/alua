import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react'; // Re-import AlertTriangle

const App = () => {
  // Stati dell'app
  const [view, setView] = useState('LOGIN'); // LOGIN o DASHBOARD
  const [systemStatus, setSystemStatus] = useState('MONITORING'); 
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

  // --- EFFETTO 1: INIZIALIZZAZIONE E MEMORIA ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const params = new URLSearchParams(window.location.search);
    
    // 1. Setup Dati Macchina (dal QR o default)
    setMachineData({
      contractRef: params.get('ref') || '8X99-REL-04',
      machineId: params.get('mid') || 'ALUA-M-V1',
      sessionToken: Math.random().toString(36).substr(2, 9).toUpperCase()
    });

    // 2. Gestione Nomi (QR vs Memoria)
    const urlPartyA = params.get('partyA_name');
    const urlPartyB = params.get('partyB_name');
    const storedPartyA = localStorage.getItem('alua_partyA');
    const storedPartyB = localStorage.getItem('alua_partyB');

    if (urlPartyA && urlPartyB) {
        // Priorità al QR Code: se il link ha nomi, usali e salvali
        setPartyA(urlPartyA);
        setPartyB(urlPartyB);
        localStorage.setItem('alua_partyA', urlPartyA);
        localStorage.setItem('alua_partyB', urlPartyB);
        setView('DASHBOARD');
    } else if (storedPartyA && storedPartyB) {
        // Se non c'è QR ma c'è memoria, recupera i nomi
        setPartyA(storedPartyA);
        setPartyB(storedPartyB);
        setView('DASHBOARD');
    }

    return () => clearInterval(timer);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (partyA && partyB) {
      // Salva in memoria al login manuale
      localStorage.setItem('alua_partyA', partyA);
      localStorage.setItem('alua_partyB', partyB);
      
      if (navigator.vibrate) navigator.vibrate(50);
      setView('DASHBOARD');
    }
  };

  const handleDisconnect = () => {
      // Cancella memoria e torna al login
      localStorage.removeItem('alua_partyA');
      localStorage.removeItem('alua_partyB');
      setPartyA('');
      setPartyB('');
      setView('LOGIN');
      setSystemStatus('MONITORING');
  };

  const handleReport = () => {
    setIsPressed(true);
    if (navigator.vibrate) navigator.vibrate(200);
    
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
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-white p-8 font-bergen-mono text-black">
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');

            .font-neue-haas { font-family: 'Inter', sans-serif; }
            .font-bergen-mono { font-family: 'Roboto Mono', monospace; }
          `}
        </style>
        <div className="w-full max-w-md space-y-12 animate-in fade-in duration-700 flex flex-col items-start">
          
          {/* LOGO ALUA (Text-based for clean aesthetic) */}
          <div className="mb-2 w-full border-b-2 border-black pb-4">
            <h1 className="text-6xl font-bold tracking-tighter font-neue-haas text-black">ALUA</h1>
          </div>

          <p className="text-xs uppercase tracking-widest text-gray-500 text-left font-bergen-mono">Protocollo Verifica Identità</p>

          {/* Dati Macchina */}
          <div className="w-full border-2 border-gray-200 p-6 space-y-4 mt-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
               <span className="text-xs uppercase tracking-widest font-bergen-mono text-gray-500">Dati Sorgente</span>
               <div className="w-2 h-2 bg-black"></div>
            </div>
            <div className="grid grid-cols-2 gap-8 font-bergen-mono">
               <div>
                 <span className="block text-xs uppercase text-gray-500 mb-1">Rif. Contratto</span>
                 <span className="text-sm">{machineData.contractRef}</span>
               </div>
               <div>
                 <span className="block text-xs uppercase text-gray-500 mb-1">ID Macchina</span>
                 <span className="text-sm">{machineData.machineId}</span>
               </div>
            </div>
          </div>

          {/* Form di Input */}
          <form onSubmit={handleLogin} className="space-y-8 w-full font-bergen-mono">
            <div className="space-y-6">
              <div className="relative group">
                <label className="text-xs uppercase font-bold tracking-widest mb-2 block text-black">Soggetto A</label>
                <input 
                  type="text" 
                  value={partyA}
                  onChange={(e) => setPartyA(e.target.value.toUpperCase())}
                  placeholder="INSERISCI NOME..."
                  className="w-full bg-transparent border-2 border-black p-4 text-lg focus:outline-none focus:bg-gray-50 transition-colors uppercase placeholder:text-gray-400"
                  required
                />
              </div>
              <div className="relative group">
                <label className="text-xs uppercase font-bold tracking-widest mb-2 block text-black">Soggetto B</label>
                <input 
                  type="text" 
                  value={partyB}
                  onChange={(e) => setPartyB(e.target.value.toUpperCase())}
                  placeholder="INSERISCI NOME..."
                  className="w-full bg-transparent border-2 border-black p-4 text-lg focus:outline-none focus:bg-gray-50 transition-colors uppercase placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-black text-white py-6 mt-12 flex items-center justify-between px-6 hover:bg-gray-900 transition-all active:scale-[0.99] border-2 border-black"
            >
              <span className="text-sm font-bold tracking-widest uppercase font-neue-haas">Inizializza Sessione</span>
              <span className="text-xl">→</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA 2: INTERFACCIA PRINCIPALE (DASHBOARD) ---
  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-white font-bergen-mono text-black overflow-hidden relative">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');

          .font-neue-haas { font-family: 'Inter', sans-serif; }
          .font-bergen-mono { font-family: 'Roboto Mono', monospace; }
        `}
      </style>
      
      {/* Header Fisso */}
      <header className="px-8 py-8 flex justify-between items-start bg-white border-b-2 border-black z-20 sticky top-0">
        <div>
          {/* LOGO ALUA (Text-based) */}
          <h1 className="text-4xl font-bold tracking-tighter font-neue-haas text-black mb-2">ALUA</h1>
          
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 ${systemStatus === 'MONITORING' ? 'bg-black animate-pulse' : 'bg-gray-400'}`}></div>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bergen-mono">
              {systemStatus === 'MONITORING' ? 'Sistema Attivo' : 'Elaborazione Sinistro'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 font-bergen-mono">
           <div className="text-right">
             <span className="text-xs block mb-1">{formattedDate}</span>
             <span className="text-xs text-gray-400 block">{formattedTime}</span>
           </div>
           {/* Tasto Disconnect */}
           <button onClick={handleDisconnect} className="text-xs uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-2 cursor-pointer z-50 mt-2">
              [ RESET ID ]
           </button>
        </div>
      </header>

      {/* Contenuto Scrollabile */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto p-8">
        
        {/* Info Card */}
        <div className="border-2 border-black p-8 mb-8 space-y-8 bg-white">
           <div className="flex justify-between items-start border-b border-gray-200 pb-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-gray-500 block mb-2 font-bergen-mono">Contratto Collegato</span>
                <span className="font-bergen-mono text-lg tracking-wider">{machineData.contractRef}</span>
              </div>
              <button 
                onClick={() => setShowContract(true)} 
                className="bg-white hover:bg-gray-50 transition-colors px-6 py-3 text-xs uppercase tracking-widest border-2 border-black font-bergen-mono flex items-center gap-2"
              >
                Consulta Contratto
              </button>
           </div>

           <div className="grid grid-cols-2 gap-8 font-bergen-mono">
              <div>
                  <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">Soggetto A</span>
                      <span className="text-xl font-bold truncate uppercase">{partyA}</span>
                  </div>
              </div>
              <div>
                  <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">Soggetto B</span>
                      <span className="text-xl font-bold truncate uppercase">{partyB}</span>
                  </div>
              </div>
           </div>
        </div>

        {/* Zona Azione */}
        <div className={`flex-1 flex flex-col items-center justify-center py-12 transition-colors duration-700 ${systemStatus === 'REPORTED' ? 'bg-gray-50' : ''} border-2 border-gray-200`}>
           
           <div className="mb-12 text-center px-8 h-24 flex items-center justify-center w-full">
             {systemStatus === 'MONITORING' ? (
               <div className="text-sm uppercase tracking-[0.15em] text-gray-500 leading-loose font-bergen-mono">
                  Premi per segnalare<br/>
                  <span className="text-black font-bold font-neue-haas">violazione contrattuale</span>
               </div>
             ) : (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border-2 border-black p-6 w-full max-w-md text-left">
                  <div className="flex items-center gap-3 text-black mb-4 border-b-2 border-black pb-4">
                     <div className="w-3 h-3 bg-black"></div>
                     <span className="text-sm font-bold uppercase tracking-widest font-neue-haas">Segnalazione Registrata</span>
                  </div>
                  <p className="font-bergen-mono text-xs text-gray-600 leading-relaxed">
                     TOKEN: {machineData.sessionToken}<br/>
                     STATO: CARICAMENTO PROVE...
                  </p>
               </div>
             )}
           </div>

           {/* IL BOTTONE TONDO E ROSSO */}
           <div className="relative group w-64 h-64 flex items-center justify-center">
              {/* Anelli decorativi */}
              <div className="absolute -inset-4 border border-gray-200 rounded-full pointer-events-none"></div>
              <div className="absolute -inset-8 border border-gray-100 rounded-full opacity-50 pointer-events-none"></div>

              <button 
                onClick={handleReport}
                disabled={systemStatus === 'REPORTED'}
                className={`
                  w-full h-full rounded-full transition-all duration-200 ease-out outline-none
                  flex flex-col items-center justify-center relative overflow-hidden
                  ${systemStatus === 'REPORTED' ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.95] hover:shadow-xl'}
                  border-4 border-white/20 shadow-lg
                `}
                style={{
                  background: systemStatus === 'MONITORING' 
                    ? 'radial-gradient(circle at 30% 30%, #dc2626, #991b1b)' 
                    : '#f3f4f6',
                  color: systemStatus === 'MONITORING' ? 'white' : '#9ca3af'
                }}
              >
                  {/* Gloss effect */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-full"></div>
                  
                  {systemStatus === 'MONITORING' && (
                    <>
                      <AlertTriangle size={32} className="text-white mb-2 opacity-80" strokeWidth={1.5} />
                      <span className="font-neue-haas text-lg tracking-[0.1em] font-bold">SEGNALA</span>
                      <span className="font-bergen-mono text-[0.6rem] tracking-[0.2em] font-medium mt-1 opacity-70 uppercase">Violazione</span>
                    </>
                  )}
                  {systemStatus === 'REPORTED' && (
                    <span className="font-neue-haas text-lg tracking-[0.1em] font-bold">SEGNALATO</span>
                  )}
              </button>
           </div>

        </div>
      </main>

      {/* Footer Fisso */}
      <footer className="px-8 py-6 border-t-2 border-black bg-white text-black flex justify-between items-center text-xs uppercase tracking-widest font-bergen-mono z-20">
        <div className="flex flex-col text-gray-500">
           <span>ID Unità: {machineData.machineId}</span>
        </div>
        {systemStatus === 'REPORTED' && (
           <button onClick={resetSystem} className="underline hover:text-black">[ Nuova Segnalazione ]</button>
        )}
      </footer>

      {/* MODAL CONTRATTO */}
      {showContract && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-300 font-bergen-mono">
           <div className="p-8 border-b-2 border-black flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-black"></div>
                 <span className="text-sm font-bold tracking-[0.2em] uppercase font-neue-haas">Dati Contratto</span>
              </div>
              <button onClick={() => setShowContract(false)} className="p-4 hover:bg-gray-50 border-2 border-black transition-colors">
                <span className="text-xl">✕</span>
              </button>
           </div>
           <div className="flex-1 overflow-y-auto p-12 font-bergen-mono text-sm text-black space-y-10 leading-relaxed bg-white">
              <p className="font-bold border-b-2 border-black pb-4 font-neue-haas text-lg">CONTRATTO {machineData.contractRef}</p>
              <div className="space-y-4">
                <p className="uppercase tracking-widest text-gray-500 text-xs mb-2">PARTI</p>
                <p className="pl-4 border-l-2 border-gray-200">
                  A: {partyA || 'NON DEFINITO'}<br/>
                  B: {partyB || 'NON DEFINITO'}
                </p>
              </div>
              <div className="space-y-4">
                <p className="uppercase tracking-widest text-gray-500 text-xs mb-2">PROTOCOLLO</p>
                <p className="pl-4 border-l-2 border-gray-200">
                  Questa interfaccia digitale funge da canale di comunicazione vincolante per la segnalazione di deviazioni comportamentali.
                </p>
              </div>
              <div className="mt-16 pt-8 border-t-2 border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-widest">
                  GENERATO DA ALUA SYSTEMS.<br/>
                  TOKEN SESSIONE: {machineData.sessionToken}
                </p>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;
