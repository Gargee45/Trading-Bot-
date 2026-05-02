import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Terminal, 
  ArrowRightLeft, 
  Wallet, 
  Activity,
  AlertCircle,
  CheckCircle2,
  Settings,
  History
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Utils & Types ---
type OrderSide = "BUY" | "SELL";
type OrderType = "MARKET" | "LIMIT";

interface LogEntry {
  timestamp: string;
  message: string;
}

// --- Components ---

const Panel = ({ children, title, icon: Icon, className }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-xl", className)}
  >
    <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-emerald-500" />}
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{title}</h3>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </motion.div>
);

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("binance_key") || "");
  const [apiSecret, setApiSecret] = useState(localStorage.getItem("binance_secret") || "");
  const [showSettings, setShowSettings] = useState(!apiKey);
  
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [side, setSide] = useState<OrderSide>("BUY");
  const [type, setType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none', message: string }>({ type: 'none', message: '' });

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const text = await res.text();
      setLogs(text.split("\n").filter(Boolean));
    } catch (e) {}
  };

  const handleSaveSettings = () => {
    localStorage.setItem("binance_key", apiKey);
    localStorage.setItem("binance_secret", apiSecret);
    setShowSettings(false);
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'none', message: '' });

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          side,
          type,
          quantity: parseFloat(quantity),
          price: type === "LIMIT" ? parseFloat(price) : undefined,
          apiKey,
          secret: apiSecret
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setStatus({ 
        type: 'success', 
        message: `Order #${data.id} placed: ${data.status}` 
      });
      fetchLogs();
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Glow Effect */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-600/10 blur-[100px] rounded-full -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full -z-10" />

      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <Activity className="text-black w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              NEON TRADE
            </span>
            <div className="ml-4 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-500 font-bold uppercase">
              Binance Testnet (USDT-M)
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Settings Modal Overlay */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheck className="text-emerald-500 w-6 h-6" />
                  <h2 className="text-xl font-bold">API Configuration</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">API KEY</label>
                    <input 
                      type="password" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-black border border-zinc-800 px-4 py-3 rounded-xl focus:border-emerald-500 outline-none transition-all"
                      placeholder="Paste your testnet API key..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">API SECRET</label>
                    <input 
                      type="password" 
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      className="w-full bg-black border border-zinc-800 px-4 py-3 rounded-xl focus:border-emerald-500 outline-none transition-all"
                      placeholder="Paste your testnet API secret..."
                    />
                  </div>
                  <button 
                    onClick={handleSaveSettings}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    Connect Account
                  </button>
                  <p className="text-[10px] text-zinc-500 text-center">
                    Your credentials are saved locally in your browser.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Column: Form */}
        <div className="lg:col-span-4 space-y-6">
          <Panel title="Terminal Console" icon={ArrowRightLeft}>
            <form onSubmit={placeOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setSide("BUY")}
                  className={cn(
                    "py-3 rounded-xl font-bold transition-all border",
                    side === "BUY" 
                      ? "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  BUY / LONG
                </button>
                <button 
                  type="button"
                  onClick={() => setSide("SELL")}
                  className={cn(
                    "py-3 rounded-xl font-bold transition-all border",
                    side === "SELL" 
                      ? "bg-rose-500 border-rose-400 text-black shadow-[0_0_15px_rgba(244,63,94,0.2)]" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  SELL / SHORT
                </button>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Instrument</label>
                <input 
                  type="text" 
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-zinc-800 px-4 py-2.5 rounded-xl focus:border-emerald-500 outline-none transition-all font-mono"
                  placeholder="BTC/USDT"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Order Type</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as OrderType)}
                    className="w-full bg-black border border-zinc-800 px-4 py-2.5 rounded-xl focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="MARKET">Market</option>
                    <option value="LIMIT">Limit</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Quantity</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-black border border-zinc-800 px-4 py-2.5 rounded-xl focus:border-emerald-500 outline-none transition-all"
                    placeholder="0.0"
                    required
                  />
                </div>
              </div>

              <AnimatePresence>
                {type === "LIMIT" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 block">Limit Price</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-black border border-zinc-800 px-4 py-2.5 rounded-xl focus:border-emerald-500 outline-none transition-all"
                      placeholder="Enter price..."
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden group",
                  side === "BUY" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-rose-500 text-black shadow-lg shadow-rose-500/20",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    PLACE {side} ORDER
                    <ArrowRightLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <AnimatePresence>
                {status.message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-xl border flex items-center gap-3",
                      status.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                    )}
                  >
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{status.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Panel>

          <Panel title="Wallet Balance" icon={Wallet}>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs text-zinc-500">Margin Balance</span>
                <span className="text-2xl font-bold text-emerald-400">--- USDT</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-1/3 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <p className="text-[10px] text-zinc-600 text-center uppercase tracking-widest">Connect API to fetch live balance</p>
            </div>
          </Panel>
        </div>

        {/* Right Column: Logs/History */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Panel title="Market Overview" icon={History} className="flex-1">
            <div className="h-64 border border-zinc-800/50 rounded-xl bg-black relative flex items-center justify-center p-4">
               {/* Mock Chart Area */}
               <div className="absolute inset-x-8 inset-y-12 flex items-end gap-1">
                  {[...Array(40)].map((_, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.random() * 80 + 20}%` }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', delay: i * 0.05 }}
                      className={cn(
                        "flex-1 rounded-sm",
                        Math.random() > 0.5 ? "bg-emerald-500/20" : "bg-rose-500/20"
                      )}
                    />
                  ))}
               </div>
               <div className="z-10 text-center">
                  <h4 className="text-2xl font-black text-white/50 italic tracking-tighter">LIVE FEED</h4>
                  <p className="text-[10px] text-zinc-600 font-mono">WS_STREAM_INGEST: CONNECTED</p>
               </div>
            </div>
          </Panel>

          <Panel title="Server System Logs" icon={Terminal} className="flex-1 min-h-[300px]">
            <div className="font-mono text-xs space-y-1 bg-black/50 p-4 rounded-xl border border-zinc-800 h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-zinc-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                    <span className={cn(
                      "break-words",
                      log.includes("SUCCESS") ? "text-emerald-400" : 
                      log.includes("FAILURE") ? "text-rose-400" : 
                      log.includes("REQUEST") ? "text-blue-400" : "text-zinc-400"
                    )}>
                      {log}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-700 italic">Waiting for activity...</div>
              )}
              <div ref={logEndRef} />
            </div>
          </Panel>
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-zinc-500 text-xs flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            End-to-End Encrypted Terminal. Sandbox Mode Active.
          </div>
          <div className="flex gap-6 text-xs text-zinc-500 font-medium">
            <a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Testnet Guide</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
