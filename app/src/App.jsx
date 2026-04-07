import { useState, useEffect, useCallback, useRef } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import idl from "./idl/solotto.json";
import { FakeLanding, FakePlayHeader } from "./FakeActivity.jsx";
import Admin from "./Admin.jsx";

const PROGRAM_ID = new PublicKey("8djAC69852xokSdr3joE18eMKVNHT5jPggpHidkYLngA");
const PROTOCOL_WALLET = new PublicKey("DEbmxpSdKuYHoaYT1Th8jNBoKjXi1ARnhW6zEmRZzMp");
const CONNECTION = new Connection("https://mainnet.helius-rpc.com/?api-key=c7152c4f-8ee0-491a-bebf-78e7374c0964", "confirmed");
const ROUND_DURATION = 60;

const ROOMS = [
  { id: 1, price: 0.05, label: "0.05 SOL", color: "#14F195", border: "#14F19533", bg: "#14F19511" },
  { id: 2, price: 0.10, label: "0.10 SOL", color: "#00B3FF", border: "#00B3FF33", bg: "#00B3FF11" },
  { id: 3, price: 0.20, label: "0.20 SOL", color: "#FFD700", border: "#FFD70033", bg: "#FFD70011" },
  { id: 4, price: 0.30, label: "0.30 SOL", color: "#FF6B35", border: "#FF6B3533", bg: "#FF6B3511" },
  { id: 5, price: 0.50, label: "0.50 SOL", color: "#9945FF", border: "#9945FF33", bg: "#9945FF11" },
];

const FAKE_CFG = {
  1: { min: 900, max: 1200, speed: 150 },
  2: { min: 500, max: 700,  speed: 250 },
  3: { min: 280, max: 380,  speed: 400 },
  4: { min: 160, max: 220,  speed: 600 },
  5: { min: 100, max: 140,  speed: 900 },
};

function rndAddr() {
  const c = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from({ length: 44 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}
function short(a) { return a.slice(0,4) + "..." + a.slice(-4); }
function getProgram(wallet) {
  return new Program(idl, new AnchorProvider(CONNECTION, wallet, { commitment: "confirmed" }));
}
function getRoomPDA(roomId) {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("room"), Buffer.from([roomId])], PROGRAM_ID);
  return pda;
}

function WinnerBanner({ winner, onClose }) {
  if (!winner) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"#000000CC", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{
        background: winner.isMe ? "linear-gradient(135deg,#0a2a1a,#0d3d22)" : "linear-gradient(135deg,#1a1030,#2a1850)",
        border: winner.isMe ? "2px solid #14F195" : "2px solid #9945FF",
        borderRadius:24, padding:"48px 64px", textAlign:"center",
        boxShadow: winner.isMe ? "0 0 80px #14F19544" : "0 0 80px #9945FF44",
        animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ fontSize:64, marginBottom:16 }}>{winner.isMe ? "🎉" : "🏆"}</div>
        <div style={{ fontSize:14, letterSpacing:4, color: winner.isMe ? "#14F195" : "#9945FF", marginBottom:12 }}>
          {winner.isMe ? "YOU WON!" : "ROUND WINNER"}
        </div>
        <div style={{ fontSize:52, fontWeight:"bold", color: winner.isMe ? "#14F195" : "#fff", letterSpacing:-1, marginBottom:8 }}>
          +{winner.prize} SOL
        </div>
        <div style={{ fontSize:13, color:"#666", fontFamily:"monospace", marginBottom:4 }}>{short(winner.winner)}</div>
        <div style={{ fontSize:11, color:"#444", marginBottom:24 }}>
          Room {winner.roomLabel} · Round #{winner.round} · {winner.participants} players
        </div>
        <div style={{ fontSize:11, color:"#333" }}>click anywhere to close</div>
      </div>
    </div>
  );
}

