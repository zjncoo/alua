/**
 * ============================================================================
 * ALUA - Applicazione Web per Contratti Digitali
 * ============================================================================
 * Questa applicazione React mostra i dati di un contratto digitale generato
 * dalla macchina ALUA (sensori biometrici). I dati vengono passati tramite
 * parametri URL (solitamente da un QR code).
 * ============================================================================
 */

// --- IMPORTAZIONI ---
// React: libreria principale per creare interfacce utente
// useState: hook per gestire lo stato dei componenti (es. showContract, partyA)
// useEffect: hook per eseguire effetti collaterali (es. timer, fetch dati da URL)
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Lucide-react: libreria di icone vettoriali usate nell'interfaccia
// Ogni icona è un componente React (es. <FileText /> per l'icona documento)
import { AlertTriangle, FileText, ArrowRight, ShieldCheck, Activity, Users, Server, Database, X, LogOut, CheckCircle, Share, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

// React-PDF: visualizzatore PDF con zoom e scroll
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// React-Zoom-Pan-Pinch: per pinch-to-zoom su mobile
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

// Configurazione worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * MAPPING CLAUSOLE
 * ----------------
 * Questo oggetto mappa i tipi di relazione (chiavi) ai testi delle clausole.
 * Le chiavi corrispondono ai tipi inviati dalla macchina Arduino (monitor_arduino.py)
 * I testi corrispondono a quelli generati nel contratto PDF (contract_generator.py)
 */
const CLAUSE_MAPPING = {
  CONOSCENZA: "Esplorazione\u00A0preliminare.",                              // Tipo: Conoscenza
  ROMANTICA: "Tensione\u00A0attrattiva e\u00A0vulnerabilità\u00A0emotiva.",          // Tipo: Romantica
  LAVORATIVA: "Collaborazione\u00A0formale, efficienza\u00A0prioritaria.",        // Tipo: Lavorativa/Professionale
  AMICALE: "Supporto\u00A0reciproco, tempo\u00A0non\u00A0strutturato.",               // Tipo: Amicale/Amicizia
  FAMILIARE: "Legame\u00A0di\u00A0appartenenza e\u00A0obblighi\u00A0impliciti.",          // Tipo: Familiare
  CONVIVENZA: "Condivisione\u00A0di\u00A0spazi\u00A0riservati."                       // Tipo: Convivenza/Intimo
};

/**
 * ORDINE BOTTONI RELAZIONI
 * ------------------------
 * Array che definisce l'ordine esatto dei bottoni fisici sulla macchina Arduino.
 * Usato per convertire gli indici numerici nei tipi di relazione corrispondenti.
 */
const RELAZIONI_KEYS = ['CONOSCENZA', 'ROMANTICA', 'LAVORATIVA', 'AMICALE', 'FAMILIARE', 'CONVIVENZA'];

/**
 * ============================================================================
 * COMPONENTE: LissajousFigure
 * ============================================================================
 * Genera una curva di Lissajous basata sui valori biometrici.
 * La curva è una figura matematica creata dalla sovrapposizione di due
 * oscillazioni sinusoidali su assi perpendicolari.
 * 
 * Props:
 * - gsr0: valore GSR (conduttanza cutanea) del contraente A
 * - gsr1: valore GSR del contraente B  
 * - compatibility: percentuale di compatibilità (0-100)
 */
const LissajousFigure = ({ gsr0, gsr1, compatibility }) => {
  // useRef crea un riferimento persistente all'elemento canvas del DOM
  const canvasRef = React.useRef(null);

  // useEffect esegue il codice di disegno ogni volta che cambiano i valori
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Esci se il canvas non è ancora montato

    // Ottiene il contesto 2D per disegnare sul canvas
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // --- CALCOLO PARAMETRI LISSAJOUS ---
    // La media dei valori GSR determina la complessità della figura
    const val_gsr = (gsr0 + gsr1) / 2;
    const val_compat = compatibility;

    // Frequenze: determinano il numero di "loop" della curva
    // Valori GSR più alti = figure più complesse
    const freq_x = 1 + Math.floor((val_gsr / 1000.0) * 12);
    let freq_y = freq_x + 1;
    if (freq_y === freq_x) freq_y += 1; // Evita frequenze uguali (produrrebbero una linea)

    // Delta: sfasamento tra le due onde, basato sulla compatibilità
    // Compatibilità alta = figura più armonica e simmetrica
    const delta = (val_compat / 100.0) * Math.PI;

    // --- DISEGNO DELLA CURVA ---
    ctx.clearRect(0, 0, width, height); // Pulisce il canvas
    ctx.beginPath();
    ctx.strokeStyle = '#000000'; // Colore nero
    ctx.lineWidth = 2;

    // Calcola centro e raggio della figura
    const cx = width / 2;
    const cy = height / 2;
    const radius = (Math.min(width, height) / 2) - 10; // Padding 10px
    const steps = 1000; // Numero di punti per una curva liscia

    // Disegna la curva punto per punto
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 2 * Math.PI; // Parametro angolare da 0 a 2π

      // Equazioni parametriche di Lissajous:
      // x = sin(freq_x * t + delta)
      // y = sin(freq_y * t)
      const x = cx + radius * Math.sin(freq_x * t + delta);
      const y = cy - radius * Math.sin(freq_y * t);

      if (i === 0) ctx.moveTo(x, y); // Primo punto: sposta il cursore
      else ctx.lineTo(x, y);          // Punti successivi: disegna linea
    }
    ctx.stroke(); // Applica il disegno

  }, [gsr0, gsr1, compatibility]); // Ridisegna quando cambiano questi valori

  // Ritorna un elemento canvas HTML con dimensioni 256x256 pixel
  return <canvas ref={canvasRef} width={256} height={256} className="w-full h-full" />;
};

