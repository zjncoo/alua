import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText, ArrowRight, ShieldCheck, Activity, Users, Server, Database, X, LogOut, CheckCircle } from 'lucide-react';

// MAPPING CLAUSOLE (Coerente con Python contract_generator.py)
// MAPPING TESTI (Chiavi da monitor_arduino.py -> Testi da contract_generator.py)
const CLAUSE_MAPPING = {
  CONOSCENZA: "Esplorazione preliminare.",    // Match CONOSCENZA
  ROMANTICA: "Tensione attrattiva e vulnerabilità emotiva.", // Match ROMANTICA
  LAVORATIVA: "Collaborazione formale, efficienza prioritaria.", // LAVORATIVA -> PROFESSIONALE text
  AMICALE: "Supporto reciproco, tempo non strutturato.", // AMICALE -> AMICIZIA text
  FAMILIARE: "Legame di appartenenza e obblighi impliciti.", // Match FAMILIARE
  CONVIVENZA: "Condivisione di spazi riservati." // CONVIVENZA -> INTIMO text
};

// Ordine esatto dei bottoni in monitor_arduino.py
const RELAZIONI_KEYS = ['CONOSCENZA', 'ROMANTICA', 'LAVORATIVA', 'AMICALE', 'FAMILIARE', 'CONVIVENZA'];

const LissajousFigure = ({ gsr0, gsr1, compatibility }) => {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 1. Parametri (Esattamente come lissajous.py)
    // val_gsr è la media, qui usiamo la media di gsr0 e gsr1 passati
    const val_gsr = (gsr0 + gsr1) / 2;
    const val_compat = compatibility;

    const freq_x = 1 + Math.floor((val_gsr / 1000.0) * 12);
    let freq_y = freq_x + 1;
    if (freq_y === freq_x) freq_y += 1;

    const delta = (val_compat / 100.0) * Math.PI;

    // 2. Rendering
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = '#000000'; // Nero (o rosso come in python? Python usa rosso, qui layout è BW)
    ctx.lineWidth = 2;

    const cx = width / 2;
    const cy = height / 2;
    const radius = (Math.min(width, height) / 2) - 10; // Padding
    const steps = 1000;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 2 * Math.PI;
      // x = sin(freq_x * t + delta)
      // y = sin(freq_y * t)
      const x = cx + radius * Math.sin(freq_x * t + delta);
      const y = cy + radius * Math.sin(freq_y * t);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

  }, [gsr0, gsr1, compatibility]);

  return <canvas ref={canvasRef} width={256} height={256} className="w-full h-full" />;
};

