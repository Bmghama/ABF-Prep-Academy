import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { 
  BookOpen, Briefcase, TrendingUp, Shield, Award, 
  GraduationCap, Play, DollarSign, LogOut, FileText, 
  Search, Download, Bell, Bot,
  Trophy, Zap, UserCheck, Calculator, Book,
  ArrowRight, Loader2, Send, ChevronLeft,
  Building2, X, MessageSquare, AlertCircle, Eye, EyeOff,
  CheckCircle, ShieldCheck, Activity, Fingerprint,
  User, Lock, AlertTriangle, HelpCircle, Plus, Users,
  Mic, UserRound, GraduationCap as TeacherIcon,
  Layers, Lock as LockIcon, Scale, PieChart
} from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { ViewState, UserProfile, JobTask, CourseContent, JobSector, FlashModule, QuizQuestion, ForumPost } from './types';
import { COURSES, ALL_SIMULATIONS, GLOSSARY_DATA, FLASH_MODULES, ROLES_BY_SECTOR, DIFFICULTY_LEVELS } from './constants';
import { evaluateSimulationStep, analyzeForumPost, evaluateInterviewAnswer, generateInterviewQuestion, askMentor, generateInterviewScenario, checkRegulatoryCompliance, analyzeFinancialStatement } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { generateCertificatePDF, generateSerial } from './services/certificateService';
import { authService } from './services/authService';

const formatFCFA = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount).replace('XOF', 'FCFA');

// --- NOTIFICATION SYSTEM ---
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const Toast: React.FC<{ n: Notification; onClose: () => void }> = ({ n, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-fade-in-up w-full md:w-80 z-[1600] pointer-events-auto ${
      n.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
      n.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-abf-primary/10 border-abf-primary/20 text-abf-primary'
    }`}>
      <div className="shrink-0">{n.type === 'success' ? <CheckCircle size={20}/> : n.type === 'error' ? <AlertCircle size={20}/> : <Bell size={20}/>}</div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-[10px] uppercase tracking-widest leading-none mb-1">{n.title}</p>
        <p className="text-[10px] opacity-80 font-medium truncate">{n.message}</p>
      </div>
      <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity"><X size={14}/></button>
    </div>
  );
};

// --- INSTANT DEFINITION MODAL ---
const LexiconOverlay = ({ term, definition, onClose }: { term: string, definition: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
    <div className="bg-slate-900 border border-abf-gold/30 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4.5rem] max-w-lg w-full shadow-2xl space-y-6 relative">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
      <div className="flex items-center gap-4 text-abf-gold">
        <Book size={40} />
        <h3 className="text-3xl font-black uppercase italic tracking-tighter">Lexique ABF</h3>
      </div>
      <div className="space-y-4">
        <h4 className="text-xl font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">{term}</h4>
        <p className="text-slate-300 text-lg md:text-xl font-medium italic leading-relaxed">{definition}</p>
      </div>
      <button onClick={onClose} className="w-full py-5 bg-abf-gold text-black rounded-2xl font-black text-sm uppercase hover:scale-[1.02] transition-all shadow-xl shadow-amber-500/20">Compris</button>
    </div>
  </div>
);

// --- SHARED COMPONENTS ---
const BackButton = ({ onClick, label = "Retour" }: { onClick: () => void, label?: string }) => (
  <button 
    onClick={onClick} 
    className="group flex items-center gap-2 mb-4 md:mb-8 text-slate-500 hover:text-white font-black text-[clamp(9px,3vw,11px)] uppercase tracking-[0.2em] transition-all bg-white/5 py-2 px-4 rounded-xl md:bg-transparent md:p-0"
  >
    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
    {label}
  </button>
);

const SectionTitle = ({ title, subtitle, highlight }: { title: string, subtitle?: string, highlight?: string }) => (
  <div className="mb-8 md:mb-12 space-y-2 md:space-y-4">
    <h1 className="text-[clamp(1.5rem,8vw,5rem)] font-black italic tracking-tighter uppercase leading-[0.85] text-white">
      {title} <br/>
      {highlight && <span className="text-abf-primary">{highlight}</span>}
    </h1>
    {subtitle && <p className="text-[clamp(0.85rem,4vw,1.25rem)] text-slate-500 font-medium italic max-w-2xl leading-relaxed">{subtitle}</p>}
  </div>
);

// --- AI PROFESSOR ASSISTANT ---
const ABFProAssistant = ({ isOpen, onClose, user, addNotify }: { isOpen: boolean, onClose: () => void, user: UserProfile | null, addNotify: any }) => {
  const [messages, setMessages] = useState<{role: 'ai'|'user', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input; setInput(''); 
    setMessages(prev => [...prev, {role:'user', text: userMsg}]);
    setLoading(true);
    try {
        const context = user ? `Étudiant: ${user.name}, Niveau: ${user.level}` : "Étudiant anonyme";
        const response = await askMentor(userMsg, context);
        setMessages(prev => [...prev, {role:'ai', text: response}]);
    } catch (e) {
        addNotify("Mentor", "Erreur réseau IA.", "error");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-950/95 backdrop-blur-3xl flex flex-col md:inset-auto md:bottom-24 md:right-6 md:w-[400px] md:h-[620px] md:rounded-[3rem] md:border md:border-white/10 overflow-hidden animate-fade-in-up shadow-2xl">
      <div className="p-5 md:p-6 border-b border-white/5 bg-gradient-to-r from-abf-primary/20 to-transparent flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-abf-primary p-2.5 rounded-xl text-white shadow-lg"><Bot size={24}/></div>
          <div>
            <h3 className="font-black uppercase text-[10px] tracking-widest text-white">Mentor ABF Academy</h3>
            <span className="text-[8px] uppercase font-black text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Professeur en ligne</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20}/></button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50 space-y-6">
             <div className="p-6 bg-white/5 rounded-full"><GraduationCap size={48} className="text-abf-gold"/></div>
             <p className="text-xs font-medium italic leading-relaxed">Bienvenue dans votre assistance académique continue. Posez-moi vos questions techniques.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-[12px] font-medium leading-relaxed ${m.role === 'ai' ? 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5 shadow-xl' : 'bg-abf-primary text-white rounded-tr-none shadow-lg'}`}>
              <ReactMarkdown>{m.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest animate-pulse flex items-center gap-2 px-2"><Loader2 size={12} className="animate-spin"/> Le mentor analyse...</div>}
      </div>
      <div className="p-4 bg-white/5 border-t border-white/5 flex gap-2 pb-10 md:pb-4">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && handleSend()} 
          placeholder="Votre question (KYC, Bilan, CIMA...)" 
          className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-4 text-sm outline-none focus:ring-2 ring-abf-primary text-white shadow-inner"
        />
        <button onClick={handleSend} disabled={loading || !input.trim()} className="bg-abf-primary p-4 rounded-xl text-white shadow-xl shadow-sky-500/20 active:scale-95 transition-all disabled:opacity-50"><Send size={20}/></button>
      </div>
    </div>
  );
};