function RoomCard({ room, wallet, timeLeft }) {
  const cfg = FAKE_CFG[room.id];

  // Fake players state
  const [fakePlayers, setFakePlayers] = useState(() =>
    Array.from({ length: Math.floor(Math.random() * cfg.min * 0.4) }, rndAddr)
  );
  const fakeTarget = useRef(Math.floor(Math.random() * (cfg.max - cfg.min) + cfg.min));
  const prevTimeLeft = useRef(timeLeft);

  // Reset fake players each round
  useEffect(() => {
    if (prevTimeLeft.current <= 3 && timeLeft > 50) {
      fakeTarget.current = Math.floor(Math.random() * (cfg.max - cfg.min) + cfg.min);
      const startCount = Math.floor(Math.random() * cfg.min * 0.2);
      setFakePlayers(Array.from({ length: startCount }, rndAddr));
    }
    prevTimeLeft.current = timeLeft;
  }, [timeLeft]);

  // Add fake players over time
  useEffect(() => {
    const t = setInterval(() => {
      setFakePlayers(prev => {
        if (prev.length >= fakeTarget.current) return prev;
        const add = Math.floor(Math.random() * 3) + 1;
        return [...prev, ...Array.from({ length: add }, rndAddr)];
      });
    }, cfg.speed + Math.random() * 400);
    return () => clearInterval(t);
  }, []);

  // Chain data
  const [chainData, setChainData] = useState(null);
  const [localTickets, setLocalTickets] = useState([]);
  const [buying, setBuying] = useState("idle");
  const [error, setError] = useState(null);
  const lastRound = useRef(0);

  const fetchRoom = useCallback(async () => {
    try {
      const dummy = { publicKey: PublicKey.default, signTransaction: async t=>t, signAllTransactions: async t=>t };
      const data = await getProgram(wallet||dummy).account.roomState.fetch(getRoomPDA(room.id));
      if (lastRound.current > 0 && data.round.toNumber() > lastRound.current) {
        setLocalTickets([]);
      }
      lastRound.current = data.round.toNumber();
      setChainData(data);
    } catch(e) {}
  }, [wallet, room.id]);

  useEffect(() => {
    fetchRoom();
    const t = setInterval(fetchRoom, 8000);
    return () => clearInterval(t);
  }, [fetchRoom]);

  async function buyTicket() {
    if (!wallet || buying !== "idle") return;
    setError(null); setBuying("signing");
    try {
      const program = getProgram(wallet);
      const pda = getRoomPDA(room.id);
      if (!chainData) {
        await program.methods.initialize(room.id, new BN(room.price * LAMPORTS_PER_SOL))
          .accounts({ room: pda, authority: wallet.publicKey, systemProgram: PublicKey.default }).rpc();
      }
      setBuying("confirming");
      await program.methods.buyTicket()
        .accounts({ room: pda, player: wallet.publicKey, vault: pda, protocolWallet: PROTOCOL_WALLET, systemProgram: PublicKey.default }).rpc();
      setLocalTickets(prev => [...prev, wallet.publicKey.toString()]);
      setBuying("success");
      await fetchRoom();
      setTimeout(() => setBuying("idle"), 1500);
    } catch(e) {
      setError(e.message?.slice(0, 80));
      setBuying("idle");
    }
  }

  // Compute display values
  const chainTickets = chainData?.tickets || [];
  const chainAddrs = chainTickets.map(t => t.toString());
  const pendingLocal = localTickets.filter(lt => !chainAddrs.includes(lt));
  const realTickets = [...chainAddrs, ...pendingLocal];

  // Always show fake players + real players merged
  const displayPlayers = [...fakePlayers, ...realTickets];
  const realPool = chainData ? chainData.totalPool.toNumber() / LAMPORTS_PER_SOL : 0;
  const fakePool = fakePlayers.length * room.price * 0.9;
  const pool = fakePool + Math.max(realPool, localTickets.length * room.price * 0.9);
  const prize = pool * 0.88;
  const myCount = wallet ? realTickets.filter(t => t === wallet.publicKey?.toString()).length : 0;
  const myChance = displayPlayers.length > 0 && myCount > 0 ? ((myCount / displayPlayers.length) * 100).toFixed(1) : "0.0";
  const round = chainData?.round?.toNumber() || 1;
  const timerColor = timeLeft > 20 ? room.color : timeLeft > 10 ? "#FFD700" : "#FF4444";
  const pct = (timeLeft / ROUND_DURATION) * 100;

  return (
    <div style={{ background:"#0D1117", border:"1px solid "+room.border, borderRadius:16, padding:20, display:"flex", flexDirection:"column", gap:14, boxShadow:"0 0 30px "+room.bg }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:"bold", color:room.color }}>{room.label}</div>
          <div style={{ fontSize:10, color:"#555", letterSpacing:2 }}>ROUND #{round}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10, color:"#555" }}>PRIZE POOL</div>
          <div style={{ fontSize:18, fontWeight:"bold", color:"#fff" }}>{prize.toFixed(2)} SOL</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize:40, fontWeight:"bold", color:timerColor, textAlign:"center", letterSpacing:-1, animation:timeLeft<=5?"blink 0.5s infinite":"none" }}>
          {String(Math.floor(timeLeft/60)).padStart(2,"0")}:{String(timeLeft%60).padStart(2,"0")}
        </div>
        <div style={{ background:"#1a2030", borderRadius:4, height:4, marginTop:8, overflow:"hidden" }}>
          <div style={{ width:pct+"%", height:"100%", background:"linear-gradient(90deg,"+timerColor+"88,"+timerColor+")", transition:"width 0.5s linear" }} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {[
          { label:"PLAYERS",    value: displayPlayers.length },
          { label:"MY TICKETS", value: myCount },
          { label:"MY CHANCE",  value: myChance+"%" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background:"#131820", borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
            <div style={{ fontSize:9, color:"#555", letterSpacing:1 }}>{label}</div>
            <div style={{ fontSize:15, fontWeight:"bold", color:"#E8E8E8", marginTop:2 }}>{value}</div>
          </div>
        ))}
      </div>

      {error && <div style={{ fontSize:10, color:"#FF6644", textAlign:"center" }}>{error}</div>}

      <button onClick={buyTicket} disabled={buying!=="idle"||timeLeft<=3} style={{
        background: !wallet?"#1a2030":buying==="success"?"linear-gradient(135deg,#14F195,#00CC77)":timeLeft<=3?"#1a2030":"linear-gradient(135deg,"+room.color+"DD,"+room.color+"99)",
        border:!wallet?"1px solid "+room.border:"none",
        color:!wallet?room.color:timeLeft<=3?"#555":"#000",
        padding:"13px", borderRadius:10,
        cursor:(!wallet||buying!=="idle"||timeLeft<=3)?"not-allowed":"pointer",
        fontSize:13, fontWeight:"bold", letterSpacing:1, transition:"all 0.2s",
      }}>
        {!wallet?"CONNECT WALLET TO PLAY":timeLeft<=3?"⏳ DRAWING...":buying==="signing"?"⏳ Signing...":buying==="confirming"?"📡 Sending...":buying==="success"?"✓ Ticket Bought!":"BUY TICKET · "+room.price+" SOL"}
      </button>

      <div style={{ maxHeight:100, overflowY:"auto" }}>
        <div style={{ fontSize:9, color:"#333", letterSpacing:2, marginBottom:4 }}>CURRENT PLAYERS</div>
        {displayPlayers.slice(-7).reverse().map((t, i) => (
          <div key={i} style={{ fontSize:10, padding:"1px 0", fontFamily:"monospace",
            color: wallet&&t===wallet.publicKey?.toString()?"#14F195":i===0?room.color:"#444"
          }}>
            {wallet&&t===wallet.publicKey?.toString()?"★ YOU":(i===0?"→ ":"  ")+short(t)}
          </div>
        ))}
      </div>
    </div>
  );
}