/**
 * ============================================================================
 * FUNZIONE HELPER: toRoman
 * ============================================================================
 * Converte un numero arabo (es. 3) in numerale romano (es. "III").
 * Usato per visualizzare la fascia di rischio in formato romano nel template story.
 * 
 * @param {number} num - Il numero da convertire
 * @returns {string} Il numerale romano corrispondente
 */
const toRoman = (num) => {
  if (!num) return ""; // Se il numero è 0, null o undefined, ritorna stringa vuota
  let n = parseInt(num);

  // Tabella di lookup: ogni simbolo romano con il suo valore
  const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };

  let roman = '', i;
  // Itera sui simboli dal più grande al più piccolo
  for (i in lookup) {
    while (n >= lookup[i]) {
      roman += i;    // Aggiunge il simbolo
      n -= lookup[i]; // Sottrae il valore
    }
  }
  return roman;
}

/**
 * ============================================================================
 * FUNZIONE HELPER: formatItalianText
 * ============================================================================
 * Applica spazi non interrompibili (nbsp) secondo le convenzioni editoriali italiane.
 * Evita a capo inappropriati dopo articoli, preposizioni e congiunzioni brevi.
 * 
 * @param {string} text - Il testo da formattare
 * @returns {string} Il testo con spazi non interrompibili dove necessario
 */
const formatItalianText = (text) => {
  if (!text) return "";

  // Parole dopo le quali NON si deve andare a capo (articoli, preposizioni, congiunzioni)
  const noBreakAfter = [
    'il', 'lo', 'la', 'i', 'gli', 'le', 'l',        // Articoli determinativi
    'un', 'uno', 'una',                               // Articoli indeterminativi
    'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', // Preposizioni semplici
    'del', 'dello', 'della', 'dei', 'degli', 'delle', // Preposizioni articolate
    'al', 'allo', 'alla', 'ai', 'agli', 'alle',
    'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
    'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
    'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
    'e', 'o', 'ma', 'che', 'se', 'come', 'quando',   // Congiunzioni
    'non', 'più', 'già', 'mai', 'sempre',             // Avverbi comuni
    'un\'', 'quest\'', 'quell\'', 'all\'', 'dall\'', 'nell\'', 'sull\'' // Elisioni
  ];

  // Crea regex per ogni parola (case insensitive, seguito da spazio)
  let result = text;
  noBreakAfter.forEach(word => {
    // Regex: parola (case insensitive) seguita da uno spazio
    const regex = new RegExp(`\\b(${word})\\s+`, 'gi');
    // Sostituisce con parola + spazio non interrompibile
    result = result.replace(regex, '$1\u00A0');
  });

  // Evita a capo prima della punteggiatura
  result = result.replace(/\s+([.,;:!?])/g, '\u00A0$1');

  // --- ANTI-VEDOVE: Ogni frase va a capo ---
  // Dopo punto, punto esclamativo o interrogativo seguito da spazio, inserisce un a capo
  result = result.replace(/([.!?])\s+/g, '$1\n');

  return result;
};