// --- SIMULATION RUNNER VIEW ---
const SimulationRunnerView = ({ task, onBack, user, updateUser, addNotify }: { task: JobTask, onBack: () => void, user: UserProfile, updateUser: (u: UserProfile) => void, addNotify: any }) => {
  const [messages, setMessages] = useState<{role: 'ai' | 'user' | 'professor', text: string, data?: any}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ 
      role: 'ai', 
      text: `### DOSSIER : ${task.title}\n\n**CONTEXTE :** ${task.context}\n\n**SITUATION :** ${task.situation}\n\n---\n\n**CLIENT :** "${task.initialDialogue}"` 
    }]);
  }, [task]);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput(''); setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const history = messages.map(m => `${m.role}: ${m.text}`).join('\n');
      const evaluation = await evaluateSimulationStep(task.situation, msg, history, task.jobRole);
      
      setMessages(prev => [
        ...prev,
        { role: 'professor', text: evaluation.feedback, data: evaluation }
      ]);

      if (evaluation.isComplete) {
        setIsFinished(true);
        const xpGained = Math.round(evaluation.score * 5); 
        await updateUser({ ...user, xp: user.xp + xpGained, careerStats: { ...user.careerStats, tasksCompleted: user.careerStats.tasksCompleted + 1 } });
        addNotify("Dossier Clos", `Score: ${evaluation.score}/100. XP: +${xpGained}`, "success");
        if (evaluation.score > 70) confetti({ particleCount: 150, spread: 70 });
        
        // Save to Supabase (via wrapper inside updateUser theoretically, but specifically here for record)
        await supabase.from('simulations_results').insert({ user_id: user.id, task_id: task.id, score: evaluation.score, details: evaluation });
      }
    } catch (e) {
      addNotify("Mentor", "Erreur d'analyse.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col animate-fade-in overflow-hidden">
      <BackButton onClick={onBack} label="Quitter le dossier" />
      <div className="flex-1 bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 md:p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-abf-primary rounded-xl flex items-center justify-center text-white shadow-lg"><FileText size={24}/></div>
             <div>
                <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-white">{task.title}</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{task.jobRole} • Difficulté {task.difficulty}/5</p>
             </div>
          </div>
          <div className="flex gap-2">
            {task.documents.map((doc: any, i: number) => (
                <button key={i} onClick={() => addNotify(doc.title, doc.content, "info")} className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors">
                    <Book size={14} className="text-abf-gold"/>
                    <span className="text-[9px] font-black uppercase text-white">{doc.title}</span>
                </button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'ai' ? 'justify-start' : m.role === 'professor' ? 'justify-center w-full' : 'justify-end animate-fade-in-up'}`}>
               {m.role === 'professor' ? (
                 <div className="w-full max-w-3xl bg-slate-800/80 border border-white/10 p-8 rounded-[3rem] space-y-6 animate-fade-in-up my-4 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><TeacherIcon size={120}/></div>
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4 relative z-10">
                      <div className={`p-3 rounded-2xl ${m.data.isCorrect ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        <TeacherIcon size={28}/>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-400">SUPERVISEUR TECHNIQUE</h4>
                          <span className="bg-abf-gold text-black px-3 py-1 rounded-full text-[10px] font-black shadow-lg">Score: {m.data.score}/100</span>
                        </div>
                        <p className={`text-[12px] font-black uppercase tracking-widest ${m.data.isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                          {m.data.isCorrect ? 'Analyse validée' : 'Correction requise'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-6 relative z-10">
                      <p className="text-sm md:text-lg text-slate-200 font-medium italic leading-relaxed">"{m.data.detailedExplanation}"</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-abf-gold/10 p-6 rounded-[2rem] border border-abf-gold/20">
                          <span className="text-[10px] font-black uppercase text-abf-gold tracking-widest block mb-2 flex items-center gap-2"><Book size={14}/> TERME TECHNIQUE</span>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-medium italic">{m.data.keyTermDefinition}</p>
                        </div>
                        <div className="bg-abf-primary/10 p-6 rounded-[2rem] border border-abf-primary/20">
                          <span className="text-[10px] font-black uppercase text-abf-primary tracking-widest block mb-2 flex items-center gap-2"><Zap size={14}/> CONSEIL TERRAIN</span>
                          <p className="text-[11px] text-slate-300 italic leading-relaxed font-medium">{m.data.fieldAdvice}</p>
                        </div>
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className={`max-w-[90%] md:max-w-[75%] p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] text-sm md:text-2xl font-medium leading-relaxed ${m.role === 'ai' ? 'bg-white/5 text-slate-200 border border-white/5 shadow-xl' : 'bg-abf-primary text-white shadow-2xl shadow-sky-500/20'}`}>
                   <ReactMarkdown>{m.text}</ReactMarkdown>
                 </div>
               )}
            </div>
          ))}
          {loading && <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest animate-pulse flex items-center gap-3"><Loader2 size={16} className="animate-spin"/> Analyse du superviseur...</div>}
          
          {isFinished && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-12 md:p-20 rounded-[4rem] text-center space-y-10 animate-fade-in-up shadow-2xl">
              <ShieldCheck size={120} className="text-abf-gold mx-auto drop-shadow-lg"/>
              <h3 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter text-white">DOSSIER TRAITÉ</h3>
              <p className="text-slate-400 text-lg md:text-3xl font-medium italic max-w-3xl mx-auto">Votre rigueur technique sur ce cas client a été exemplaire.</p>
              <button onClick={onBack} className="w-full md:w-auto px-16 py-8 bg-emerald-500 text-white font-black rounded-full uppercase text-xl md:text-2xl shadow-2xl hover:scale-105 transition-all">RETOURNER AU BUREAU</button>
            </div>
          )}
        </div>

        {!isFinished && (
          <form onSubmit={handleSend} className="p-4 md:p-10 bg-slate-900 border-t border-white/5 flex gap-4 md:gap-8 pb-24 md:pb-10">
            <input required value={input} onChange={e => setInput(e.target.value)} placeholder="Décrivez votre action ou réponse..." className="flex-1 bg-slate-800/80 border-none rounded-xl md:rounded-full px-6 md:px-12 py-5 md:py-8 outline-none focus:ring-4 ring-abf-primary text-sm md:text-3xl text-white shadow-inner font-medium italic"/>
            <button type="submit" disabled={loading || !input.trim()} className="bg-abf-primary p-5 md:p-10 rounded-xl md:rounded-full text-white shadow-xl shadow-sky-500/20 active:scale-95 transition-all shrink-0"><Send size={32}/></button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- SIMULATION HUB (Strict hierarchy enforced) ---
const SimulationHub = ({ onBack, onSelect }: any) => {
  const [selectedTrack, setSelectedTrack] = useState<'ASSURANCE' | 'BANQUE' | 'FINANCE' | null>(null);
  
  if (!selectedTrack) {
    return (
      <div className="animate-fade-in space-y-8 pb-32">
        <BackButton onClick={onBack} label="Dashboard"/>
        <SectionTitle title="Missions" highlight="Professionnelles" subtitle="Accédez aux dossiers techniques par département." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div onClick={() => setSelectedTrack('ASSURANCE')} className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 hover:border-emerald-500 cursor-pointer shadow-xl group transition-all">
             <ShieldCheck size={48} className="text-emerald-500 mb-6"/>
             <h3 className="text-2xl font-black uppercase text-white mb-2">SINISTRE</h3>
             <p className="text-slate-500 text-xs italic font-bold">Assurance & IARD</p>
             <p className="text-slate-600 text-[10px] mt-4">Gestion des déclarations, expertise terrain, indemnisation.</p>
          </div>
          <div onClick={() => setSelectedTrack('BANQUE')} className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 hover:border-abf-primary cursor-pointer shadow-xl group transition-all">
             <Building2 size={48} className="text-abf-primary mb-6"/>
             <h3 className="text-2xl font-black uppercase text-white mb-2">CRÉDIT</h3>
             <p className="text-slate-500 text-xs italic font-bold">Banque & Risques</p>
             <p className="text-slate-600 text-[10px] mt-4">Analyse dossiers prêts, conformité KYC, opérations de caisse.</p>
          </div>
          <div onClick={() => setSelectedTrack('FINANCE')} className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 hover:border-abf-gold cursor-pointer shadow-xl group transition-all">
             <TrendingUp size={48} className="text-abf-gold mb-6"/>
             <h3 className="text-2xl font-black uppercase text-white mb-2">BILAN</h3>
             <p className="text-slate-500 text-xs italic font-bold">Finance & Audit</p>
             <p className="text-slate-600 text-[10px] mt-4">Analyse états financiers, audit comptable, trésorerie.</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter tasks based on selected track
  const filtered = ALL_SIMULATIONS.filter(s => s.sector === selectedTrack);

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      <BackButton onClick={() => setSelectedTrack(null)} label="Retour aux Départements"/>
      <SectionTitle title="Dossiers" highlight={selectedTrack === 'BANQUE' ? 'Crédit' : selectedTrack === 'ASSURANCE' ? 'Sinistre' : 'Bilan'} subtitle={`Liste des cas ${selectedTrack.toLowerCase()} en attente de traitement.`} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(s => (
            <div key={s.id} onClick={() => onSelect(s)} className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 hover:border-abf-primary cursor-pointer group shadow-xl h-full flex flex-col justify-between">
               <div>
                 <div className="flex justify-between items-start mb-4">
                    <span className="bg-white/5 px-3 py-1 rounded-full text-[8px] font-black uppercase text-slate-400 block w-fit">{s.category}</span>
                    <span className={`w-3 h-3 rounded-full ${s.difficulty > 3 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                 </div>
                 <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter text-white leading-tight">{s.title}</h3>
                 <p className="text-slate-500 text-[10px] italic line-clamp-2">{s.situation}</p>
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white mt-6 group-hover:gap-4 transition-all">OUVRIR DOSSIER <Play size={10} fill="currentColor"/></div>
            </div>
          ))}
      </div>
    </div>
  );
};

// --- LEADERBOARD VIEW ---
const LeaderboardView = ({ onBack, user }: any) => {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      // Fetch real users from authService (which uses supabase/mock)
      const users = await authService.getAllUsers();
      setLeaders(users);
      setLoading(false);
    };
    fetchLeaders();
  }, []);

  return (
    <div className="animate-fade-in space-y-12 pb-32">
        <BackButton onClick={onBack} label="Dashboard"/>
        <SectionTitle title="Podium" highlight="National" />
        <div className="bg-slate-900/50 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl min-h-[400px]">
            {loading ? (
                <div className="flex items-center justify-center h-full p-20"><Loader2 className="animate-spin text-abf-gold" size={48}/></div>
            ) : (
                leaders.map((l, i) => (
                <div key={l.id} className={`p-8 md:p-10 flex justify-between items-center px-10 md:px-20 transition-all border-b border-white/5 ${l.id === user.id ? 'bg-abf-primary/10' : 'hover:bg-white/5'}`}>
                    <div className="flex items-center gap-8">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${i === 0 ? 'bg-abf-gold text-black' : (i===1 ? 'bg-slate-300 text-black' : (i===2 ? 'bg-orange-700 text-white' : 'bg-white/5 text-slate-500'))}`}>{i + 1}</div>
                        <div>
                            <p className="font-black text-xl md:text-2xl uppercase italic text-white">{l.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">{l.currentSector || 'GÉNÉRALISTE'}</p>
                        </div>
                    </div>
                    <p className="text-3xl md:text-5xl font-black text-abf-primary italic">{l.xp}</p>
                </div>
                ))
            )}
            {!loading && leaders.length === 0 && (
                <div className="p-20 text-center text-slate-500 font-bold italic">Aucun participant classé pour le moment.</div>
            )}
        </div>
    </div>
  );
};

// --- INTERVIEW SIMULATOR HUB ---
const InterviewHub = ({ onBack, user, updateUser, addNotify }: any) => {
  const [started, setStarted] = useState(false);
  const [role, setRole] = useState('Chargé de Clientèle');
  const [diff, setDiff] = useState(2);
  const [history, setHistory] = useState<{role: 'ai'|'user'|'feedback', text: string, data?: any}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [history]);

  const startSession = async () => {
    setLoading(true);
    try {
      const scenario = await generateInterviewScenario(role, diff);
      setHistory([{ role: 'ai', text: `### CONTEXTE : ${scenario.companyName}\n\n${scenario.scenarioContext}\n\n---\n\n**RECRUTEUR :** ${scenario.firstQuestion}` }]);
      setStarted(true);
    } catch (e) { addNotify("Erreur", "Impossible de démarrer.", "error"); }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const answer = input; setInput('');
    // Find last question from AI
    const lastAiMsg = [...history].reverse().find(m => m.role === 'ai');
    const questionText = lastAiMsg ? lastAiMsg.text : "Présentez-vous.";
    
    setHistory(prev => [...prev, { role: 'user', text: answer }]);
    setLoading(true);

    try {
      const evalResult = await evaluateInterviewAnswer(questionText, answer, role, diff);
      setHistory(prev => [...prev, { role: 'feedback', text: '', data: evalResult }]);
      
      const nextQ = await generateInterviewQuestion(role, history, diff);
      setHistory(prev => [...prev, { role: 'ai', text: nextQ }]);
    } catch (e) { addNotify("Erreur", "Problème technique.", "error"); }
    finally { setLoading(false); }
  };

  if (!started) return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-32">
       <BackButton onClick={onBack} label="Dashboard"/>
       <SectionTitle title="Entretien" highlight="Simulateur IA" subtitle="Entraînez-vous face à un recruteur virtuel exigeant." />
       <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 md:p-16 space-y-8 shadow-2xl">
          <div className="space-y-4">
             <label className="text-xs font-black uppercase text-slate-500">Poste Cible</label>
             <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-slate-800 p-6 rounded-2xl text-white font-bold outline-none focus:ring-2 ring-abf-primary border border-white/5">
                {Object.values(ROLES_BY_SECTOR).flat().map(r => <option key={r} value={r}>{r}</option>)}
             </select>
          </div>
          <div className="space-y-4">
             <label className="text-xs font-black uppercase text-slate-500">Niveau de Difficulté</label>
             <div className="grid grid-cols-5 gap-2">
                {[1,2,3,4,5].map(d => (
                   <button key={d} onClick={() => setDiff(d)} className={`py-4 rounded-xl font-black transition-all ${diff === d ? 'bg-abf-primary text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>{d}</button>
                ))}
             </div>
             <p className="text-[10px] text-slate-400 italic text-right">Niveau {diff}: {DIFFICULTY_LEVELS.find(l => l.id === diff)?.label}</p>
          </div>
          <button onClick={startSession} disabled={loading} className="w-full py-8 bg-abf-primary text-white font-black rounded-full uppercase text-xl shadow-xl flex items-center justify-center gap-4">
             {loading ? <Loader2 className="animate-spin"/> : 'COMMENCER L\'ENTRETIEN'}
          </button>
       </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col animate-fade-in">
       <BackButton onClick={() => setStarted(false)} label="Arrêter"/>
       <div className="flex-1 bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col relative">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar pb-32">
             {history.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   {m.role === 'feedback' ? (
                      <div className="w-full mx-auto bg-slate-800/50 border border-white/5 p-6 rounded-[2rem] text-sm space-y-4 animate-fade-in-up">
                         <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${m.data.isCorrect ? 'text-emerald-500' : 'text-orange-500'}`}>{m.data.isCorrect ? 'VALIDÉ' : 'À AMÉLIORER'} ({m.data.score}/10)</span>
                         </div>
                         <p className="text-slate-300 italic">"{m.data.feedback}"</p>
                         <p className="text-[10px] text-slate-500">{m.data.fieldAdvice}</p>
                      </div>
                   ) : (
                      <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm md:text-lg font-medium leading-relaxed ${m.role === 'ai' ? 'bg-white/5 text-slate-200 rounded-tl-none' : 'bg-abf-primary text-white rounded-tr-none shadow-lg'}`}>
                         <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                   )}
                </div>
             ))}
             {loading && <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest animate-pulse">Le recruteur écrit...</div>}
          </div>
          <div className="p-6 bg-slate-900 border-t border-white/5 absolute bottom-0 left-0 right-0">
             <div className="flex gap-4">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Votre réponse..." className="flex-1 bg-slate-800 border-none rounded-xl px-6 py-4 outline-none focus:ring-2 ring-abf-primary text-white"/>
                <button onClick={handleSend} disabled={loading || !input.trim()} className="bg-abf-primary p-4 rounded-xl text-white shadow-lg"><Send size={24}/></button>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- TOOLS HUB ---
const ToolsHub = ({ navigate, onBack }: any) => (
    <div className="animate-fade-in space-y-8 pb-32">
        <BackButton onClick={onBack} label="Dashboard" />
        <SectionTitle title="Boîte à Outils" highlight="Professionnelle" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard icon={Shield} title="Compliance Center" desc="Vérification LCB-FT & Normes." onClick={() => navigate(ViewState.COMPLIANCE_CENTER)} color="text-red-400"/>
            <DashboardCard icon={PieChart} title="Analyse Bilan" desc="Ratios OHADA & Diagnostic." onClick={() => navigate(ViewState.BILAN_ANALYZER)} color="text-blue-400"/>
            <DashboardCard icon={FileText} title="CV Builder" desc="Générateur de Certificats." onClick={() => navigate(ViewState.CV_BUILDER)} color="text-emerald-400"/>
            <DashboardCard icon={DollarSign} title="Simulateur Salaire" desc="Calcul Net/Brut Mali." onClick={() => navigate(ViewState.SALARY_SIM)} color="text-yellow-400"/>
            <DashboardCard icon={Book} title="Lexique Pro" desc="Dictionnaire Technique." onClick={() => navigate(ViewState.GLOSSARY)} color="text-purple-400"/>
        </div>
    </div>
);

// --- COMPLIANCE CENTER TOOL ---
const ComplianceCenter = ({ onBack }: any) => {
    const [desc, setDesc] = useState('');
    const [type, setType] = useState('Particulier');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleCheck = async () => {
        if (!desc) return;
        setLoading(true);
        try {
            const res = await checkRegulatoryCompliance(desc, type);
            setResult(res);
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-32">
            <BackButton onClick={onBack} label="Outils" />
            <SectionTitle title="Compliance" highlight="Center" subtitle="Vérifiez la conformité réglementaire (UMOA) d'une opération." />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 shadow-xl space-y-6 h-fit">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500">Type de Client</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-800 p-4 rounded-xl text-white font-bold border-none outline-none">
                            <option value="Particulier">Particulier</option>
                            <option value="Entreprise">Entreprise (SA/SARL)</option>
                            <option value="PEP">PEP (Personne Exposée Politiquement)</option>
                            <option value="ONG">ONG / Association</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-500">Description de l'opération</label>
                        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={6} placeholder="Ex: Dépôt espèces de 25 millions FCFA sans justificatif..." className="w-full bg-slate-800 p-4 rounded-xl text-white font-medium border-none outline-none resize-none focus:ring-2 ring-abf-primary"/>
                    </div>
                    <button onClick={handleCheck} disabled={loading || !desc} className="w-full py-4 bg-abf-primary text-white font-black rounded-xl uppercase shadow-lg flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : <><ShieldCheck size={20}/> ANALYSER LE RISQUE</>}
                    </button>
                </div>

                <div className="space-y-6">
                    {result ? (
                        <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black uppercase italic text-white">Rapport IA</h3>
                                <span className={`px-4 py-2 rounded-full text-xs font-black uppercase ${result.riskLevel === 'CRITIQUE' ? 'bg-red-500 text-white' : (result.riskLevel === 'ÉLEVÉ' ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white')}`}>{result.riskLevel}</span>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Recommandation</span>
                                    <p className="text-white font-medium italic">{result.recommendation}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Drapeaux Rouges</span>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {result.flags?.map((f:string, i:number) => <li key={i} className="text-xs text-slate-300">{f}</li>)}
                                    </ul>
                                </div>
                                <div className="p-4 bg-abf-gold/10 border border-abf-gold/20 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-abf-gold block mb-1">Référence BCEAO</span>
                                    <p className="text-xs text-abf-gold font-medium">{result.bceaoReference}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 p-10 bg-white/5 rounded-[3rem] border border-white/5 border-dashed">
                             <Shield size={48} className="opacity-20"/>
                             <p className="text-xs font-black uppercase tracking-widest text-center">En attente des données</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- BILAN ANALYZER TOOL ---
const BilanAnalyzer = ({ onBack }: any) => {
    const [data, setData] = useState({ actif: 0, passif: 0, capitaux: 0, resultat: 0 });
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (data.actif === 0) return;
        setLoading(true);
        try {
            const res = await analyzeFinancialStatement(data);
            setAnalysis(res);
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-32">
            <BackButton onClick={onBack} label="Outils" />
            <SectionTitle title="Analyse" highlight="Financière" subtitle="Diagnostic automatisé des états financiers (OHADA)." />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-slate-900 p-8 rounded-[3rem] border border-white/10 shadow-xl space-y-6 h-fit">
                    <h3 className="text-lg font-black uppercase italic text-white mb-4">Données du Bilan</h3>
                    {Object.keys(data).map(k => (
                        <div key={k} className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500">{k}</label>
                            <input type="number" value={(data as any)[k]} onChange={e => setData({...data, [k]: Number(e.target.value)})} className="w-full bg-slate-800 p-3 rounded-xl text-white font-mono text-sm outline-none focus:ring-2 ring-abf-primary border border-white/5"/>
                        </div>
                    ))}
                    <button onClick={handleAnalyze} disabled={loading} className="w-full py-4 bg-abf-primary text-white font-black rounded-xl uppercase shadow-lg flex items-center justify-center gap-2 mt-4">
                        {loading ? <Loader2 className="animate-spin"/> : <><TrendingUp size={20}/> GÉNÉRER RAPPORT</>}
                    </button>
                </div>

                <div className="lg:col-span-2">
                    {analysis ? (
                        <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl animate-fade-in-up space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black uppercase italic text-white">Diagnostic</h2>
                                    <p className="text-slate-500 text-xs font-bold uppercase mt-1">Santé Financière: <span className={analysis.healthStatus === 'SAINE' ? 'text-emerald-500' : 'text-red-500'}>{analysis.healthStatus}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-500">ROE</p>
                                    <p className="text-2xl font-black text-abf-gold">{analysis.roe}</p>
                                </div>
                            </div>
                            
                            <div className="prose prose-invert prose-sm">
                                <p className="text-lg font-medium italic text-slate-300 leading-relaxed">"{analysis.analysis}"</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-emerald-500 block mb-2 flex items-center gap-2"><ArrowRight size={12}/> FORCES</span>
                                    <ul className="list-disc pl-4 space-y-1">
                                         {analysis.strengths?.map((s:string, i:number) => <li key={i} className="text-xs text-slate-300">{s}</li>)}
                                    </ul>
                                </div>
                                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-red-500 block mb-2 flex items-center gap-2"><AlertTriangle size={12}/> FAIBLESSES</span>
                                    <ul className="list-disc pl-4 space-y-1">
                                         {analysis.weaknesses?.map((s:string, i:number) => <li key={i} className="text-xs text-slate-300">{s}</li>)}
                                    </ul>
                                </div>
                            </div>
                             <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <span className="text-[10px] font-black uppercase text-abf-primary block mb-2">Conseil Stratégique</span>
                                <p className="text-sm font-medium italic text-white">{analysis.recommendation}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 p-20 bg-white/5 rounded-[3rem] border border-white/5 border-dashed">
                             <PieChart size={64} className="opacity-20"/>
                             <p className="text-xs font-black uppercase tracking-widest text-center">Entrez les données du bilan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- DASHBOARD CARD ---
const DashboardCard = ({ icon: Icon, title, desc, onClick, color }: any) => (
  <div onClick={onClick} className={`bg-slate-900 p-6 md:p-10 rounded-[2.5rem] border border-white/5 hover:border-${color.split('-')[1] || 'white'} cursor-pointer transition-all shadow-xl group h-full flex flex-col justify-between`}>
    <div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${color.replace('text-', 'bg-')}/10`}>
        <Icon size={32} className={color}/>
      </div>
      <h3 className="text-xl md:text-2xl font-black uppercase italic text-white mb-2">{title}</h3>
      <p className="text-slate-500 text-xs md:text-sm font-medium italic leading-relaxed">{desc}</p>
    </div>
    <div className={`mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${color} opacity-60 group-hover:opacity-100 transition-opacity`}>
      ACCÉDER <ArrowRight size={14}/>
    </div>
  </div>
);

// --- APP COMPONENT ---
const App = () => {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getSession());
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [selectedCourse, setSelectedCourse] = useState<CourseContent | null>(null);
  const [currentTask, setCurrentTask] = useState<JobTask | null>(null);
  const [filterSector, setFilterSector] = useState<JobSector | 'ALL'>('ALL');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lexiconTerm, setLexiconTerm] = useState<{term: string, definition: string} | null>(null);

  const addNotify = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, title, message, type }, ...prev]);
  };

  const navigate = (v: ViewState) => { setView(v); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleUpdateUser = async (u: UserProfile) => {
    setUser(u);
    await authService.updateUser(u);
  };

  const handleLogin = (u: UserProfile) => {
    setUser(u);
    navigate(ViewState.DASHBOARD);
    addNotify("Connecté", `Heureux de vous revoir, ${u.name.split(' ')[0]}`, "success");
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate(ViewState.LANDING);
    addNotify("À bientôt", "Session terminée.", "info");
  };

  const renderView = () => {
    if (!user && ![ViewState.LANDING, ViewState.AUTH].includes(view)) return <AuthView onLogin={handleLogin} addNotify={addNotify} />;

    switch(view) {
      case ViewState.LANDING: return <LandingView onStart={() => navigate(ViewState.AUTH)} />;
      case ViewState.AUTH: return <AuthView onLogin={handleLogin} addNotify={addNotify} />;
      case ViewState.DASHBOARD: return <Dashboard user={user!} setView={navigate} />;
      case ViewState.COURSE_CATALOG: return <CourseCatalog onBack={() => navigate(ViewState.DASHBOARD)} onSelect={c => { setSelectedCourse(c); navigate(ViewState.COURSE_READER); }} filter={filterSector} setFilter={setFilterSector} />;
      case ViewState.COURSE_READER: return selectedCourse ? <CourseReader course={selectedCourse} onBack={() => navigate(ViewState.COURSE_CATALOG)} onQuiz={() => navigate(ViewState.COURSE_QUIZ)} onLexicon={() => navigate(ViewState.GLOSSARY)} /> : null;
      case ViewState.COURSE_QUIZ: return selectedCourse ? <QuizView questions={selectedCourse.quiz || []} user={user!} onBack={() => navigate(ViewState.COURSE_READER)} onComplete={() => navigate(ViewState.COURSE_CATALOG)} updateUser={handleUpdateUser} addNotify={addNotify} /> : null;
      case ViewState.SIMULATION_HUB: return <SimulationHub onBack={() => navigate(ViewState.DASHBOARD)} onSelect={t => { setCurrentTask(t); navigate(ViewState.SIMULATION_RUNNER); }} />;
      case ViewState.SIMULATION_RUNNER: return currentTask ? <SimulationRunnerView task={currentTask} onBack={() => navigate(ViewState.SIMULATION_HUB)} user={user!} updateUser={handleUpdateUser} addNotify={addNotify} /> : null;
      case ViewState.INTERVIEW_PREP: return <InterviewHub onBack={() => navigate(ViewState.DASHBOARD)} user={user!} updateUser={handleUpdateUser} addNotify={addNotify} />;
      case ViewState.TOOLS_HUB: return <ToolsHub navigate={navigate} onBack={() => navigate(ViewState.DASHBOARD)} />;
      case ViewState.CV_BUILDER: return <CVBuilderView user={user!} onBack={() => navigate(ViewState.TOOLS_HUB)} addNotify={addNotify} />;
      case ViewState.SALARY_SIM: return <SalarySimView onBack={() => navigate(ViewState.TOOLS_HUB)} />;
      case ViewState.GLOSSARY: return <GlossaryView onBack={() => navigate(ViewState.TOOLS_HUB)} onTermSelect={setLexiconTerm} />;
      case ViewState.LEADERBOARD: return <LeaderboardView user={user!} onBack={() => navigate(ViewState.DASHBOARD)} />;
      case ViewState.VIRTUAL_WORKPLACE: return <Workplace user={user!} onBack={() => navigate(ViewState.DASHBOARD)} onTask={t => { setCurrentTask(t); navigate(ViewState.SIMULATION_RUNNER); }} />;
      case ViewState.FLASH_REVISION: return <FlashRevisionView onBack={() => navigate(ViewState.DASHBOARD)} user={user!} updateUser={handleUpdateUser} addNotify={addNotify} />;
      case ViewState.FORUM: return <ForumView user={user!} onBack={() => navigate(ViewState.DASHBOARD)} addNotify={addNotify} />;
      case ViewState.COMPLIANCE_CENTER: return <ComplianceCenter onBack={() => navigate(ViewState.TOOLS_HUB)} />;
      case ViewState.BILAN_ANALYZER: return <BilanAnalyzer onBack={() => navigate(ViewState.TOOLS_HUB)} />;
      default: return <Dashboard user={user!} setView={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-abf-primary/30 font-sans">
      <div className="fixed top-24 right-6 z-[1600] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => <Toast key={n.id} n={n} onClose={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} />)}
      </div>

      {lexiconTerm && <LexiconOverlay term={lexiconTerm.term} definition={lexiconTerm.definition} onClose={() => setLexiconTerm(null)} />}

      {view !== ViewState.LANDING && view !== ViewState.AUTH && (
        <nav className="sticky top-0 z-[1000] bg-slate-900/90 backdrop-blur-2xl border-b border-white/5 h-16 md:h-20 flex items-center px-4 md:px-10">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(ViewState.DASHBOARD)}>
              <div className="bg-abf-gold p-1.5 md:p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg"><GraduationCap size={20} className="text-black"/></div>
              <span className="font-black text-lg md:text-2xl tracking-tighter uppercase italic">ABF <span className="text-abf-primary">ACADEMY</span></span>
            </div>
            <div className="flex items-center gap-2 md:gap-6">
              <button onClick={() => setIsAiOpen(true)} className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-abf-gold relative hover:bg-white/10 transition-all">
                <Bot size={18}/>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
              </button>
              <div className="w-px h-6 bg-white/10"></div>
              <button onClick={handleLogout} className="p-2.5 bg-white/5 rounded-xl border border-white/10 hover:text-red-500 hover:bg-red-500/10 transition-all"><LogOut size={18}/></button>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-10 pb-24">
        {renderView()}
      </main>

      <ABFProAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} user={user} addNotify={addNotify} />
      <SpeedInsights />
    </div>
  );
};

const AuthView = ({ onLogin, addNotify }: any) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', id: '', pwd: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.pwd || (!isLogin && !formData.name)) {
      addNotify("Attention", "Champs requis.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = isLogin 
        ? await authService.login(formData.id, formData.pwd) 
        : await authService.register({ name: formData.name, identifier: formData.id, password: formData.pwd });
      
      if (res.success && res.user) onLogin(res.user);
      else addNotify("Erreur", res.message || "Échec.", "error");
    } catch (e) { addNotify("Erreur", "Problème technique.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-2">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-3xl p-8 md:p-14 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-8 animate-fade-in-up">
        <div className="text-center">
          <div className="w-16 h-16 bg-abf-gold rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><ShieldCheck size={32} className="text-black"/></div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">{isLogin ? 'Connexion' : 'Inscription'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nom complet" className="w-full bg-slate-800/50 p-5 rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-abf-primary text-white border border-white/5"/>
          )}
          <input required value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} placeholder="Email ou Téléphone (+223)" className="w-full bg-slate-800/50 p-5 rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-abf-primary text-white border border-white/5"/>
          <div className="relative">
            <input required type={showPwd ? 'text' : 'password'} value={formData.pwd} onChange={e => setFormData({...formData, pwd: e.target.value})} placeholder="Mot de passe" className="w-full bg-slate-800/50 p-5 rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-abf-primary text-white border border-white/5"/>
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500">{showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
          </div>
          <button type="submit" disabled={loading} className="w-full py-6 bg-abf-primary font-black rounded-2xl uppercase shadow-xl hover:scale-[1.02] transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50">
            {loading ? <Loader2 size={24} className="animate-spin"/> : (isLogin ? 'SE CONNECTER' : 'S\'INSCRIRE')}
          </button>
        </form>
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-slate-500 text-[10px] uppercase font-black tracking-widest hover:text-white">{isLogin ? "Créer un compte" : "Se connecter"}</button>
      </div>
    </div>
  );
};

const LandingView = ({ onStart }: any) => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
    <div className="relative z-10 max-w-4xl space-y-12">
      <GraduationCap size={120} className="text-abf-gold mx-auto animate-bounce-short drop-shadow-2xl"/>
      <h1 className="text-[clamp(2.5rem,14vw,10rem)] font-black italic tracking-tighter uppercase leading-[0.75] text-white">
        ABF PREP <br/><span className="text-abf-primary">ACADEMY</span>
      </h1>
      <p className="text-[clamp(1rem,4vw,1.75rem)] text-slate-400 font-medium italic max-w-3xl mx-auto px-4">
        Banque, Assurance & Finance. Préparez votre avenir au Mali.
      </p>
      <button onClick={onStart} className="bg-abf-primary px-16 md:px-24 py-8 rounded-[2rem] font-black text-xl md:text-3xl flex items-center justify-center gap-8 hover:scale-105 transition-all shadow-2xl shadow-sky-500/40">
        DÉMARRER <Zap fill="currentColor" size={28}/>
      </button>
    </div>
  </div>
);

const Dashboard = ({ user, setView }: any) => (
  <div className="space-y-10 md:space-y-16 animate-fade-in">
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-16 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Building2 size={350}/></div>
      <div className="relative z-10 space-y-10">
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Étudiant Certifié</span>
            <span className="bg-abf-gold/20 text-abf-gold px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-abf-gold/20">XP: {user.xp}</span>
          </div>
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black italic tracking-tighter uppercase leading-[0.9] text-white">Bonjour, <span className="text-abf-primary">{user.name.split(' ')[0]}</span></h1>
          <p className="text-sm md:text-2xl text-slate-400 font-medium italic max-w-2xl leading-relaxed">Prêt pour votre prochain défi professionnel ?</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => setView(ViewState.SIMULATION_HUB)} className="bg-abf-primary px-12 py-5 rounded-2xl font-black text-xs md:text-lg uppercase flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl">
             <Play fill="currentColor" size={20}/> MISSIONS RÉELLES
          </button>
          <button onClick={() => setView(ViewState.INTERVIEW_PREP)} className="bg-white/10 text-white px-12 py-5 rounded-2xl font-black text-xs md:text-lg uppercase flex items-center justify-center gap-3 hover:scale-105 transition-all border border-white/10">
             <Mic fill="currentColor" size={20}/> ENTRETIEN IA
          </button>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardCard icon={BookOpen} title="Formations" desc="BCEAO, CIMA & OHADA." onClick={() => setView(ViewState.COURSE_CATALOG)} color="text-abf-primary"/>
      <DashboardCard icon={Calculator} title="Outils Pro" desc="Compliance & Analyse." onClick={() => setView(ViewState.TOOLS_HUB)} color="text-abf-gold"/>
      <DashboardCard icon={Trophy} title="Classement" desc="Top étudiants Mali." onClick={() => setView(ViewState.LEADERBOARD)} color="text-emerald-400"/>
      <DashboardCard icon={Users} title="Forum" desc="Échanges techniques." onClick={() => setView(ViewState.FORUM)} color="text-indigo-400"/>
    </div>
  </div>
);

const CourseCatalog = ({ onBack, onSelect, filter, setFilter }: any) => {
  const filtered = COURSES.filter(c => filter === 'ALL' || c.category === filter);
  return (
    <div className="animate-fade-in space-y-8 pb-32">
      <BackButton onClick={onBack} label="Dashboard"/>
      <SectionTitle title="Catalogue" highlight="Formation" />
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
         {['ALL', 'BANQUE', 'ASSURANCE', 'FINANCE'].map(s => (
           <button key={s} onClick={() => setFilter(s)} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase border transition-all ${filter === s ? 'bg-abf-primary border-abf-primary text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400'}`}>{s}</button>
         ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map(c => (
          <div key={c.id} onClick={() => onSelect(c)} className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 hover:border-abf-primary transition-all cursor-pointer shadow-xl h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter text-white leading-tight">{c.title}</h3>
              <p className="text-slate-500 text-[10px] italic mb-8">{c.description}</p>
            </div>
            <div className="flex items-center gap-2 text-abf-primary font-black text-[10px] uppercase">SUIVRE LE COURS <ArrowRight size={14}/></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CourseReader = ({ course, onBack, onQuiz, onLexicon }: any) => (
  <div className="animate-fade-in-up pb-32">
    <BackButton onClick={onBack} label="Catalogue"/>
    <div className="bg-slate-900 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl mt-4">
      <div className="p-8 md:p-16 bg-gradient-to-br from-abf-primary/10 to-transparent border-b border-white/5">
        <span className="px-4 py-1.5 bg-abf-primary/20 text-abf-primary rounded-full text-[10px] font-black uppercase tracking-widest">{course.category} • {course.level}</span>
        <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-[0.9] mt-6 text-white">{course.title}</h1>
      </div>
      <div className="p-8 md:p-16 prose prose-invert prose-sm md:prose-xl max-w-none text-slate-300 font-medium">
        <ReactMarkdown>{course.content}</ReactMarkdown>
      </div>
      <div className="p-8 md:p-16 bg-white/5 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
        <button onClick={onQuiz} className="w-full md:w-auto bg-abf-primary px-12 py-6 rounded-3xl font-black uppercase text-sm shadow-xl flex items-center justify-center gap-6 group">
          DÉMARRER LE QUIZ <Zap fill="currentColor" size={20}/>
        </button>
      </div>
    </div>
  </div>
);

const QuizView = ({ questions, user, onBack, onComplete, updateUser, addNotify }: any) => {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExp, setShowExp] = useState(false);
  const currentQ = questions[idx] as QuizQuestion;
  const handleValidate = () => { if (selected === null) return; if (selected === currentQ.correctAnswer) setScore(s => s + 1); setShowExp(true); };
  const handleNext = async () => { if (idx < questions.length - 1) { setIdx(idx + 1); setSelected(null); setShowExp(false); } else { setDone(true); const earnedXp = score * 200; await updateUser({ ...user, xp: user.xp + earnedXp }); addNotify("Quiz", `+${earnedXp} XP`, "success"); confetti(); } };
  if (done) return (
    <div className="max-w-2xl mx-auto p-12 bg-slate-900 border border-white/10 rounded-[3rem] text-center mt-10 shadow-2xl space-y-10">
      <Award size={100} className="text-abf-gold mx-auto"/>
      <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Score : {Math.round((score/questions.length)*100)}%</h2>
      <button onClick={onComplete} className="w-full py-6 bg-abf-primary text-white font-black rounded-[2rem] uppercase text-xl shadow-xl">CONTINUER</button>
    </div>
  );
  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20">
      <BackButton onClick={onBack} label="Arrêter"/>
      <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden">
        <h3 className="text-2xl md:text-4xl font-black mb-12 leading-tight italic text-white relative z-10">"{currentQ.question}"</h3>
        <div className="space-y-4 relative z-10">
          {currentQ.options.map((opt: string, i: number) => (
            <button key={i} disabled={showExp} onClick={() => setSelected(i)} className={`w-full p-6 rounded-2xl text-left font-black border-2 transition-all ${showExp ? (i === currentQ.correctAnswer ? 'border-emerald-500 bg-emerald-500/10' : (selected === i ? 'border-red-500 bg-red-500/10' : 'border-slate-800')) : (selected === i ? 'border-abf-primary bg-abf-primary/10 text-white' : 'border-slate-800 bg-slate-800/30 text-slate-500')}`}>
              {opt}
            </button>
          ))}
        </div>
        {!showExp ? <button onClick={handleValidate} disabled={selected === null} className="w-full mt-10 py-6 bg-white text-black font-black rounded-full uppercase disabled:opacity-30">VÉRIFIER</button> : <button onClick={handleNext} className="w-full mt-10 py-6 bg-abf-primary text-white font-black rounded-full uppercase">CONTINUER</button>}
      </div>
    </div>
  );
};

const Workplace = ({ user, onBack, onTask }: any) => {
  const mySims = ALL_SIMULATIONS.slice(0, 15);
  return (
    <div className="animate-fade-in space-y-12 pb-32">
      <BackButton onClick={onBack} label="Dashboard"/>
      <SectionTitle title="Bureau" highlight="Dossiers" subtitle="Traitement des cas clients en attente." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mySims.map(s => (
          <div key={s.id} onClick={() => onTask(s)} className="bg-slate-900 p-8 rounded-[3rem] border border-white/5 hover:border-abf-primary cursor-pointer transition-all shadow-xl">
            <h3 className="text-xl font-black uppercase italic mb-3 text-white">{s.title}</h3>
            <p className="text-slate-500 text-[10px] leading-relaxed italic mb-8 line-clamp-3">{s.situation}</p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white">OUVRIR <Play size={10} fill="currentColor"/></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GlossaryView = ({ onBack, onTermSelect }: any) => {
  const [q, setQ] = useState('');
  const filtered = GLOSSARY_DATA.filter(g => g.term.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="animate-fade-in space-y-10 pb-32">
      <BackButton onClick={onBack} label="Outils" />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher un terme..." className="w-full bg-slate-900 border border-white/10 rounded-full py-6 px-10 outline-none font-black text-white focus:ring-4 ring-abf-gold/20"/>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((g, i) => (
          <div key={i} onClick={() => onTermSelect(g)} className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 hover:border-abf-gold cursor-help transition-all shadow-xl">
            <h3 className="text-xl font-black uppercase italic text-abf-gold mb-2">{g.term}</h3>
            <p className="text-slate-400 text-[10px] italic leading-relaxed">{g.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const FlashRevisionView = ({ onBack, user, updateUser, addNotify }: any) => {
  const [curr, setCurr] = useState(0);
  const [show, setShow] = useState(false);
  const mod = FLASH_MODULES[curr % FLASH_MODULES.length];
  const handleNext = () => { setCurr(prev => prev + 1); setShow(false); updateUser({ ...user, xp: user.xp + 50 }); addNotify("Flash", "+50 XP", "success"); };
  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-32">
      <BackButton onClick={onBack} label="Dashboard"/>
      <SectionTitle title="Révision" highlight="Flash" />
      <div className="bg-slate-900 border border-abf-gold/20 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 space-y-10">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic text-white leading-tight">"{mod.question}"</h2>
          {show ? (
            <div className="space-y-6 animate-fade-in-up">
               <p className="text-2xl font-black text-emerald-500 mb-4">{mod.answer}</p>
               <p className="text-slate-300 italic font-medium">{mod.detailedExplanation}</p>
               <button onClick={handleNext} className="w-full py-8 bg-white text-black font-black rounded-full uppercase text-xl">SUIVANT (+50 XP)</button>
            </div>
          ) : <button onClick={() => setShow(true)} className="w-full py-12 bg-abf-gold text-black font-black rounded-[3rem] uppercase text-2xl shadow-2xl">RÉPONSE</button>}
        </div>
      </div>
    </div>
  );
};

const ForumView = ({ user, onBack, addNotify }: any) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', sector: 'BANQUE' as JobSector });
  const [loading, setLoading] = useState(false);
  const handleCreate = async (e: any) => { e.preventDefault(); setLoading(true); try { const feedback = await analyzeForumPost(newPost.title, newPost.content, newPost.sector); const post: ForumPost = { id: Math.random().toString(36).substr(2, 9), userId: user.id, userName: user.name, title: newPost.title, content: newPost.content, sector: newPost.sector, createdAt: Date.now(), aiFeedback: feedback, replies: [] }; setPosts([post, ...posts]); setShowCreate(false); setNewPost({ title: '', content: '', sector: 'BANQUE' }); addNotify("Forum", "Analysé et publié.", "success"); } catch (e) { addNotify("Erreur", "IA échec.", "error"); } finally { setLoading(false); } };
  return (
    <div className="animate-fade-in space-y-12 pb-32">
      <BackButton onClick={onBack} label="Dashboard" />
      <div className="flex justify-between items-end gap-10">
        <SectionTitle title="Forum" highlight="Professionnel" />
        <button onClick={() => setShowCreate(true)} className="bg-abf-primary px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-sky-500/20 flex items-center gap-3">NOUVELLE QUESTION <Plus size={18}/></button>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-[1500] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 w-full max-w-2xl shadow-2xl space-y-8">
            <h2 className="text-3xl font-black uppercase italic text-white">Poser une Question</h2>
            <div className="space-y-4">
              <select value={newPost.sector} onChange={e => setNewPost({...newPost, sector: e.target.value as JobSector})} className="w-full bg-slate-800 p-5 rounded-2xl border border-white/5 text-white outline-none font-bold">
                <option value="BANQUE">BANQUE</option><option value="ASSURANCE">ASSURANCE</option><option value="FINANCE">FINANCE</option>
              </select>
              <input required value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} placeholder="Titre technique..." className="w-full bg-slate-800 p-5 rounded-2xl text-white outline-none focus:ring-2 ring-abf-primary"/>
              <textarea required rows={5} value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} placeholder="Détaillez..." className="w-full bg-slate-800 p-5 rounded-2xl text-white outline-none focus:ring-2 ring-abf-primary"/>
            </div>
            <button type="submit" disabled={loading} className="w-full py-6 bg-abf-primary rounded-2xl font-black uppercase text-lg shadow-xl flex items-center justify-center gap-4">{loading ? <Loader2 className="animate-spin"/> : 'PUBLIER'}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="w-full text-slate-500 uppercase font-black text-xs">Annuler</button>
          </form>
        </div>
      )}
      <div className="space-y-8">
        {posts.map(post => (
          <div key={post.id} className="bg-slate-900/50 border border-white/5 rounded-[3.5rem] p-8 md:p-14 space-y-10 shadow-xl group">
            <h3 className="text-2xl md:text-4xl font-black uppercase italic text-white group-hover:text-abf-primary transition-colors">{post.title}</h3>
            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5"><p className="text-slate-300 font-medium italic text-sm md:text-xl">"{post.content}"</p></div>
            {post.aiFeedback && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-abf-gold/30 p-8 rounded-[3rem] space-y-10 shadow-2xl relative">
                  <div className="absolute top-0 right-0 p-4 text-abf-gold opacity-10"><Bot size={100}/></div>
                  <h4 className={`text-2xl font-black uppercase ${post.aiFeedback.isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>VALIDATION : {post.aiFeedback.status}</h4>
                  <p className="text-slate-200 text-sm md:text-lg font-medium italic leading-relaxed">"{post.aiFeedback.explanation}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const CVBuilderView = ({ user, onBack, addNotify }: any) => {
  const [loading, setLoading] = useState(false);
  const handleDownload = () => { setLoading(true); try { generateCertificatePDF(user.name, user.currentSector || 'EXPERTISE ABF', generateSerial()); addNotify("Génération", "Certificat prêt.", "success"); } catch (e) { addNotify("Erreur", "Échec.", "error"); } finally { setLoading(false); } };
  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-32">
      <BackButton onClick={onBack} label="Outils"/>
      <SectionTitle title="Certificat" highlight="Carrière" />
      <div className="bg-white p-12 md:p-20 text-black rounded-[3rem] shadow-2xl font-serif mb-12 relative overflow-hidden border-t-[16px] border-abf-gold">
         <h2 className="text-5xl font-black mb-10 tracking-tighter uppercase">{user.name}</h2>
         <p className="text-slate-500 font-bold text-xl uppercase italic mb-10">EXPERT ABF CERTIFIÉ</p>
         <div className="grid grid-cols-2 gap-10">
           <div><h4 className="font-black text-xs uppercase border-b-2 border-black pb-2 mb-4">Score Technique</h4><p className="text-5xl font-black italic text-abf-primary">{user.careerStats.technicalScore}%</p></div>
           <div><h4 className="font-black text-xs uppercase border-b-2 border-black pb-2 mb-4">Points d'expérience</h4><p className="text-5xl font-black italic text-abf-primary">{user.xp}</p></div>
         </div>
      </div>
      <button onClick={handleDownload} disabled={loading} className="w-full py-8 bg-abf-primary text-white font-black rounded-full uppercase shadow-2xl flex items-center justify-center gap-8">
         {loading ? <Loader2 className="animate-spin" size={32}/> : <><Download size={32}/> EXPORTER PDF CERTIFIÉ</>}
      </button>
    </div>
  );
};

const SalarySimView = ({ onBack }: any) => {
    const [base, setBase] = useState(250000);
    return (
        <div className="max-w-4xl mx-auto p-10 bg-slate-900 rounded-[3rem] border border-white/10 shadow-2xl animate-fade-in-up">
            <BackButton onClick={onBack} label="Outils" />
            <SectionTitle title="Salaire" highlight="Net Mali" />
            <div className="space-y-16">
                <input type="number" step="10000" value={base} onChange={e => setBase(Number(e.target.value))} className="w-full p-10 bg-slate-800 rounded-[3rem] font-black text-5xl md:text-9xl outline-none text-emerald-400 focus:ring-8 ring-emerald-500/10 text-center shadow-inner"/>
                <div className="bg-white/5 p-12 rounded-[3rem] flex justify-between items-center">
                    <div className="text-left"><p className="text-xs font-black uppercase text-slate-500 mb-2">Estimation Net / Mois</p><p className="text-6xl md:text-[10rem] font-black italic text-abf-primary leading-none">{formatFCFA(Math.round(base * 0.78 + 75000)).split(',')[0]}</p></div>
                    <TrendingUp size={80} className="text-emerald-500 opacity-20"/>
                </div>
            </div>
        </div>
    );
};

export default App;