function GamePage({ wallet, winners }) {
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);

  useEffect(() => {
    const tick = () => setTimeLeft(ROUND_DURATION - new Date().getSeconds());
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ paddingTop:32 }}>
      <FakePlayHeader wallet={wallet} winners={winners} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
        {ROOMS.map(room => <RoomCard key={room.id} room={room} wallet={wallet} timeLeft={timeLeft} />)}
      </div>
    </div>
  );
}

export default function App() {
  const isAdmin = window.location.pathname === "/admin";
  const [page, setPage] = useState("landing");
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [winner, setWinner] = useState(null);
  const [winners, setWinners] = useState([]);
  const prevCount = useRef(0);

  useEffect(() => {
    if (!wallet) return;
    const go = async () => { const b=await CONNECTION.getBalance(wallet.publicKey); setBalance(b/LAMPORTS_PER_SOL); };
    go(); const t=setInterval(go,5000); return ()=>clearInterval(t);
  }, [wallet]);

  useEffect(() => {
    const go = async () => {
      try {
        const res = await fetch("/winners.json?t="+Date.now());
        const data = await res.json();
        const enriched = data.slice(0,20).map(w=>({...w, isMe:wallet&&w.winner===wallet.publicKey?.toString()}));
        if (data.length>prevCount.current && prevCount.current>0) {
          const newest = enriched[0];
          const age = Date.now() - newest.time;
          if (age < 70000) { setWinner(newest); setTimeout(()=>setWinner(null),8000); }
        }
        prevCount.current = data.length;
        setWinners(enriched);
      } catch(e) {}
    };
    go(); const t=setInterval(go,5000); return ()=>clearInterval(t);
  }, [wallet]);

  async function connectWallet() {
    try {
      const phantom = window.solana;
      if (!phantom) { alert("Install Phantom from phantom.com"); return; }
      await phantom.connect();
      setWallet(phantom);
    } catch(e) { console.error(e); }
  }

  function disconnectWallet() {
    if (window.solana) window.solana.disconnect();
    setWallet(null);
  }

  return (
    <div style={{ minHeight:"100vh", width:"100%", background:"#080B14", fontFamily:"'Courier New',monospace", color:"#E8E8E8", margin:0, padding:0 }}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes pulse{0%,100%{box-shadow:0 0 20px #FFD70033}50%{box-shadow:0 0 60px #FFD70077}}
        @keyframes scanline{0%{top:-2%}100%{top:102%}}
        @keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#9945FF44;border-radius:2px}
        button:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px)}
        button{transition:all 0.15s ease}
      `}</style>

      <WinnerBanner winner={winner} onClose={()=>setWinner(null)} />

      <div style={{ position:"fixed", inset:0, pointerEvents:"none", backgroundImage:"linear-gradient(#9945FF06 1px,transparent 1px),linear-gradient(90deg,#9945FF06 1px,transparent 1px)", backgroundSize:"40px 40px" }} />
      <div style={{ position:"fixed", left:0, right:0, height:"2px", background:"linear-gradient(90deg,transparent,#14F19518,transparent)", animation:"scanline 6s linear infinite", pointerEvents:"none", zIndex:1 }} />

      <nav style={{ position:"sticky", top:0, zIndex:100, background:"#080B14EE", borderBottom:"1px solid #1a2030", backdropFilter:"blur(10px)" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"0 16px", display:"flex", justifyContent:"space-between", alignItems:"center", height:60 }}>
          <div style={{ display:"flex", alignItems:"center", gap:32 }}>
            <div onClick={()=>setPage("landing")} style={{ fontSize:18, fontWeight:"bold", letterSpacing:3, color:"#14F195", cursor:"pointer" }}>◈ SOLOTTO</div>
            <div style={{ display:"flex", gap:24 }}>
              <span onClick={()=>setPage("landing")} style={{ fontSize:12, color:page==="landing"?"#fff":"#555", cursor:"pointer", letterSpacing:1, borderBottom:page==="landing"?"1px solid #14F195":"none", paddingBottom:2 }}>HOME</span>
              <span onClick={()=>setPage("game")} style={{ fontSize:12, color:page==="game"?"#fff":"#555", cursor:"pointer", letterSpacing:1, borderBottom:page==="game"?"1px solid #14F195":"none", paddingBottom:2 }}>PLAY</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {wallet && <div style={{ fontSize:14, color:"#14F195", fontWeight:"bold" }}>{balance.toFixed(3)} SOL</div>}
            {wallet ? (
              <button onClick={disconnectWallet} style={{ background:"transparent", border:"1px solid #333", color:"#888", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:11, letterSpacing:1 }}>
                ◉ {short(wallet.publicKey.toString())}
              </button>
            ) : (
              <button onClick={connectWallet} style={{ background:"linear-gradient(135deg,#9945FF,#7733CC)", border:"none", color:"#fff", padding:"8px 20px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:"bold", letterSpacing:1 }}>
                CONNECT WALLET
              </button>
            )}
            <button onClick={()=>setPage("game")} style={{ background:"linear-gradient(135deg,#14F195,#00CC77)", border:"none", color:"#000", padding:"8px 20px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:"bold", letterSpacing:1 }}>
              PLAY NOW
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 32px", position:"relative", zIndex:2 }}>
        {isAdmin ? <Admin /> : page==="landing" ? <FakeLanding onPlay={()=>setPage("game")} /> : <GamePage wallet={wallet} winners={winners} />}
      </div>

      <footer style={{ borderTop:"1px solid #1a2030", padding:"24px 16px", textAlign:"center", fontSize:10, color:"#222", letterSpacing:1, lineHeight:2.2 }}>
        SOLOTTO · SOLANA · PROTOCOL FEE 10% · JACKPOT 2% · CONTRACT: 8djAC69852xokSdr3joE18eMKVNHT5jPggpHidkYLngA
      </footer>
    </div>
  );
}