const App = () => {
  // Stati dell'app
  const [view, setView] = useState('LOGIN'); // LOGIN o DASHBOARD
  const [systemStatus, setSystemStatus] = useState('MONITORING');
  const [isPressed, setIsPressed] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [time, setTime] = useState(new Date());

  // Dati Sessione
  const [partyA, setPartyA] = useState('');
  const [partyB, setPartyB] = useState('');

  // Dati Contratto (Ricostruiti da QR)
  const [contractData, setContractData] = useState({
    id: 'UNK-00', // da 'id'
    date: '00.00.0000', // da 'date'
    machineId: 'ALUA-M-V1',
    sessionToken: '---',
    compatibility: 0, // da 'comp'
    riskBand: 1, // da 'fascia'
    cost: '0,00€', // da 'cost'
    weakLink: null, // da 'bad' (-1, 0, 1)
    clausesText: "Dati non disponibili.", // Ricostruito da btn0/btn1
    rawScl: { a: 0, b: 0 } // da gsr0/gsr1
  });

  // --- EFFETTO 1: INIZIALIZZAZIONE E PARSING URL ---
  const [debugParams, setDebugParams] = useState({});
  const [missingData, setMissingData] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    const params = new URLSearchParams(window.location.search);

    // DEBUG: Save all params to state
    const debugObj = {};
    for (const [key, value] of params.entries()) {
      debugObj[key] = value;
    }
    setDebugParams(debugObj);

    // --- PARSING NUOVI PARAMETRI (Coerenza Totale) ---
    const q_id = params.get('id') || 'UNK-00';
    const q_date = params.get('date') || formattedDate;
    const q_comp = parseInt(params.get('comp') || '50');
    const q_bad = parseInt(params.get('bad') || '-1');
    const q_fascia = parseInt(params.get('fascia') || '1');
    const q_cost = params.get('cost') || '0,00€';
    // const q_phrase = params.get('phrase') || ""; // Se servisse visualizzarla

    // Parsing SCL e Medie
    const q_scl0 = parseInt(params.get('scl0') || '0');
    const q_scl1 = parseInt(params.get('scl1') || '0');
    const q_avg0 = parseInt(params.get('avg0') || params.get('scl0') || '0');
    const q_avg1 = parseInt(params.get('avg1') || params.get('scl1') || '0');

    // Parsing Clausole (RAW TYPES separati da virgola)
    const raw_types = (params.get('types') || '').split(',').filter(x => x);

    // Generazione testo diretta
    let generatedClause = "Clausola Default: Relazione indefinita.";
    if (raw_types.length > 0) {
      // Mappa le chiavi raw nel testo usando la mappa definita (che ora è allineata a contract_generator)
      generatedClause = raw_types.map(k => CLAUSE_MAPPING[k] || k).join(" ");
    } else {
      // Fallback vecchi QR (retrocompatibilità se necessario, o rimuovibile)
      const btn0_idx = (params.get('btn0') || '').split(',').filter(x => x).map(Number);
      const btn1_idx = (params.get('btn1') || '').split(',').filter(x => x).map(Number);
      if (btn0_idx.length > 0 || btn1_idx.length > 0) {
        const keys0 = btn0_idx.map(i => RELAZIONI_KEYS[i]).filter(k => k);
        const keys1 = btn1_idx.map(i => RELAZIONI_KEYS[i]).filter(k => k);
        const allbox = Array.from(new Set([...keys0, ...keys1]));
        if (allbox.length > 0) generatedClause = allbox.map(k => CLAUSE_MAPPING[k] || "").join(" ");
      }
    }

    setContractData({
      id: q_id,
      date: q_date, // Nuova
      machineId: params.get('mid') || 'ALUA-M-V1',
      sessionToken: Math.random().toString(36).substr(2, 9).toUpperCase(),
      compatibility: q_comp,
      riskBand: q_fascia,
      cost: q_cost, // Nuova
      weakLink: q_bad,
      clausesText: generatedClause,
      rawScl: { a: q_scl0, b: q_scl1 },
      avgScl: { a: q_avg0, b: q_avg1 } // Per Lissajous
    });

    // Gestione Nomi (QR vs Memoria)
    const urlPartyA = params.get('partyA_name');
    const urlPartyB = params.get('partyB_name');
    const storedPartyA = localStorage.getItem('alua_partyA');
    const storedPartyB = localStorage.getItem('alua_partyB');

    // CHECK DATA PRESENCE
    // Se comp non c'è, significa che stiamo usando i default.
    if (!params.get('comp')) {
      setMissingData(true);
    }

    if (urlPartyA && urlPartyB) {
      setPartyA(urlPartyA);
      setPartyB(urlPartyB);
      localStorage.setItem('alua_partyA', urlPartyA);
      localStorage.setItem('alua_partyB', urlPartyB);
      setView('DASHBOARD');
    } else if (storedPartyA && storedPartyB) {
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

  // Helper per Weak Link Text
  const getWeakLinkText = () => {
    if (contractData.weakLink === 0) return `NOTA CRITICA: Instabilità rilevata in CONTRAENTE A.`;
    if (contractData.weakLink === 1) return `NOTA CRITICA: Instabilità rilevata in CONTRAENTE B.`;
    return null;
  };

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
                <span className="block text-xs uppercase text-gray-500 mb-1">ID Contratto</span>
                <span className="text-sm font-bold">{contractData.id}</span>
              </div>
              <div>
                <span className="block text-xs uppercase text-gray-500 mb-1">Compatibilità</span>
                <span className="text-sm font-bold">{contractData.compatibility}%</span>
              </div>
            </div>
          </div>

          {/* Form di Input - AGGIORNATA CON CONTRAENTE A/B */}
          <form onSubmit={handleLogin} className="space-y-8 w-full font-bergen-mono">
            <div className="space-y-6">
              <div className="relative group">
                <label className="text-xs uppercase font-bold tracking-widest mb-2 block text-black">Contraente A</label>
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
                <label className="text-xs uppercase font-bold tracking-widest mb-2 block text-black">Contraente B</label>
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

      {/* Header Fisso */}
      <header className="px-8 py-8 flex justify-between items-start bg-white border-b-2 border-black z-20 sticky top-0">
        <div>
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
          <button onClick={handleDisconnect} className="text-xs uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-2 cursor-pointer z-50 mt-2">
            [ RESET ]
          </button>
        </div>
      </header>

      {/* Contenuto Scrollabile */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto p-8">

        {/* Info Card */}
        <div className="border-2 border-black p-8 mb-8 space-y-8 bg-white">
          <div className="flex justify-between items-start border-b border-gray-200 pb-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-500 block mb-2 font-bergen-mono">Rif. Contratto</span>
              <span className="font-bergen-mono text-lg tracking-wider font-bold">{contractData.id}</span>
            </div>
            <button
              onClick={() => setShowContract(true)}
              className="bg-white hover:bg-gray-50 transition-colors px-6 py-3 text-xs uppercase tracking-widest border-2 border-black font-bergen-mono flex items-center gap-2"
            >
              <FileText size={16} />
              Visualizza Digitale
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8 font-bergen-mono">
            <div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">Contraente A</span>
                <span className="text-xl font-bold truncate uppercase">{partyA}</span>
              </div>
            </div>
            <div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">Contraente B</span>
                <span className="text-xl font-bold truncate uppercase">{partyB}</span>
              </div>
            </div>
          </div>

          {/* Mini Stat */}
          <div className="pt-6 border-t border-gray-100 flex gap-8">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 block pb-1">COMPATIBILITÀ</span>
              <span className="text-xl font-bold">{contractData.compatibility}%</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 block pb-1">FASCIA</span>
              <span className="text-xl font-bold">{contractData.riskBand}</span>
            </div>
          </div>
        </div>

        {/* Zona Azione (Report) */}
        <div className={`flex-1 flex flex-col items-center justify-center py-12 transition-colors duration-700 ${systemStatus === 'REPORTED' ? 'bg-gray-50' : ''} border-2 border-gray-200`}>

          <div className="mb-12 text-center px-8 h-24 flex items-center justify-center w-full">
            {systemStatus === 'MONITORING' ? (
              <div className="text-sm uppercase tracking-[0.15em] text-gray-500 leading-loose font-bergen-mono">
                Premi per segnalare<br />
                <span className="text-black font-bold font-neue-haas">violazione contrattuale</span>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border-2 border-black p-6 w-full max-w-md text-left shadow-lg">
                <div className="flex items-center gap-3 text-black mb-4 border-b-2 border-black pb-4">
                  <CheckCircle size={16} />
                  <span className="text-sm font-bold uppercase tracking-widest font-neue-haas">Segnalazione Registrata</span>
                </div>
                <p className="font-bergen-mono text-xs text-gray-600 leading-relaxed">
                  TOKEN: {contractData.sessionToken}<br />
                  STATO: PROVA ACQUISITA
                </p>
              </div>
            )}
          </div>

          {/* BOTTONE ROSSO */}
          <div className="relative group w-64 h-64 flex items-center justify-center">
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
          <span>ID: {contractData.id}</span>
        </div>
        {systemStatus === 'REPORTED' && (
          <button onClick={resetSystem} className="underline hover:text-black">[ Nuova Segnalazione ]</button>
        )}
      </footer>

      {/* MODAL CONTRATTO DIGITALE - NUOVO DESIGN */}
      {showContract && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-300 font-bergen-mono">
          {/* Modal Header */}
          <div className="p-6 border-b-2 border-black flex justify-between items-center bg-gray-50">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-gray-500">Documento Digitale</span>
              <span className="text-xl font-bold tracking-tight font-neue-haas">CONTRATTO {contractData.id}</span>
            </div>
            <button onClick={() => setShowContract(false)} className="w-12 h-12 flex items-center justify-center hover:bg-black hover:text-white border-2 border-black transition-colors rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-white">

            {/* Partecipanti */}
            <div className="grid grid-cols-2 gap-8 pb-8 border-b border-gray-100">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Contraente A</span>
                <span className="text-lg font-bold uppercase border-b-2 border-black pb-1 block w-full">{partyA || '---'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">Contraente B</span>
                <span className="text-lg font-bold uppercase border-b-2 border-black pb-1 block w-full">{partyB || '---'}</span>
              </div>
            </div>

            {/* Sezione Statistiche Chiave */}
            <div className="flex items-center gap-8 bg-gray-50 p-6 border border-gray-200">
              <div className="flex-1 text-center border-r border-gray-300">
                <span className="block text-4xl font-bold font-neue-haas">{contractData.compatibility}%</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-500">Compatibilità</span>
              </div>
              <div className="flex-1 text-center">
                <span className="block text-4xl font-bold font-neue-haas">{contractData.riskBand}</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-500">Fascia Rischio</span>
                <span className="block text-sm font-bold mt-2">{contractData.cost}</span>
              </div>
            </div>

            {/* GRAFICO LISSAJOUS */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-2 mb-2 w-full">
                <div className="w-2 h-2 bg-black"></div>
                <span className="text-sm font-bold uppercase tracking-widest font-neue-haas">Risonanza Emotiva (Lissajous)</span>
              </div>

              <div className="w-64 h-64 relative border border-gray-200 bg-white">
                <LissajousFigure
                  gsr0={contractData.avgScl.a}
                  gsr1={contractData.avgScl.b}
                  compatibility={contractData.compatibility}
                />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 text-center max-w-xs">
                Visualizzazione generativa basata sui valori SCL medi e sulla compatibilità rilevata.
              </p>
            </div>

            {/* Clausole */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-black"></div>
                <span className="text-sm font-bold uppercase tracking-widest font-neue-haas">Clausole Concordate</span>
              </div>
              <p className="text-sm leading-relaxed text-justify opacity-90 border-l-4 border-black pl-6 py-2">
                {contractData.clausesText}
              </p>
            </div>

            {/* Disclaimer Debolezza */}
            {getWeakLinkText() && (
              <div className="bg-red-50 p-6 border-l-4 border-red-600 text-red-900 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span className="font-bold text-xs uppercase tracking-widest">Attenzione</span>
                </div>
                <p className="text-sm font-bold">
                  {getWeakLinkText()}
                </p>
                <p className="text-xs opacity-75">
                  Si consiglia monitoraggio preventivo.
                </p>
              </div>
            )}

            {/* --- DEBUG DATA SECTION --- */}
            <div className="mt-12 p-4 bg-gray-100 border border-gray-300 font-mono text-[10px] text-gray-600">
              <p className="font-bold mb-2">DEBUG INFO (RAW PARAMS):</p>
              <pre className="whitespace-pre-wrap">{JSON.stringify(debugParams, null, 2)}</pre>
            </div>

            {/* Footer Digitale */}
            <div className="pt-12 mt-8 text-center border-t border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                Certificato Digitalmente da ALUA Systems
              </p>
              <p className="text-[10px] text-gray-300 font-mono">
                {contractData.sessionToken} • Stipulato il {contractData.date}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WARNING OVERLAY: DATI MANCANTI */}
      {missingData && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white z-[100] p-4 text-center font-bold uppercase tracking-widest text-xs animate-pulse">
          ⚠️ ATTENZIONE: NESSUN DATO DAL QR (USA DEFAULT)
        </div>
      )}
    </div>
  );
};

export default App;
