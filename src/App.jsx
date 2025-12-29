import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText, ArrowRight, ShieldCheck, Activity, Users, Server, Database, X, LogOut, CheckCircle, Share } from 'lucide-react';

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
      const y = cy - radius * Math.sin(freq_y * t);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

  }, [gsr0, gsr1, compatibility]);

  return <canvas ref={canvasRef} width={256} height={256} className="w-full h-full" />;
};

const toRoman = (num) => {
  if (!num) return "";
  let n = parseInt(num);
  const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let roman = '', i;
  for (i in lookup) {
    while (n >= lookup[i]) {
      roman += i;
      n -= lookup[i];
    }
  }
  return roman;
}

// COMPARISON CHART COMPONENT
const ComparisonChart = ({ contractData }) => {
  // SCL max reference (typical range 0-500 µS for most users)
  const SCL_MAX = 500;

  // Converti SCL in percentuali (usando avgScl per valori più stabili)
  const sclA_value = contractData.avgScl?.a || 0;
  const sclB_value = contractData.avgScl?.b || 0;
  const sclA_pct = Math.min(100, (sclA_value / SCL_MAX * 100)).toFixed(1);
  const sclB_pct = Math.min(100, (sclB_value / SCL_MAX * 100)).toFixed(1);

  return (
    <div className="w-full space-y-6 border-2 border-black p-6 bg-white">
      <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-3">
        <div className="w-2 h-2 bg-black"></div>
        <span className="text-sm font-bold uppercase tracking-widest font-neue-haas">Analisi Comparativa</span>
      </div>

      {/* SCL VALUES */}
      <div className="space-y-4">
        <span className="text-xs uppercase tracking-widest text-gray-500 block">Media Conduttanza Cutanea (SCL)</span>

        {/* Contraente A */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase">Contraente A</span>
            <span className="text-sm font-bergen-mono font-bold">{sclA_value.toFixed(1)} µS</span>
          </div>
          <div className="w-full h-3 bg-gray-100 border border-gray-300 relative overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${sclA_pct}%` }}
            ></div>
          </div>
        </div>

        {/* Contraente B */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase">Contraente B</span>
            <span className="text-sm font-bergen-mono font-bold">{sclB_value.toFixed(1)} µS</span>
          </div>
          <div className="w-full h-3 bg-gray-100 border border-gray-300 relative overflow-hidden">
            <div
              className="h-full bg-gray-800 transition-all duration-300"
              style={{ width: `${sclB_pct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div className="pt-4 border-t border-gray-300 bg-gray-50 p-4 -mx-6 -mb-6">
        <p className="text-[10px] text-gray-600 leading-relaxed font-sans">
          <span className="font-bold text-black">Nota interpretativa:</span> La Conduttanza Cutanea (SCL) è un indicatore biometrico dell'attivazione psicofisiologica. Valori più elevati indicano un maggiore livello di arousal emotivo registrato durante l'esperienza interattiva. Un'SCL più alta può riflettere stati di attivazione, coinvolgimento emotivo o reattività fisiologica incrementata del soggetto nel contesto dell'interazione relazionale analizzata.
        </p>
      </div>
    </div>
  );
};


// TEMPLATE GRAFICO PER INSTAGRAM STORIES (Hidden but rendered)
const StoryTemplate = ({ contractData, partyA, partyB }) => {
  return (
    <div
      id="share-story-template"
      className="absolute top-0 left-0 bg-white flex flex-col items-center justify-between p-16 font-bergen-mono text-black border-[20px] border-white"
      style={{ width: '1080px', height: '1920px', zIndex: -100 }} // 1080x1920 PX canvas
    >
      {/* HEADER */}
      <div className="w-full flex justify-between items-start pt-16 mb-2 px-4">
        <img src="/logo_alua.png" alt="ALUA" className="w-[460px] h-auto object-contain object-left flex-shrink-0" />
        <div className="text-right flex flex-col justify-center">
          <span className="text-3xl uppercase tracking-widest text-gray-400">Verifica parte della macchina</span>
          <span className="text-4xl font-bold uppercase tracking-widest mt-2">EyeDeal di ALUA</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 w-full flex flex-col items-start justify-start gap-4">

        {/* PARTIES (NOMI) - In alto ben visibili - SPOSTATO IN BASSO */}
        <div className="w-full flex justify-between items-center px-4 border-b-[4px] border-black pb-12 mt-16">
          <div className="text-left w-1/2 pr-4">
            <span className="block text-2xl uppercase tracking-widest text-gray-400 mb-2">Contraente A</span>
            <span className="block text-5xl font-bold uppercase break-words leading-tight">{partyA}</span>
          </div>
          <div className="text-right w-1/2 pl-4">
            <span className="block text-2xl uppercase tracking-widest text-gray-400 mb-2">Contraente B</span>
            <span className="block text-5xl font-bold uppercase break-words leading-tight">{partyB}</span>
          </div>
        </div>

        {/* ROW: STATS (SX) + LISSAJOUS (DX) */}
        <div className="w-full flex justify-between items-end mt-8 px-4">

          {/* COLONNA SINISTRA: DATI */}
          <div className="flex flex-col items-start space-y-16">

            {/* Compatibilità */}
            <div>
              <span className="block text-3xl uppercase tracking-widest text-gray-500 mb-4">Grado di Compatibilità</span>
              <span className="block text-[150px] font-bergen-mono leading-none tracking-tighter">{contractData.compatibility}%</span>
            </div>

            {/* Fascia Rischio (Su due righe) */}
            <div>
              <span className="block text-3xl uppercase tracking-widest text-gray-400 mb-4">Fascia Rischio</span>
              <span className="block text-9xl font-bold text-black font-bergen-mono leading-none">
                {toRoman(contractData.riskBand)}
              </span>
            </div>

          </div>

          {/* COLONNA DESTRA: LISSAJOUS */}
          <div className="w-[500px] h-[500px] relative border border-gray-100 rounded-full bg-white p-0 flex-shrink-0">
            <LissajousFigure
              gsr0={contractData.avgScl.a}
              gsr1={contractData.avgScl.b}
              compatibility={contractData.compatibility}
            />
          </div>

        </div>

        {/* PHRASE (Wider format & Left Aligned - PUSHED TO BOTTOM) */}
        {contractData.phrase && (
          <div className="text-left px-4 w-full mt-auto mb-4">
            <span className="font-bergen-mono text-[40px] uppercase font-bold leading-tight block text-black">
              "{contractData.phrase}"
            </span>
          </div>
        )}
      </div>

      {/* FOOTER - ALIGNED LEFT SAME AS PHRASE (px-4) */}
      <div className="w-full text-left border-t-[4px] border-black pt-8 mt-4 flex flex-col gap-4 px-4 pb-16">
        <span className="text-3xl uppercase tracking-widest text-gray-400 font-medium whitespace-normal leading-relaxed">
          Analisi generativa basata su parametri biometrici reali: Conduttanza Cutanea (GSR) e Capacità Elettrica.
        </span>
        <span className="text-3xl uppercase tracking-[0.2em] text-gray-300">
          Protocollo Verificato • {contractData.date}
        </span>
        <span className="text-3xl uppercase tracking-[0.2em] text-gray-300 mt-2">
          © ALUA Systems 2025
        </span>
      </div>
    </div >
  );
};

const App = () => {
  // Stati dell'app
  const [showSplash, setShowSplash] = useState(true); // Splash screen iniziale
  const [splashFading, setSplashFading] = useState(false); // Per animazione fade-out
  const [view, setView] = useState('LOGIN'); // LOGIN o DASHBOARD
  const [systemStatus, setSystemStatus] = useState('MONITORING');
  const [isPressed, setIsPressed] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [isClosingContract, setIsClosingContract] = useState(false); // Per animazione chiusura modal
  const [isOpeningContract, setIsOpeningContract] = useState(false); // Per animazione apertura modal
  const [time, setTime] = useState(new Date());
  const [showInstallPrompt, setShowInstallPrompt] = useState(false); // Stato Prompt Installazione
  const [doNotShowAgain, setDoNotShowAgain] = useState(false); // Checkbox "Non mostrare più"

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
    clausesText: "Dati non disponibili.", // Ricostruito da types
    avgScl: { a: 0, b: 0 } // da avg0/avg1 - usato per Lissajous e grafico comparativo
  });

  // --- EFFETTO 1: INIZIALIZZAZIONE E PARSING URL ---
  const [debugParams, setDebugParams] = useState({});
  const [missingData, setMissingData] = useState(false);

  // --- EFFETTO SPLASH SCREEN ---
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setSplashFading(true); // Avvia fade-out
      setTimeout(() => {
        setShowSplash(false); // Rimuove splash dopo fade
      }, 300); // Durata fade-out veloce
    }, 1000); // Mostra splash per 1 secondo

    return () => clearTimeout(splashTimer);
  }, []);

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
    const q_phrase = params.get('phrase') || "";

    // Parsing SCL Medie (usate per Lissajous e grafico comparativo)
    const q_avg0 = parseFloat(params.get('avg0') || '0');
    const q_avg1 = parseFloat(params.get('avg1') || '0');

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
      date: q_date,
      machineId: params.get('mid') || 'ALUA-M-V1',
      sessionToken: Math.random().toString(36).substr(2, 9).toUpperCase(),
      compatibility: q_comp,
      riskBand: q_fascia,
      cost: q_cost,
      weakLink: q_bad,
      clausesText: generatedClause,
      phrase: q_phrase,
      avgScl: { a: q_avg0, b: q_avg1 } // Medie SCL per Lissajous e grafico comparativo
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

  // --- EFFETTO 2: INSTALL PROMPT CHECK ---
  useEffect(() => {
    // Verifica se l'app è già in modalità standalone (PWA installata)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    // Verifica se l'utente ha già visto il messaggio
    const hasSeenPrompt = localStorage.getItem('alua_install_prompt_seen');

    // Se NON è standalone e NON l'ha mai visto, mostra il prompt
    if (!isStandalone && !hasSeenPrompt) {
      // Delay per non apparire subito aggressivamente
      const timer = setTimeout(() => setShowInstallPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissInstall = () => {
    if (doNotShowAgain) {
      localStorage.setItem('alua_install_prompt_seen', 'true');
    }
    setShowInstallPrompt(false);
  };

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

  const handleCloseContract = () => {
    setIsClosingContract(true);
    setIsOpeningContract(false);
    setTimeout(() => {
      setShowContract(false);
      setIsClosingContract(false);
    }, 500); // Durata animazione (uguale alla transizione)
  };

  const formattedTime = time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  // Modifica data: Anno corrente + 2 anni
  const futureTime = new Date(time);
  futureTime.setFullYear(futureTime.getFullYear() + 2);
  const formattedDate = futureTime.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });

  // Helper per Weak Link Text
  const getWeakLinkText = () => {
    if (contractData.weakLink === 0) return `NOTA CRITICA: Instabilità rilevata in CONTRAENTE A.`;
    if (contractData.weakLink === 1) return `NOTA CRITICA: Instabilità rilevata in CONTRAENTE B.`;
    return null;
  };

  const handleShare = async () => {
    try {
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);

      const element = document.getElementById('share-story-template');
      if (!element) return;

      // Usa html2canvas dalla finestra globale (CDN)
      const canvas = await window.html2canvas(element, {
        scale: 2, // 2x Scale per qualità Retina/HighDPI
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 1080,
        height: 1920,
        windowWidth: 1080,
        windowHeight: 1920,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Fix eventuali problemi di display nel clone
          const el = clonedDoc.getElementById('share-story-template');
          if (el) {
            el.style.display = 'flex';
            el.style.left = '0px';
            el.style.top = '0px';
          }
        }
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `ALUA_Story_${contractData.id}.png`, { type: 'image/png' });

        if (navigator.share) {
          try {
            await navigator.share({
              files: [file],
              title: 'ALUA Protocol',
              text: `Protocollo ${contractData.id} completato.`
            });
          } catch (err) {
            console.log('Condivisione annullata o fallita', err);
          }
        } else {
          // Fallback Download
          const link = document.createElement('a');
          link.download = `ALUA_Story_${contractData.id}.png`;
          link.href = canvas.toDataURL();
          link.click();
        }
      }, 'image/png');

    } catch (error) {
      console.error("Errore generazione story:", error);
      alert("Errore nella generazione dell'immagine.");
    }
  };

  // --- SPLASH SCREEN ---
  if (showSplash) {
    return (
      <div
        className={`fixed inset-0 z-[200] bg-white flex items-center justify-center ${splashFading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          transition: 'opacity 300ms ease-out',
          height: '100dvh'
        }}
      >
        <img src="/logo_alua.svg" alt="ALUA" className="h-16 md:h-20 w-auto" />
      </div>
    );
  }

  // --- VISTA 1: IDENTIFICAZIONE (LOGIN) ---
  if (view === 'LOGIN') {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-white p-8 font-bergen-mono text-black">
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
          `}
        </style>
        <div className="w-full max-w-md space-y-12 animate-in fade-in duration-700 flex flex-col items-start">

          <div className="mb-2 w-full border-b-2 border-black pb-4">
            <a href="https://zjncoo.github.io/ALUA.IT/" target="_blank" rel="noopener noreferrer">
              <img src="/logo_alua.svg" alt="ALUA" className="h-16 w-auto hover:opacity-70 transition-opacity" />
            </a>
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

        {/* INSTALL PROMPT OVERLAY (iOS Style) - MOVED TO LOGIN VIEW */}
        {showInstallPrompt && (
          <div className="fixed bottom-0 left-0 w-full z-[100] px-4 pb-6 pt-2 animate-in slide-in-from-bottom duration-500">
            <div className="bg-white border-2 border-black p-6 shadow-2xl flex flex-col gap-4 relative">
              <button
                onClick={handleDismissInstall}
                className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-black flex items-center justify-center text-white">
                  <img src="/logo_alua.svg" alt="App Icon" className="w-8 h-8 invert" />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-widest font-neue-haas leading-tight">
                    Installa<br />
                    <span className="text-base">ALUA Systems</span>
                  </h3>
                  <p className="text-xs text-gray-500 font-bergen-mono mt-1">Per la migliore esperienza</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-bergen-mono uppercase tracking-wide text-gray-600">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-black">1.</span>
                  <span>Tocca l'icona <Share size={14} className="inline mx-1 align-text-bottom" /> nella barra in basso</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-black">2.</span>
                  <span>Scorri e seleziona <span className="font-bold text-black border-b border-black">Aggiungi alla Home</span></span>
                </div>
              </div>

              {/* Checkbox Non Mostrare Più */}
              <div className="flex items-center gap-2 mt-2 cursor-pointer" onClick={() => setDoNotShowAgain(!doNotShowAgain)}>
                <div className={`w-4 h-4 border border-black flex items-center justify-center ${doNotShowAgain ? 'bg-black' : 'bg-white'}`}>
                  {doNotShowAgain && <CheckCircle size={10} className="text-white" />}
                </div>
                <span className="text-[10px] uppercase font-bergen-mono text-gray-500 select-none">Non mostrare più questo messaggio</span>
              </div>

              <button
                onClick={handleDismissInstall}
                className="w-full bg-black text-white py-3 mt-0 text-xs uppercase tracking-widest font-bold font-neue-haas hover:bg-gray-900"
              >
                Ho Capito
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // --- VISTA 2: INTERFACCIA PRINCIPALE (DASHBOARD) ---
  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-white font-bergen-mono text-black overflow-hidden relative">

      {/* Header Fisso */}
      <header className="px-8 py-8 flex justify-between items-start bg-white border-b-2 border-black z-20 sticky top-0">
        <div>
          <a href="https://zjncoo.github.io/ALUA.IT/" target="_blank" rel="noopener noreferrer">
            <img src="/logo_alua.svg" alt="ALUA" className="h-10 w-auto hover:opacity-70 transition-opacity" />
          </a>
          <div className="flex items-center space-x-3 mt-2">
            {/* Stato Sistema: Solo pallino soave */}
            <div className={`w-3 h-3 rounded-full ${systemStatus === 'MONITORING' ? 'bg-black animate-pulse-slow' : 'bg-red-500'}`}></div>
          </div>
        </div>
        <div className="flex flex-col items-end font-bergen-mono">
          <div className="flex items-start gap-4">
            <div className="text-right">
              <span className="text-xs block">{formattedDate}</span>
              <span className="text-xs text-gray-400 block">{formattedTime}</span>
            </div>
            <button onClick={handleShare} className="text-black hover:opacity-70 transition-opacity">
              <Share size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenuto Scrollabile */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto p-8">

        {/* LISSAJOUS + FRASE DEDICATA (Sopra Info Card, Allineato a SX) */}
        {contractData.phrase && (
          <div className="flex flex-col items-start justify-start gap-4 mb-8 w-full animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Disclaimer Debolezza - MOVED HERE */}
            {getWeakLinkText() && (
              <div className="bg-red-50 p-4 border-l-4 border-red-600 text-red-900 mb-2 w-full max-w-md text-left">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} />
                  <span className="font-bold text-xs uppercase tracking-widest">Attenzione</span>
                </div>
                <p className="text-sm font-bold leading-tight">
                  {getWeakLinkText()}
                </p>
              </div>
            )}

            {/* Visualizzazione Lissajous - AL VIVO */}
            <div className="w-48 h-48 relative">
              <LissajousFigure
                gsr0={contractData.avgScl.a}
                gsr1={contractData.avgScl.b}
                compatibility={contractData.compatibility}
              />
            </div>

            <div className="text-left max-w-lg">
              <span className="font-bergen-mono text-[16pt] font-bold uppercase leading-tight block text-black">
                {contractData.phrase}
              </span>
              <div className="w-12 h-1 bg-black mt-4"></div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="border-2 border-black p-8 mb-8 space-y-8 bg-white">
          <div className="flex flex-col items-start border-b border-gray-200 pb-6 gap-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-500 block mb-2 font-bergen-mono">Rif. Contratto</span>
              <span className="font-bergen-mono text-lg tracking-wider font-bold">{contractData.id}</span>
            </div>

            <button
              onClick={() => {
                setShowContract(true);
                // Avvia animazione slide-up dopo un frame
                requestAnimationFrame(() => {
                  setIsOpeningContract(true);
                });
              }}
              className="bg-white hover:bg-gray-50 transition-colors py-3 text-xs uppercase tracking-widest border-b border-black font-bergen-mono flex items-center gap-2"
            >
              <FileText size={16} />
              Contratto Digitale
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
          {/* Mini Stat - AGGIORNATA PER COMPATIBILITA' GRANDE */}
          <div className="pt-6 border-t border-gray-100 flex items-end justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-400 block pb-2">GRADO DI COMPATIBILITÀ</span>
              <span className="text-6xl font-bold font-bergen-mono">{contractData.compatibility}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 block pb-1">FASCIA</span>
              <span className="text-2xl font-bold">{contractData.riskBand}</span>
            </div>
          </div>
        </div>

        {/* Zona Azione (Report) */}
        <div className={`flex-1 flex flex-col items-center justify-center py-12 transition-colors duration-700 ${systemStatus === 'REPORTED' ? 'bg-gray-50' : ''} border-2 border-black`}>

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
            <div className="absolute -inset-4 border border-black rounded-full pointer-events-none"></div>

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
                  ? '#C3000C'
                  : '#f3f4f6',
                color: systemStatus === 'MONITORING' ? 'white' : '#9ca3af'
              }}
            >
              {systemStatus === 'MONITORING' && (
                <img
                  src="/logo_alua.svg"
                  alt="ALUA"
                  className="w-32 h-auto opacity-100"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              )}
              {systemStatus === 'REPORTED' && (
                <span className="font-neue-haas text-lg tracking-[0.1em] font-bold">SEGNALATO</span>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer Fisso */}
      <footer className="px-8 py-6 border-t-2 border-black bg-white text-black flex flex-col font-bergen-mono z-20">
        {/* Contract ID - Top Left */}
        <div className="w-full mb-4">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">ID: {contractData.id}</span>
        </div>

        {/* Main Actions - Centered Stacked */}
        <div className="w-full flex flex-col items-center gap-4 mb-6">
          <a
            href="https://zjncoo.github.io/ALUA.IT/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-black border-b-2 border-black hover:opacity-50 transition-opacity uppercase tracking-widest"
          >
            Scopri il progetto ALUA
          </a>

          <button
            onClick={handleDisconnect}
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors cursor-pointer border-b border-gray-300 hover:border-red-600 pb-1"
          >
            Reset Sessione
          </button>
        </div>

        {/* LEGAL FOOTER */}
        <div className="w-full pt-4 border-t border-gray-200 text-[9px] leading-relaxed text-gray-400 normal-case text-left font-sans">
          <p className="font-bold text-black mb-2">Alua S.p.A.</p>
          <p className="leading-tight">
            Sede Legale: Via Cordusio 7, 20123 Milano - assicurazioni@pec.alua.it - tel +39 045 8172117 - fax +39 045 8172630<br />
            Capitale sociale i.v. Euro 69.000.000,00 - Registro delle Imprese di Milano, CF 01947090273 - P.IVA 03740811205 - R.E.A. 207330 - Società autorizzata all'esercizio delle assicurazioni con D.M. 05/02/27 N.18331, G.U. 05/02/2027 - Società iscritta all'Albo imprese di Assicurazione e riassicurazione Sez. I al n.1.00082, soggetta all'attività di direzione e coordinamento di Alua S.p.A. e facente parte del Gruppo Assicurativo iscritto all'Albo delle società capogruppo al n.046 - www.alua.it
          </p>
        </div>
      </footer>

      {showContract && (
        <div
          className={`fixed inset-0 z-50 bg-white flex flex-col font-bergen-mono overflow-hidden ${isClosingContract ? 'translate-y-full' : isOpeningContract ? 'translate-y-0' : 'translate-y-full'}`}
          style={{
            transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Modal Header - STICKY */}
          <div className="sticky top-0 z-10 p-6 border-b-2 border-black flex justify-between items-center bg-white shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-gray-500">Documento Digitale</span>
              <span className="text-xl font-bold tracking-tight font-neue-haas">CONTRATTO {contractData.id}</span>
            </div>
            <button onClick={handleCloseContract} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Modal Body - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>

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

              <div className="w-48 h-48 relative bg-white">
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

            {/* COMPARISON CHART - NEW */}
            <ComparisonChart contractData={contractData} />

            {/* Disclaimer Debolezza REMOVED FROM HERE */}

            {/* BOTTONE PDF PARTE FISSA */}
            <a
              href="/contratto.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white text-black py-4 mt-8 flex items-center justify-center gap-3 px-6 hover:bg-black hover:text-white transition-all border-2 border-black group cursor-pointer"
            >
              <FileText size={18} />
              <span className="text-sm font-bold tracking-widest uppercase font-neue-haas group-hover:underline decoration-white underline-offset-4">
                VISUALIZZA CONTRATTO COMPLETO
              </span>
            </a>

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

      {/* INSTALL PROMPT OVERLAY (iOS Style) */}
      {showInstallPrompt && (
        <div className="fixed bottom-0 left-0 w-full z-[100] px-4 pb-6 pt-2 animate-in slide-in-from-bottom duration-500">
          <div className="bg-white border-2 border-black p-6 shadow-2xl flex flex-col gap-4 relative">
            <button
              onClick={handleDismissInstall}
              className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 bg-black flex items-center justify-center text-white">
                <img src="/logo_alua.svg" alt="App Icon" className="w-8 h-8 invert" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-widest font-neue-haas">Installa Applicazione</h3>
                <p className="text-xs text-gray-500 font-bergen-mono">Per la migliore esperienza ALUA</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-bergen-mono uppercase tracking-wide text-gray-600">
              <div className="flex items-center gap-3">
                <span className="font-bold text-black">1.</span>
                <span>Tocca l'icona <Share size={14} className="inline mx-1 align-text-bottom" /> nella barra in basso</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-black">2.</span>
                <span>Scorri e seleziona <span className="font-bold text-black border-b border-black">Aggiungi alla Home</span></span>
              </div>
            </div>

            {/* Checkbox Non Mostrare Più */}
            <div className="flex items-center gap-2 mt-2 cursor-pointer" onClick={() => setDoNotShowAgain(!doNotShowAgain)}>
              <div className={`w-4 h-4 border border-black flex items-center justify-center ${doNotShowAgain ? 'bg-black' : 'bg-white'}`}>
                {doNotShowAgain && <CheckCircle size={10} className="text-white" />}
              </div>
              <span className="text-[10px] uppercase font-bergen-mono text-gray-500 select-none">Non mostrare più questo messaggio</span>
            </div>

            <button
              onClick={handleDismissInstall}
              className="w-full bg-black text-white py-3 mt-0 text-xs uppercase tracking-widest font-bold font-neue-haas hover:bg-gray-900"
            >
              Ho Capito
            </button>
          </div>
        </div>
      )}

      {/* TEMPLATE NASCOSTO PER CONDIVISIONE */}
      <StoryTemplate contractData={contractData} partyA={partyA} partyB={partyB} />
    </div>
  );
};

export default App;