// TEMPLATE GRAFICO PER INSTAGRAM STORIES (Hidden but rendered)
const StoryTemplate = ({ contractData, partyA, partyB }) => {
  return (
    <div
      id="share-story-template"
      className="absolute bg-white flex flex-col items-center justify-between p-16 font-bergen-mono text-black border-[20px] border-white"
      style={{
        width: '1080px',
        height: '1920px',
        zIndex: -9999,
        left: '-9999px',      // Sposta completamente fuori dalla viewport
        top: '-9999px',
        // visibility: 'hidden', // RIMOSSO: html2canvas ha problemi con elementi hidden
        pointerEvents: 'none' // Non intercetta click
      }}
    >
      {/* HEADER */}
      <div className="w-full flex justify-between items-start pt-16 mb-2 px-4">
        <div className="text-left flex flex-col justify-center">
          <span className="text-xl uppercase tracking-widest text-gray-400">Verifica parte della macchina</span>
          <span className="text-4xl font-bold uppercase tracking-widest mt-2">EyeDeal</span>
        </div>
        <img src="/logo_alua.png" alt="ALUA" className="w-[460px] h-auto object-contain object-right flex-shrink-0" />
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
            <span className="font-bergen-mono text-[40px] uppercase font-bold leading-tight block text-black whitespace-pre-line">
              "{formatItalianText(contractData.phrase)}"
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

/**
 * ============================================================================
 * COMPONENTE PRINCIPALE: App
 * ============================================================================
 * Componente root dell'applicazione. Gestisce:
 * - Splash screen iniziale
 * - Vista Login (inserimento nomi contraenti)
 * - Vista Dashboard (visualizzazione contratto e bottone segnalazione)
 * - Modal contratto digitale
 * ============================================================================
 */
const App = () => {
  // ==========================================================================
  // STATI DELL'APPLICAZIONE (useState)
  // ==========================================================================
  // Ogni useState ritorna [valore, funzionePerModificarlo]

  // --- SPLASH SCREEN ---
  const [showSplash, setShowSplash] = useState(true);   // true = mostra splash, false = nascosto
  const [splashFading, setSplashFading] = useState(false); // true = animazione fade-out in corso
  const [contentVisible, setContentVisible] = useState(false); // true = contenuto app visibile (per fade-in)

  // --- NAVIGAZIONE ---
  const [view, setView] = useState('LOGIN'); // 'LOGIN' = schermata inserimento nomi, 'DASHBOARD' = schermata principale

  // --- STATO SISTEMA SEGNALAZIONE ---
  const [systemStatus, setSystemStatus] = useState('MONITORING'); // 'MONITORING' = in attesa, 'REPORTED' = segnalazione inviata
  const [isPressed, setIsPressed] = useState(false); // true = bottone premuto (per animazione)

  // --- MODAL CONTRATTO ---
  const [showContract, setShowContract] = useState(false);      // true = modal visibile
  const [isClosingContract, setIsClosingContract] = useState(false); // true = animazione slide-down in corso
  const [isOpeningContract, setIsOpeningContract] = useState(false); // true = animazione slide-up completata

  // --- MODAL PDF CONTRATTO COMPLETO ---
  const [showFullContract, setShowFullContract] = useState(false);      // true = modal PDF visibile
  const [isClosingFullContract, setIsClosingFullContract] = useState(false); // true = animazione slide-down in corso
  const [isOpeningFullContract, setIsOpeningFullContract] = useState(false); // true = animazione slide-up completata
  const [numPages, setNumPages] = useState(null);  // numero pagine PDF
  const [containerWidth, setContainerWidth] = useState(null); // larghezza container PDF
  const pdfContainerRef = useRef(null); // ref per misurare il container

  // --- OROLOGIO ---
  const [time, setTime] = useState(new Date()); // Data/ora corrente, aggiornata ogni secondo

  // --- PROMPT INSTALLAZIONE PWA ---
  const [showInstallPrompt, setShowInstallPrompt] = useState(false); // true = mostra suggerimento installazione
  const [doNotShowAgain, setDoNotShowAgain] = useState(false); // true = utente ha scelto "Non mostrare più"

  // ==========================================================================
  // DATI SESSIONE (Nomi dei contraenti)
  // ==========================================================================
  const [partyA, setPartyA] = useState(''); // Nome Contraente A (inserito dall'utente o da URL)
  const [partyB, setPartyB] = useState(''); // Nome Contraente B (inserito dall'utente o da URL)

  // ==========================================================================
  // DATI CONTRATTO (Ricostruiti dai parametri URL del QR code)
  // ==========================================================================
  const [contractData, setContractData] = useState({
    id: 'UNK-00',           // Identificativo univoco del contratto (es. "ABC-123")
    date: '00.00.0000',     // Data di stipula del contratto
    machineId: 'ALUA-M-V1', // ID della macchina che ha generato il contratto
    sessionToken: '---',    // Token di sessione generato casualmente
    compatibility: 0,       // Percentuale di compatibilità tra i contraenti (0-100)
    riskBand: 1,            // Fascia di rischio (1-5)
    cost: '0,00€',          // Costo del contratto
    weakLink: null,         // Indica chi è il contraente più "debole" (-1=nessuno, 0=A, 1=B)
    clausesText: "Dati non disponibili.", // Testo delle clausole del contratto
    clausesText: "Dati non disponibili.", // Testo delle clausole del contratto
    avgScl: { a: 0, b: 0 },  // Valori medi SCL (conduttanza cutanea) per Lissajous e grafico
    relTypes: []            // Array dei tipi di relazione (es. ['ROMANTICA', 'AMICALE'])
  });

  // ==========================================================================
  // STATI DEBUG E VALIDAZIONE
  // ==========================================================================
  const [debugParams, setDebugParams] = useState({}); // Tutti i parametri URL (per debug)
  const [missingData, setMissingData] = useState(false); // true = dati mancanti nell'URL

  // ==========================================================================
  // EFFETTO: SPLASH SCREEN
  // ==========================================================================
  // Eseguito una sola volta al montaggio del componente ([] = nessuna dipendenza)
  // Gestisce l'animazione di apparizione e scomparsa dello splash screen
  useEffect(() => {
    // Dopo 1 secondo, avvia il fade-out
    const splashTimer = setTimeout(() => {
      setSplashFading(true); // Attiva classe CSS per fade-out
      setContentVisible(true); // Attiva fade-in del contenuto in sincrono

      // Dopo 300ms (durata animazione), rimuove completamente lo splash
      setTimeout(() => {
        setShowSplash(false);
      }, 300);
    }, 1000);

    // Cleanup: cancella il timer se il componente viene smontato
    return () => clearTimeout(splashTimer);
  }, []);

  // ==========================================================================
  // EFFETTO: OROLOGIO E PARSING PARAMETRI URL
  // ==========================================================================
  // Questo effetto:
  // 1. Avvia un timer che aggiorna l'orologio ogni secondo
  // 2. Legge i parametri dall'URL (passati dal QR code della macchina)
  // 3. Ricostruisce i dati del contratto dai parametri
  useEffect(() => {
    // --- TIMER OROLOGIO ---
    // setInterval esegue la funzione ogni 1000ms (1 secondo)
    const timer = setInterval(() => setTime(new Date()), 1000);

    // --- PARSING URL ---
    // URLSearchParams è un'API nativa per leggere parametri tipo "?id=123&name=foo"
    const params = new URLSearchParams(window.location.search);

    // Salva tutti i parametri per debug (visibili nel modal quando abilitato)
    const debugObj = {};
    for (const [key, value] of params.entries()) {
      debugObj[key] = value;
    }
    setDebugParams(debugObj);

    // --- ESTRAZIONE SINGOLI PARAMETRI ---
    // params.get('nome') ritorna il valore o null se non esiste
    // || 'default' fornisce un valore di fallback se null
    const q_id = params.get('id') || 'UNK-00';           // ID contratto
    const q_date = params.get('date') || formattedDate;  // Data
    const q_comp = parseInt(params.get('comp') || '50'); // Compatibilità (intero)
    const q_bad = parseInt(params.get('bad') || '-1');   // Weak link
    const q_fascia = parseInt(params.get('fascia') || '1'); // Fascia rischio
    const q_cost = params.get('cost') || '0,00€';        // Costo
    const q_phrase = params.get('phrase') || "";         // Frase del contratto

    // Valori SCL medi (usati per Lissajous e grafico comparativo)
    const q_avg0 = parseFloat(params.get('avg0') || '0'); // SCL media contraente A
    const q_avg1 = parseFloat(params.get('avg1') || '0'); // SCL media contraente B

    // --- PARSING CLAUSOLE ---
    // I tipi di relazione vengono passati come stringa separata da virgole (es. "ROMANTICA,AMICALE")
    const raw_types = (params.get('types') || '').split(',').filter(x => x);

    // Genera il testo delle clausole mappando i tipi ai loro testi
    let generatedClause = "Clausola Default: Relazione indefinita.";
    let generatedRelTypes = []; // Array per i tipi di relazione

    if (raw_types.length > 0) {
      // Usa CLAUSE_MAPPING per convertire i tipi nei testi corrispondenti
      generatedRelTypes = raw_types; // Salva i tipi grezzi
      generatedClause = raw_types.map(k => CLAUSE_MAPPING[k] || k).join(" ");
    } else {
      // --- FALLBACK PER VECCHI QR ---
      // I vecchi QR usavano indici numerici invece di nomi (btn0="0,1,2")
      const btn0_idx = (params.get('btn0') || '').split(',').filter(x => x).map(Number);
      const btn1_idx = (params.get('btn1') || '').split(',').filter(x => x).map(Number);
      if (btn0_idx.length > 0 || btn1_idx.length > 0) {
        // Converte indici in chiavi usando RELAZIONI_KEYS
        const keys0 = btn0_idx.map(i => RELAZIONI_KEYS[i]).filter(k => k);
        const keys1 = btn1_idx.map(i => RELAZIONI_KEYS[i]).filter(k => k);
        // Set rimuove duplicati, poi mappa ai testi
        const allbox = Array.from(new Set([...keys0, ...keys1]));
        if (allbox.length > 0) {
          generatedRelTypes = allbox; // Salva i tipi grezzi
          generatedClause = allbox.map(k => CLAUSE_MAPPING[k] || "").join(" ");
        }
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
      avgScl: { a: q_avg0, b: q_avg1 }, // Medie SCL per Lissajous e grafico comparativo
      relTypes: generatedRelTypes       // Salva i tipi di relazione
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

  // --- EFFETTO: BODY SCROLL LOCK ---
  useEffect(() => {
    if (showContract || showFullContract) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showContract, showFullContract]);

  // --- EFFETTO: MISURA LARGHEZZA CONTAINER PDF ---
  useEffect(() => {
    if (showFullContract && pdfContainerRef.current) {
      const updateWidth = () => {
        const width = pdfContainerRef.current?.clientWidth;
        if (width) {
          setContainerWidth(width - 32); // 32px = padding (16px * 2)
        }
      };
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, [showFullContract]);

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

  // ==========================================================================
  // HANDLER: Chiudi prompt installazione PWA
  // ==========================================================================
  // Chiamato quando l'utente chiude il banner di installazione
  const handleDismissInstall = () => {
    // Se l'utente ha spuntato "Non mostrare più", salva la preferenza
    if (doNotShowAgain) {
      localStorage.setItem('alua_install_prompt_seen', 'true');
    }
    setShowInstallPrompt(false); // Nasconde il prompt
  };

  // ==========================================================================
  // HANDLER: Login (Invio form nomi contraenti)
  // ==========================================================================
  // Chiamato quando l'utente preme il bottone "Inizializza Sessione"
  // @param e - evento del form (preventDefault evita il refresh della pagina)
  const handleLogin = (e) => {
    e.preventDefault(); // Previene il comportamento default del form (refresh)

    // Procede solo se entrambi i nomi sono stati inseriti
    if (partyA && partyB) {
      // Salva i nomi nel localStorage per ricordarli alla prossima visita
      localStorage.setItem('alua_partyA', partyA);
      localStorage.setItem('alua_partyB', partyB);

      // Vibrazione feedback (se supportata dal dispositivo)
      if (navigator.vibrate) navigator.vibrate(50);

      // Naviga alla dashboard
      setView('DASHBOARD');
    }
  };

  // ==========================================================================
  // HANDLER: Disconnessione / Reset sessione
  // ==========================================================================
  // Cancella i dati salvati e torna alla schermata di login
  const handleDisconnect = () => {
    // Rimuove i nomi dal localStorage
    localStorage.removeItem('alua_partyA');
    localStorage.removeItem('alua_partyB');

    // Resetta gli stati locali
    setPartyA('');
    setPartyB('');
    setView('LOGIN');
    setSystemStatus('MONITORING');
  };

  // ==========================================================================
  // HANDLER: Segnalazione violazione
  // ==========================================================================
  // Chiamato quando l'utente preme il grande bottone rosso ALUA
  const handleReport = () => {
    setIsPressed(true); // Attiva animazione "premuto"

    // Vibrazione lunga di feedback
    if (navigator.vibrate) navigator.vibrate(200);

    // Dopo 800ms, completa la segnalazione
    setTimeout(() => {
      setSystemStatus('REPORTED'); // Cambia stato a "segnalato"
      setIsPressed(false);          // Rilascia animazione

      // Tripla vibrazione breve come conferma
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }, 800);
  };

  // ==========================================================================
  // HANDLER: Reset sistema (dopo segnalazione)
  // ==========================================================================
  // Riporta il sistema in modalità monitoraggio
  const resetSystem = () => {
    setSystemStatus('MONITORING');
  };

  // ==========================================================================
  // HANDLER: Chiusura modal contratto
  // ==========================================================================
  // Gestisce l'animazione di chiusura (slide-down) del modal
  const handleCloseContract = () => {
    setIsClosingContract(true);  // Attiva animazione slide-down
    setIsOpeningContract(false); // Resetta stato apertura

    // Dopo che l'animazione è completata (500ms), nasconde il modal
    setTimeout(() => {
      setShowContract(false);
      setIsClosingContract(false);
    }, 500);
  };

  // ==========================================================================
  // HANDLER: Chiusura modal PDF contratto completo
  // ==========================================================================
  // Gestisce l'animazione di chiusura (slide-down) del modal PDF
  const handleCloseFullContract = () => {
    setIsClosingFullContract(true);  // Attiva animazione slide-down
    setIsOpeningFullContract(false); // Resetta stato apertura

    // Dopo che l'animazione è completata (500ms), nasconde il modal
    setTimeout(() => {
      setShowFullContract(false);
      setIsClosingFullContract(false);
    }, 500);
  };

  // ==========================================================================
  // HANDLER: PDF Document Load
  // ==========================================================================
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
  }, []);

  // ==========================================================================
  // VARIABILI HELPER: Formattazione data/ora
  // ==========================================================================

  // Ora corrente formattata come "HH:mm" in italiano
  const formattedTime = time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  // Data di scadenza del contratto: +2 anni dalla data corrente
  const futureTime = new Date(time);
  futureTime.setFullYear(futureTime.getFullYear() + 2);
  const formattedDate = futureTime.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });

  // ==========================================================================
  // HELPER: Testo per indicare instabilità di un contraente
  // ==========================================================================
  // Ritorna un messaggio di avviso se uno dei contraenti mostra instabilità
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
            el.style.visibility = 'visible';
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

        {/* Copyright Splash */}
        <div className="absolute bottom-8 w-full text-center font-bergen-mono">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <span className="text-sm font-bold">©</span> ALUA SYSTEMS
          </p>
        </div>
      </div>
    );
  }

  // --- VISTA 1: IDENTIFICAZIONE (LOGIN) ---
  if (view === 'LOGIN') {
    return (
      <div
        className={`min-h-[100dvh] w-full flex flex-col items-center justify-center bg-white p-8 font-bergen-mono text-black ${contentVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ transition: 'opacity 300ms ease-out' }}
      >
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
              <span className="text-xs uppercase tracking-widest font-bergen-mono text-gray-500">Dati Polizza</span>
              <div className="w-2 h-2 bg-black"></div>
            </div>
            <div className="grid grid-cols-2 gap-8 font-bergen-mono">
              <div>
                <span className="block text-xs uppercase text-gray-500 mb-1">PRATICA N.</span>
                <span className="text-sm font-bold">{contractData.id}</span>
              </div>
              <div>
                <span className="block text-xs uppercase text-gray-500 mb-1">% AFFINITÀ</span>
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

          {/* Copyright ALUA SYSTEMS - LOGIN SCREEN */}
          <div className="w-full text-center pt-8 border-t-2 border-green-500/0"> {/* border trasparente per spacing */}
            <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <span className="text-sm font-bold">©</span> 2025 ALUA SYSTEMS
            </p>
            <a
              href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.it"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-gray-400 hover:text-black transition-colors underline"
            >
              CC BY-NC-ND (Attribuzione - Non Commerciale - Non Opere Derivate)
            </a>
          </div>
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
    <div
      className={`min-h-[100dvh] w-full flex flex-col bg-white font-bergen-mono text-black overflow-hidden relative ${contentVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transition: 'opacity 300ms ease-out' }}
    >

      {/* Header Fisso */}
      <header className="px-8 py-8 flex justify-between items-start bg-white border-b-2 border-black z-20 sticky top-0">
        {/* Sinistra: Data, Ora, ID Contratto */}
        <div className="flex flex-col items-start font-bergen-mono">
          <span className="text-xs block">{formattedDate}</span>
          <span className="text-xs text-gray-400 block">{formattedTime}</span>
          <div className="flex items-center space-x-3 mt-2">
            {/* Stato Sistema: Solo pallino soave */}
            <div
              className={`w-3 h-3 rounded-full ${systemStatus === 'MONITORING' ? 'animate-pulse-slow' : ''}`}
              style={{ backgroundColor: systemStatus === 'MONITORING' ? '#342152' : '#ef4444' }}
            ></div>
          </div>
        </div>
        {/* Destra: Logo */}
        <a href="https://zjncoo.github.io/ALUA.IT/" target="_blank" rel="noopener noreferrer">
          <img src="/logo_alua.svg" alt="ALUA" className="h-10 w-auto hover:opacity-70 transition-opacity" />
        </a>
      </header>

      {/* Contenuto Scrollabile */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto p-8">

        {/* LISSAJOUS + FRASE DEDICATA (Sopra Info Card, Allineato a SX) */}
        {contractData.phrase && (
          <div className="flex flex-col items-start justify-start gap-4 mb-8 w-full animate-in fade-in slide-in-from-top-4 duration-700">


            {/* Visualizzazione Lissajous - AL VIVO */}
            <div className="w-48 h-48 relative">
              <LissajousFigure
                gsr0={contractData.avgScl.a}
                gsr1={contractData.avgScl.b}
                compatibility={contractData.compatibility}
              />
            </div>

            <div className="text-left max-w-lg">
              <span className="font-bergen-mono text-[16pt] font-bold uppercase leading-tight block text-black whitespace-pre-line">
                {formatItalianText(contractData.phrase)}
              </span>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="border-2 border-black p-8 mb-8 space-y-8 bg-white">
          <div className="flex justify-between items-start border-b border-gray-200 pb-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-500 block mb-2 font-bergen-mono">Rif. Contratto</span>
              <span className="font-bergen-mono text-lg tracking-wider font-bold">{contractData.id}</span>
            </div>
            {/* Bottone Condividi - Allineato a destra */}
            <button onClick={handleShare} className="text-black hover:opacity-70 transition-opacity">
              <Share size={24} strokeWidth={1.5} />
            </button>
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

          <div className="grid grid-cols-2 gap-8 font-bergen-mono">
            <div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">Contraente A</span>
                <span className="text-xl font-bold uppercase">{partyA}</span>
              </div>
            </div>
            <div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">Contraente B</span>
                <span className="text-xl font-bold uppercase">{partyB}</span>
              </div>
            </div>
          </div>

          {/* ALERT DEBOLEZZA (DASHBOARD) */}
          {getWeakLinkText() && (
            <div className="w-full bg-gray-100 border-2 border-black p-4 mb-6 flex items-center justify-center gap-3">
              <AlertTriangle size={16} className="text-black" />
              <span className="text-xs font-bold uppercase tracking-widest text-black">
                {getWeakLinkText()}
              </span>
            </div>
          )}

          {/* Mini Stat - AGGIORNATA PER COMPATIBILITA' GRANDE */}
          <div className="pt-6 border-t border-gray-100 flex items-end justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-400 block pb-2">AFFINITÀ INTERPERSONALE</span>
              <span className="text-6xl font-bold font-bergen-mono">{contractData.compatibility}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 block pb-1">FASCIA DI RISCHIO</span>
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
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border-2 border-black p-4 w-full max-w-md shadow-lg mb-8">
                <div className="flex items-center gap-3 text-black">
                  <CheckCircle size={16} />
                  <span className="text-sm font-bold uppercase tracking-widest font-neue-haas">Segnalazione Registrata</span>
                </div>
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

          {/* Bottone Reset - Appare solo dopo segnalazione */}
          {systemStatus === 'REPORTED' && (
            <button
              onClick={resetSystem}
              className="mt-8 px-6 py-3 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all text-xs uppercase tracking-widest font-bold font-neue-haas animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              Invia Nuova Segnalazione
            </button>
          )}
        </div>
      </main>

      {/* Footer Fisso */}
      <footer className="px-8 py-6 border-t-2 border-black bg-white text-black flex flex-col font-bergen-mono z-20">
        {/* Main Actions - Centered Stacked */}
        <div className="w-full flex flex-col items-center gap-4 mb-6">

          <button
            onClick={handleDisconnect}
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors cursor-pointer border-b border-gray-300 hover:border-red-600 pb-1"
          >
            Reset Sessione
          </button>
        </div>

        {/* Footer Certificato Digitale - uguale al modale */}
        <div className="w-[calc(100%+4rem)] -mx-8 text-center py-4 border-t-2 border-black px-8">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
            Certificato Digitalmente da ALUA Systems
          </p>
          <p className="text-[10px] text-gray-300 font-mono">
            ID: {contractData.id} • Stipulato il {contractData.date}
          </p>
        </div>

        {/* LEGAL FOOTER */}
        <div className="w-[calc(100%+4rem)] -mx-8 py-4 border-t-2 border-black text-[9px] leading-relaxed text-gray-400 normal-case text-left font-sans px-8">
          <p className="font-bold text-black mb-2">Alua S.p.A.</p>
          <p className="leading-tight">
            Sede Legale: Via Cordusio 7, 20123 Milano - assicurazioni@pec.alua.it - tel +39 045 8172117 - fax +39 045 8172630<br />
            Capitale sociale i.v. Euro 69.000.000,00 - Registro delle Imprese di Milano, CF 01947090273 - P.IVA 03740811205 - R.E.A. 207330 - Società autorizzata all'esercizio delle assicurazioni con D.M. 05/02/27 N.18331, G.U. 05/02/2027 - Società iscritta all'Albo imprese di Assicurazione e riassicurazione Sez. I al n.1.00082, soggetta all'attività di direzione e coordinamento di Alua S.p.A. e facente parte del Gruppo Assicurativo iscritto all'Albo delle società capogruppo al n.046 - www.alua.it
          </p>
        </div>

        {/* Copyright ALUA SYSTEMS */}
        <div className="w-[calc(100%+4rem)] -mx-8 text-center pb-4 px-8">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <span className="text-sm font-bold">©</span> 2025 ALUA SYSTEMS
          </p>
          <a
            href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.it"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-gray-400 hover:text-black transition-colors underline"
          >
            CC BY-NC-ND (Attribuzione - Non Commerciale - Non Opere Derivate)
          </a>
        </div>
      </footer>

      {showContract && (
        <div
          className={`fixed inset-0 z-50 bg-white flex flex-col font-bergen-mono overflow-hidden ${isClosingContract ? 'translate-y-full' : isOpeningContract ? 'translate-y-0' : 'translate-y-full'}`}
          style={{
            transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Modal Header - FIXED within Flex */}
          <div className="z-10 p-6 border-b-2 border-black flex justify-between items-center bg-white shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-gray-500">Contratto Digitale</span>
              <span className="text-xl font-bold tracking-tight font-neue-haas">CONTRATTO {contractData.id}</span>
            </div>
            <button onClick={handleCloseContract} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Modal Body - SCROLLABLE with Extra Padding */}
          <div className="flex-1 overflow-y-auto p-8 pb-12 space-y-12 bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>

            {/* BOTTONE PDF */}
            <button
              onClick={() => {
                setShowFullContract(true);
                requestAnimationFrame(() => {
                  setIsOpeningFullContract(true);
                });
              }}
              className="w-full bg-white text-black py-4 flex items-center justify-center gap-3 px-6 hover:bg-black hover:text-white transition-all border-2 border-black group cursor-pointer"
            >
              <FileText size={18} />
              <span className="text-sm font-bold tracking-widest uppercase font-neue-haas group-hover:underline decoration-white underline-offset-4">
                VISUALIZZA CONTRATTO COMPLETO
              </span>
            </button>

            {/* ALERT DEBOLEZZA (RE-ADDED & RESTYLED) */}
            {getWeakLinkText() && (
              <div className="w-full bg-gray-100 border-2 border-black p-4 mb-0 flex items-center justify-center gap-3">
                <AlertTriangle size={16} className="text-black" />
                <span className="text-xs font-bold uppercase tracking-widest text-black">
                  {getWeakLinkText()}
                </span>
              </div>
            )}

            {/* Tabella Fascia Rischio e Costo */}
            {/* Tabella Fascia Rischio e Costo */}
            <div className="grid grid-cols-2 border-2 border-black bg-white">
              <div className="py-6 px-4 flex flex-col items-center justify-center border-r-2 border-black">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">Fascia di Rischio</span>
                <span className="text-4xl font-bold font-bergen-mono">{contractData.riskBand}</span>
              </div>
              <div className="py-6 px-4 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">Premio Annuo</span>
                <span className="text-4xl font-bold font-bergen-mono">{contractData.cost}</span>
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
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-black"></div>
              <span className="text-sm font-bold uppercase tracking-widest font-neue-haas">Clausole Concordate</span>
            </div>

            {/* BADGES TIPI RELAZIONE */}
            {contractData.relTypes && contractData.relTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-6">
                {contractData.relTypes.map((type, idx) => (
                  <span key={idx} className="bg-black text-white text-[10px] font-bold uppercase px-2 py-1 tracking-widest">
                    {type}
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm leading-relaxed text-justify opacity-90 border-l-4 border-black pl-6 py-2">
              {contractData.clausesText}
            </p>
            {/* Footer Digitale */}
            <div className="pt-12 mt-8 text-center border-t-2 border-black">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                Certificato Digitalmente da ALUA Systems
              </p>
              <p className="text-[10px] text-gray-300 font-mono">
                ID: {contractData.id} • Stipulato il {contractData.date}
              </p>
            </div>
          </div>
        </div>
      )}

      {showFullContract && (
        <div
          className={`fixed inset-0 z-50 bg-white flex flex-col font-bergen-mono overflow-hidden ${isClosingFullContract ? 'translate-y-full' : isOpeningFullContract ? 'translate-y-0' : 'translate-y-full'}`}
          style={{
            transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Modal Header */}
          <div className="z-10 p-4 md:p-6 border-b-2 border-black flex justify-between items-center bg-white shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-gray-500">Documento Ufficiale</span>
              <span className="text-base md:text-xl font-bold tracking-tight font-neue-haas leading-tight">ALUA - CONDIZIONI GENERALI</span>
            </div>
            <button onClick={handleCloseFullContract} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0">
              <X size={20} />
            </button>
          </div>

          {/* Info Toolbar */}
          <div className="z-10 px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-[10px] uppercase tracking-widest text-gray-500">
              Pizzica per zoomare
            </span>
            {numPages && (
              <span className="text-[10px] uppercase tracking-widest text-gray-500">
                {numPages} {numPages === 1 ? 'pagina' : 'pagine'}
              </span>
            )}
          </div>

          {/* Modal Body - PDF Viewer con Pinch-to-Zoom */}
          <div
            ref={pdfContainerRef}
            className="flex-1 overflow-auto bg-gray-200"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={3}
              centerOnInit={false}
              wheel={{ disabled: true }}
              pinch={{ step: 5 }}
              doubleClick={{ mode: 'reset' }}
              panning={{ disabled: false }}
            >
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%', overflow: 'auto' }}
                contentStyle={{ width: '100%' }}
              >
                <div className="p-4">
                  <Document
                    file="/contratto.pdf"
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                        <span className="text-xs uppercase tracking-widest text-gray-500">Caricamento PDF...</span>
                      </div>
                    }
                    error={
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <FileText size={48} className="text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600 mb-6 font-bergen-mono uppercase tracking-widest">
                          Errore nel caricamento del PDF.
                        </p>
                        <a
                          href="/contratto.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-black text-white py-3 px-6 text-xs font-bold tracking-widest uppercase font-neue-haas hover:bg-gray-900 transition-colors"
                        >
                          Apri PDF in Nuova Scheda
                        </a>
                      </div>
                    }
                  >
                    {numPages && containerWidth && Array.from(new Array(numPages), (el, index) => (
                      <div key={`page_container_${index + 1}`} className="mb-4 bg-white shadow-lg mx-auto" style={{ width: 'fit-content' }}>
                        <Page
                          key={`page_${index + 1}`}
                          pageNumber={index + 1}
                          width={containerWidth}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          devicePixelRatio={window.devicePixelRatio || 2} // Massima nitidezza su retina
                          className="mx-auto"
                        />
                      </div>
                    ))}
                  </Document>
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>
        </div>
      )}

      {/* WARNING OVERLAY: DATI MANCANTI */}
      {
        missingData && (
          <div className="fixed top-0 left-0 w-full bg-red-600 text-white z-[100] p-4 text-center font-bold uppercase tracking-widest text-xs animate-pulse">
            ⚠️ ATTENZIONE: NESSUN DATO DAL QR (USA DEFAULT)
          </div>
        )
      }

      {/* INSTALL PROMPT OVERLAY (iOS Style) */}
      {
        showInstallPrompt && (
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
        )
      }

      {/* TEMPLATE NASCOSTO PER CONDIVISIONE */}
      <StoryTemplate contractData={contractData} partyA={partyA} partyB={partyB} />
    </div >
  );
};

export default App;
