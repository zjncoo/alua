import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText, ArrowRight, ShieldCheck, Activity, Users, Server, Database, X, LogOut } from 'lucide-react';

const App = () => {
  // Stati dell'app
  const [view, setView] = useState('LOGIN'); 
  const [systemStatus, setSystemStatus] = useState('MONITORING'); 
  const [isPressed, setIsPressed] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [time, setTime] = useState(new Date());
  
  // Dati
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');
  
  // DATI DEL CONTRATTO (Arrivano dal QR Code Python)
  const [contractData, setContractData] = useState({
    type: 'STANDARD',
    tier: '1',
    scl: '0',
    hrv: '0',
    ref: 'UNK-00'
  });

  const [machineData, setMachineData] = useState({
    machineId: 'DEV-01',
    sessionToken: '---'
  });

  // --- EFFETTO 1: INIZIALIZZAZIONE E MEMORIA ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // LEGGIAMO I PARAMETRI DAL QR CODE PYTHON
    const params = new URLSearchParams(window.location.search);
    
    const qrType = params.get('type') || 'NON DEFINITO';
    const qrTier = params.get('tier') || '1';
    const qrScl = params.get('scl') || '0';
    const qrHrv = params.get('hrv') || '0';
    
    // Generiamo un riferimento contratto basato sulla data se non c'è
    const generatedRef = `REL-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`;

    setContractData({
      type: qrType.replace(/-/g, ' + '), // Gestisce multi-relazione
      tier: qrTier,
      scl: qrScl,
      hrv: qrHrv,
      ref: generatedRef
    });

    setMachineData({
      machineId: 'ALUA-M-V1',
      sessionToken: Math.random().toString(36).substr(2, 9).toUpperCase()
    });

    // Gestione Nomi (Se l'utente li ha già inseriti in passato sul telefono)
    const storedPartyA = localStorage.getItem('alua_partyA');
    const storedPartyB = localStorage.getItem('alua_partyB');

    if (storedPartyA && storedPartyB) {
        setPartyA(storedPartyA);
        setPartyB(storedPartyB);
        setView('DASHBOARD');
    }

    return () => clearInterval(timer);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (partyA && partyB) {
      localStorage.setItem('alua_partyA', partyA);
      localStorage.setItem('alua_partyB', partyB);
      if (navigator.vibrate) navigator.vibrate(50);
      setView('DASHBOARD');
    }
  };

  const handleDisconnect = () => {
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
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-white p-6 font-sans text-[#0a0a0a]">
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-700 flex flex-col items-center">
          
          <div className="mb-4">
            <h1 className="text-4xl font-bold tracking-[0.3em]">ALUA</h1>
          </div>

          <p className="text-[0.6rem] uppercase tracking-widest text-gray-400 text-center">Protocollo Verifica Identità</p>

          {/* Dati Importati dal QR */}
          <div className="w-full bg-gray-50 border border-gray-100 p-4 rounded-sm space-y-2 mt-8">
            <div className="flex items-center gap-2 text-gray-400 border-b border-gray-200 pb-2 mb-2">
               <Server size={12} />
               <span className="text-[0.5rem] uppercase tracking-widest">Dati Biometrici Rilevati</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <span className="block text-[0.5rem] uppercase text-gray-400">Relazione</span>
                 <span className="font-mono text-xs font-bold">{contractData.type}</span>
               </div>
               <div className="text-right">
                 <span className="block text-[0.5rem] uppercase text-gray-400">Fascia Rischio</span>
                 <span className="font-mono text-xs font-bold text-red-600">LIV. {contractData.tier}</span>
               </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 w-full">
            <div className="space-y-4">
              <div className="relative group">
                <label className="text-[0.6rem] uppercase font-bold tracking-widest mb-1 block ml-1 text-gray-500">Contraente A</label>
                <input 
                  type="text" 
                  value={partyA}
                  onChange={(e) => setPartyA(e.target.value.toUpperCase())}
                  placeholder="Nome Cognome"
                  className="w-full bg-transparent border-b border-black/20 py-3 px-1 text-lg font-mono focus:outline-none focus:border-black transition-colors uppercase placeholder:text-gray-300"
                  required
                />
              </div>
              <div className="relative group">
                <label className="text-[0.6rem] uppercase font-bold tracking-widest mb-1 block ml-1 text-gray-500">Contraente B</label>
                <input 
                  type="text" 
                  value={partyB}
                  onChange={(e) => setPartyB(e.target.value.toUpperCase())}
                  placeholder="Nome Cognome"
                  className="w-full bg-transparent border-b border-black/20 py-3 px-1 text-lg font-mono focus:outline-none focus:border-black transition-colors uppercase placeholder:text-gray-300"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-black text-white py-4 mt-8 flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98]"
            >
              <span className="text-xs font-bold tracking-[0.2em] uppercase">Attiva Contratto</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA 2: DASHBOARD ---
  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-white font-sans text-[#0a0a0a] overflow-hidden relative">
      
      <div className="absolute inset-0 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <header className="px-6 py-6 flex justify-between items-start bg-white/80 backdrop-blur-sm border-b border-gray-100 z-20 sticky top-0">
        <div>
          <span className="text-2xl font-bold tracking-[0.2em]">ALUA</span>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${systemStatus === 'MONITORING' ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
            <p className="text-[0.5rem] uppercase tracking-widest text-gray-500">
              {systemStatus === 'MONITORING' ? 'Contratto Attivo' : 'Violazione Rilevata'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="text-right">
             <span className="font-mono text-[0.6rem] block">{formattedDate}</span>
             <span className="font-mono text-[0.6rem] text-gray-400 block">{formattedTime}</span>
           </div>
           <button onClick={handleDisconnect} className="text-[0.5rem] uppercase tracking-widest text-gray-400 hover:text-red-600 flex items-center gap-1 cursor-pointer z-50">
              <LogOut size={10} /> Esci
           </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto pb-20">
        
        <div className="m-6 p-6 bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-sm relative overflow-hidden">
           <div className={`absolute top-0 left-0 w-1 h-full ${contractData.tier === '4' ? 'bg-red-600' : 'bg-black'}`}></div>
           
           <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4">
             <div>
               <span className="text-[0.5rem] uppercase tracking-widest text-gray-400 block mb-1">Rif. Contratto</span>
               <span className="font-mono text-sm tracking-wider">{contractData.ref}</span>
             </div>
             <button 
               onClick={() => setShowContract(true)} 
               className="bg-gray-50 hover:bg-black hover:text-white transition-colors px-3 py-1 text-[0.5rem] uppercase tracking-widest border border-gray-100 rounded-full flex items-center gap-1"
             >
               <FileText size={10} /> Leggi
             </button>
           </div>

           <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                      <span className="text-[0.45rem] uppercase tracking-widest text-gray-400 mb-1">Soggetto A</span>
                      <span className="font-mono text-sm font-bold truncate uppercase">{partyA}</span>
                  </div>
                  <Users size={12} className="text-gray-200"/>
              </div>
              <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                      <span className="text-[0.45rem] uppercase tracking-widest text-gray-400 mb-1">Soggetto B</span>
                      <span className="font-mono text-sm font-bold truncate uppercase">{partyB}</span>
                  </div>
                  <Users size={12} className="text-gray-200"/>
              </div>
           </div>
           
           {/* Mini report biometrico */}
           <div className="mt-4 pt-4 border-t border-dashed border-gray-100 grid grid-cols-3 gap-2 text-center">
                <div>
                    <span className="block text-[0.4rem] text-gray-400">STRESS</span>
                    <span className="font-mono text-xs">{contractData.scl}%</span>
                </div>
                <div>
                    <span className="block text-[0.4rem] text-gray-400">HRV</span>
                    <span className="font-mono text-xs">{contractData.hrv}</span>
                </div>
                <div>
                    <span className="block text-[0.4rem] text-gray-400">RISCHIO</span>
                    <span className={`font-mono text-xs font-bold ${contractData.tier === '4' ? 'text-red-600' : 'text-black'}`}>F.{contractData.tier}</span>
                </div>
           </div>
        </div>

        {/* Zona Azione */}
        <div className={`flex-1 flex flex-col items-center justify-center py-8 transition-colors duration-700 ${systemStatus === 'REPORTED' ? 'bg-red-50' : ''}`}>
           
           <div className="mb-8 text-center px-8 h-16 flex items-center justify-center">
             {systemStatus === 'MONITORING' ? (
               <div className="text-[0.6rem] uppercase tracking-[0.15em] text-gray-500 leading-loose">
                  Premi per segnalare<br/>
                  <span className="text-black font-bold">violazione contrattuale</span>
               </div>
             ) : (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-red-100 p-4 shadow-sm w-full max-w-xs text-left">
                  <div className="flex items-center gap-2 text-red-600 mb-2 border-b border-gray-50 pb-2">
                     <AlertTriangle size={14} />
                     <span className="text-[0.6rem] font-bold uppercase tracking-widest">Sinistro Aperto</span>
                  </div>
                  <p className="font-mono text-[0.55rem] text-gray-400 leading-relaxed">
                      L'INCIDENTE È STATO REGISTRATO.<br/>
                      PENALE APPLICATA AUTOMATICAMENTE.<br/>
                      IN ATTESA DI AUDITOR.
                  </p>
               </div>
             )}
           </div>

           <div className="relative group">
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
                      ? 'radial-gradient(circle at 30% 30%, #ff3b30, #c41e3a)' 
                      : '#f3f4f6',
                  }}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
                    
                    {systemStatus === 'MONITORING' && (
                      <>
                        <AlertTriangle size={28} className="text-white mb-2" strokeWidth={1.5} />
                        <span className="text-white font-mono text-[0.6rem] tracking-[0.2em] font-bold">SEGNALA</span>
                      </>
                    )}
                    {systemStatus === 'REPORTED' && (
                      <ShieldCheck size={32} className="text-red-500/50" />
                    )}
                </button>
              </div>
           </div>

        </div>
      </main>

      <footer className="px-6 py-4 border-t border-gray-100 bg-white text-black flex justify-between items-center text-[0.5rem] uppercase tracking-widest">
        <div className="flex flex-col text-gray-400">
           <span>Sessione: {machineData.sessionToken}</span>
        </div>
        {systemStatus === 'REPORTED' && (
           <button onClick={resetSystem} className="underline hover:text-red-600">Reset Stato</button>
        )}
      </footer>

      {/* MODAL CONTRATTO DINAMICO */}
      {showContract && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom-10 duration-300">
           <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                 <Database size={14} />
                 <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase">Dati Contratto</span>
              </div>
              <button onClick={() => setShowContract(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={18} />
              </button>
           </div>
           <div className="flex-1 overflow-y-auto p-8 font-mono text-xs text-gray-600 space-y-6 leading-relaxed">
              <p className="text-black font-bold border-b border-black pb-2">RIF: {contractData.ref}</p>
              
              <div className="bg-gray-50 p-4 border border-gray-200">
                <strong>PARAMETRI BIOMETRICI INIZIALI:</strong><br/>
                SCL (Stress): {contractData.scl}%<br/>
                HRV (Heart): {contractData.hrv}
              </div>

              <p>
                <strong>TIPO RELAZIONE:</strong> {contractData.type}<br/>
                <strong>FASCIA DI RISCHIO:</strong> {contractData.tier}
              </p>

              <p>
                <strong>CLAUSOLE ATTIVE:</strong><br/>
                In base alla fascia di rischio {contractData.tier}, si applicano gli articoli da 1 a {parseInt(contractData.tier) * 5} del Codice ALUA.
              </p>

              {contractData.tier === '4' && (
                 <p className="text-red-600 font-bold border border-red-600 p-2">
                    ATTENZIONE: CESSIONE SOVRANITÀ ATTIVA.<br/>
                    Le parti non hanno potere decisionale su spese superiori a 500€.
                 </p>
              )}

              <p className="text-[0.6rem] text-gray-400 mt-8">
                FIRMATA DIGITALMENTE DA:<br/>
                {partyA} & {partyB}
              </p>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;
