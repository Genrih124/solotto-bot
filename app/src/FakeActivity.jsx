import { useState, useEffect, useRef } from "react";
import { subscribeStats } from "./globalState.js";

function rndAddr() {
  const c = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from({ length: 44 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}
function short(a) { return a.slice(0,4) + "..." + a.slice(-4); }
function rnd(min, max) { return Math.random() * (max - min) + min; }
function rndInt(min, max) { return Math.floor(rnd(min, max)); }

const ROOM_CONFIG = [
  { id: 1, label: "0.05 SOL", price: 0.05, color: "#14F195", border: "#14F19533", bg: "#14F19511", minP: 120, maxP: 180 },
  { id: 2, label: "0.10 SOL", price: 0.10, color: "#00B3FF", border: "#00B3FF33", bg: "#00B3FF11", minP: 80,  maxP: 140 },
  { id: 3, label: "0.20 SOL", price: 0.20, color: "#FFD700", border: "#FFD70033", bg: "#FFD70011", minP: 60,  maxP: 100 },
  { id: 4, label: "0.30 SOL", price: 0.30, color: "#FF6B35", border: "#FF6B3533", bg: "#FF6B3511", minP: 30,  maxP: 60  },
  { id: 5, label: "0.50 SOL", price: 0.50, color: "#9945FF", border: "#9945FF33", bg: "#9945FF11", minP: 20,  maxP: 45  },
];

function useRoomState(cfg, globalTime) {
  const [players, setPlayers] = useState(() =>
    Array.from({ length: rndInt(cfg.minP * 0.3, cfg.minP * 0.7) }, rndAddr)
  );
  const [history, setHistory] = useState([]);
  const prevTime = useRef(globalTime);

  useEffect(() => {
    // When round ends (time resets to ~60) — draw winner and start new round
    if (prevTime.current <= 3 && globalTime > 50) {
      const totalPlayers = rndInt(cfg.minP, cfg.maxP);
      const winner = players[rndInt(0, players.length)] || rndAddr();
      const pool = totalPlayers * cfg.price * 0.9;
      const prize = (pool * 0.88).toFixed(3);
      setHistory(h => [{ winner, prize, players: totalPlayers, time: Date.now() }, ...h.slice(0, 9)]);
      // Start new round with fresh players
      const newCount = rndInt(cfg.minP * 0.2, cfg.minP * 0.5);
      setPlayers(Array.from({ length: newCount }, rndAddr));
    }
    prevTime.current = globalTime;
  }, [globalTime]);

  // Add players over time during round
  useEffect(() => {
    const t = setInterval(() => {
      setPlayers(prev => {
        const target = rndInt(cfg.minP, cfg.maxP);
        if (prev.length >= target) return prev;
        const add = rndInt(1, 4);
        return [...prev, ...Array.from({ length: add }, rndAddr)];
      });
    }, rnd(800, 2500));
    return () => clearInterval(t);
  }, []);

  const pool = players.length * cfg.price * 0.9;
  const prize = pool * 0.88;

  return { players, pool, prize, history };
}

function RoomCard({ cfg, globalTime, onWinner }) {
  const { players, pool, prize, history } = useRoomState(cfg, globalTime);
  const timerColor = globalTime > 20 ? cfg.color : globalTime > 10 ? "#FFD700" : "#FF4444";
  const pct = (globalTime / 60) * 100;

  // Notify parent of latest winner
  useEffect(() => {
    if (history.length > 0) onWinner({ ...history[0], roomLabel: cfg.label });
  }, [history.length]);

  return (
    <div style={{
      background: "#0D1117", border: "1px solid " + cfg.border,
      borderRadius: 16, padding: 20, display: "flex",
      flexDirection: "column", gap: 12,
      boxShadow: "0 0 30px " + cfg.bg,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 32px" }}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>LIVE ROUND</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#555" }}>PRIZE POOL</div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#fff" }}>{prize.toFixed(2)} SOL</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 40, fontWeight: "bold", color: timerColor, textAlign: "center", letterSpacing: -1, animation: globalTime <= 5 ? "blink 0.5s infinite" : "none" }}>
          {String(Math.floor(globalTime/60)).padStart(2,"0")}:{String(globalTime%60).padStart(2,"0")}
        </div>
        <div style={{ background: "#1a2030", borderRadius: 4, height: 4, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: pct+"%", height: "100%", background: "linear-gradient(90deg,"+timerColor+"88,"+timerColor+")", transition: "width 1s linear" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "PLAYERS", value: players.length },
          { label: "POOL", value: pool.toFixed(1) + " SOL" },
          { label: "WIN CHANCE", value: (100/players.length).toFixed(1) + "%" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#131820", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#E8E8E8", marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Live players list */}
      <div style={{ maxHeight: 80, overflowY: "auto" }}>
        <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 4 }}>CURRENT PLAYERS</div>
        {players.slice(-8).reverse().map((addr, i) => (
          <div key={i} style={{ fontSize: 10, color: i === 0 ? cfg.color : "#555", fontFamily: "monospace", padding: "1px 0" }}>
            {i === 0 ? "→ " : "  "}{short(addr)}
          </div>
        ))}
      </div>

      <div style={{
        background: "linear-gradient(135deg,"+cfg.color+"22,"+cfg.color+"11)",
        border: "1px solid "+cfg.border, borderRadius: 10,
        padding: "12px", textAlign: "center", cursor: "pointer",
      }}>
        <div style={{ fontSize: 13, fontWeight: "bold", color: cfg.color, letterSpacing: 1 }}>
          CONNECT WALLET TO JOIN →
        </div>
      </div>
    </div>
  );
}

export function FakeLanding({ onPlay }) {
  const [globalTime, setGlobalTime] = useState(60);
  const [jackpot, setJackpot] = useState(520);
  const [volume2, setVolume2] = useState(28000);

  useEffect(() => {
    return subscribeStats(({ jackpot: j, volume: v }) => {
      setJackpot(prev => Math.max(prev, j));
      setVolume2(v);
    });
  }, []);

  const [recentWinners, setRecentWinners] = useState([
    { winner: rndAddr(), prize: "53.24", roomLabel: "0.50 SOL", players: 122 },
    { winner: rndAddr(), prize: "47.68", roomLabel: "0.30 SOL", players: 181 },
    { winner: rndAddr(), prize: "58.91", roomLabel: "0.20 SOL", players: 338 },
    { winner: rndAddr(), prize: "61.43", roomLabel: "0.10 SOL", players: 702 },
    { winner: rndAddr(), prize: "72.18", roomLabel: "0.05 SOL", players: 1087 },
    { winner: rndAddr(), prize: "49.37", roomLabel: "0.50 SOL", players: 113 },
  ]);

  // Global synced timer
  useEffect(() => {
    const tick = () => {
      const secs = new Date().getSeconds();
      setGlobalTime(60 - secs);
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, []);

  // Grow jackpot
  useEffect(() => {
    const t = setInterval(() => {
      setJackpot(prev => parseFloat((prev + rnd(0.1, 0.8)).toFixed(2)));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  function handleWinner(w) {
    setRecentWinners(prev => [w, ...prev.slice(0, 11)]);
    setJackpot(prev => parseFloat((prev + parseFloat(w.prize) * 0.02).toFixed(2)));
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 20px 60px", borderBottom: "1px solid #1a2030" }}>
        <div style={{ fontSize: 12, color: "#14F195", letterSpacing: 5, marginBottom: 20 }}>PROVABLY FAIR · ON-CHAIN · INSTANT</div>
        <h1 style={{ fontSize: 52, fontWeight: "bold", color: "#fff", margin: "0 0 20px", letterSpacing: -2, lineHeight: 1.1 }}>
          Win SOL every minute.<br /><span style={{ color: "#14F195" }}>No trust required.</span>
        </h1>
        <p style={{ fontSize: 16, color: "#666", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.9 }}>
          Fully on-chain lottery on Solana. 60-second rounds. Winners paid automatically by smart contract.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 48 }}>
          <button onClick={onPlay} style={{ background: "linear-gradient(135deg,#14F195,#00CC77)", border: "none", color: "#000", padding: "16px 40px", borderRadius: 12, fontSize: 16, fontWeight: "bold", cursor: "pointer", letterSpacing: 1 }}>PLAY NOW →</button>
          <button onClick={onPlay} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "16px 32px", borderRadius: 12, fontSize: 14, cursor: "pointer", letterSpacing: 1 }}>TRY FOR FREE</button>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {[{ label: "Round Duration", value: "60 sec" }, { label: "Min Ticket", value: "0.05 SOL" }, { label: "Winner Gets", value: "88%" }, { label: "Daily Jackpot", value: "2%" }].map(({ label, value }) => (
            <div key={label} style={{ background: "#0D1117", border: "1px solid #1a2030", borderRadius: 12, padding: "14px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: "bold", color: "#14F195" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Jackpot + recent winners */}
      <div style={{ padding: "40px 0 0" }}>
        <div style={{
          background: "linear-gradient(135deg,#1a1400,#2a1f00)",
          border: "1px solid #FFD70055", borderRadius: 16,
          padding: "24px 32px", marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 0 40px #FFD70022",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#FFD70088", letterSpacing: 4, marginBottom: 8 }}>🏆 DAILY JACKPOT</div>
            <div style={{ fontSize: 52, fontWeight: "bold", color: "#FFD700", letterSpacing: -1, lineHeight: 1 }}>
              {jackpot.toFixed(2)} <span style={{ fontSize: 22 }}>SOL</span>
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>2% of every ticket · drawn every 24h · anyone can win</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginBottom: 8 }}>TODAY'S VOLUME</div>
            <div style={{ fontSize: 36, fontWeight: "bold", color: "#FFD700" }}>{(jackpot * 50).toFixed(0)} SOL</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>across all 5 rooms</div>
          </div>
        </div>

        {/* Recent winners */}
        <div style={{ background: "#0D1117", border: "1px solid #1a2030", borderRadius: 16, padding: "20px 24px", marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, marginBottom: 14 }}>🏆 RECENT WINNERS</div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {recentWinners.map((w, i) => (
              <div key={i} style={{
                background: i === 0 ? "#14F19511" : "#131820",
                border: i === 0 ? "1px solid #14F19533" : "1px solid #222",
                borderRadius: 10, padding: "12px 16px", minWidth: 160, flexShrink: 0,
                transition: "all 0.5s ease",
              }}>
                <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>{w.roomLabel} · {w.players} players</div>
                <div style={{ fontSize: 16, fontWeight: "bold", color: i === 0 ? "#14F195" : "#fff", marginBottom: 4 }}>+{w.prize} SOL</div>
                <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{short(w.winner)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <button onClick={onPlay} style={{ background: "linear-gradient(135deg,#9945FF,#7733CC)", border: "none", color: "#fff", padding: "14px 36px", borderRadius: 12, fontSize: 14, fontWeight: "bold", cursor: "pointer", letterSpacing: 1 }}>
            JOIN NOW →
          </button>
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: "60px 0", borderTop: "1px solid #1a2030" }}>
        <div style={{ fontSize: 11, color: "#9945FF", letterSpacing: 4, marginBottom: 12, textAlign: "center" }}>HOW IT WORKS</div>
        <h2 style={{ fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 40, color: "#fff" }}>Simple. Fast. Transparent.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20 }}>
          {[
            { step: "01", icon: "🎯", title: "Choose a room", desc: "Pick your stake from 0.05 to 0.50 SOL." },
            { step: "02", icon: "🎟", title: "Buy a ticket", desc: "Connect Phantom. Entry recorded on-chain instantly." },
            { step: "03", icon: "⏱", title: "Wait 60 seconds", desc: "Every room runs a new round every minute." },
            { step: "04", icon: "🏆", title: "Win instantly", desc: "Smart contract picks winner. Funds sent immediately." },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} style={{ background: "#0D1117", border: "1px solid #1a2030", borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 11, color: "#333", letterSpacing: 2, marginBottom: 8 }}>{step}</div>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust */}
      <div style={{ padding: "60px 0", borderTop: "1px solid #1a2030" }}>
        <div style={{ fontSize: 11, color: "#14F195", letterSpacing: 4, marginBottom: 12, textAlign: "center" }}>WHY TRUST US</div>
        <h2 style={{ fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 40, color: "#fff" }}>We cannot cheat. The code cannot lie.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20 }}>
          {[
            { icon: "🔗", title: "Fully On-Chain", desc: "Every ticket, winner, payout on Solana. Verify on Solscan." },
            { icon: "🎲", title: "Provable Randomness", desc: "Cryptographic hash — impossible to predict or manipulate." },
            { icon: "📖", title: "Open Source", desc: "Smart contract is public. Read it, audit it, verify it." },
            { icon: "⚡", title: "Instant Payouts", desc: "Funds in your wallet the second the round ends." },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ background: "#0D1117", border: "1px solid #1a2030", borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: "60px 0 80px", borderTop: "1px solid #1a2030" }}>
        <div style={{ fontSize: 11, color: "#FFD700", letterSpacing: 4, marginBottom: 12, textAlign: "center" }}>FAQ</div>
        <h2 style={{ fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 40, color: "#fff" }}>Common questions</h2>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { q: "Do I need to claim my prize?", a: "No. The smart contract sends the prize directly to your wallet when the round ends." },
            { q: "What if I am the only player?", a: "You win 88% of your own ticket back. Rounds always resolve after 60 seconds." },
            { q: "Can I buy multiple tickets?", a: "Yes. Each ticket gives you one additional entry into the draw." },
            { q: "What wallet do I need?", a: "Phantom (phantom.com) is recommended. Solflare and Backpack also work." },
            { q: "How do I know the draw is fair?", a: "Winner selected by cryptographic hash of block data and all ticket addresses — verifiable on-chain." },
          ].map(({ q, a }) => (
            <div key={q} style={{ background: "#0D1117", border: "1px solid #1a2030", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>{q}</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Transparency */}
      <div style={{ background: "#0a0f18", borderTop: "1px solid #1a2030", padding: "40px 0" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Smart Contract", value: "8djAC69852xokSdr3joE18eMKVNHT5jPggpHidkYLngA" },
            { label: "Protocol Wallet", value: "DEbmxpSdKuYHoaYT1Th8jNBoKjXi1ARnhW6zEmRZzMp" },
            { label: "Network", value: "Solana Mainnet" },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#0D1117", border: "1px solid #1a2030", borderRadius: 10, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, minWidth: 130 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace", wordBreak: "break-all" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FakePlayHeader({ wallet }) {
  const [jackpot, setJackpot] = useState(520);
  const [volume2, setVolume2] = useState(28000);

  useEffect(() => {
    return subscribeStats(({ jackpot: j, volume: v }) => {
      setJackpot(prev => Math.max(prev, j));
      setVolume2(v);
    });
  }, []);

  const [recentWinners, setRecentWinners] = useState([
    { winner: rndAddr(), prize: "53.24", roomLabel: "0.50 SOL", players: 122 },
    { winner: rndAddr(), prize: "47.68", roomLabel: "0.30 SOL", players: 181 },
    { winner: rndAddr(), prize: "58.91", roomLabel: "0.20 SOL", players: 338 },
    { winner: rndAddr(), prize: "61.43", roomLabel: "0.10 SOL", players: 702 },
    { winner: rndAddr(), prize: "72.18", roomLabel: "0.05 SOL", players: 1087 },
    { winner: rndAddr(), prize: "49.37", roomLabel: "0.50 SOL", players: 113 },
  ]);

  useEffect(() => {
    const rooms = [
      { label: "0.05 SOL", price: 0.05, minP: 900, maxP: 1200 },
      { label: "0.10 SOL", price: 0.10, minP: 500, maxP: 700  },
      { label: "0.20 SOL", price: 0.20, minP: 280, maxP: 380  },
      { label: "0.30 SOL", price: 0.30, minP: 160, maxP: 220  },
      { label: "0.50 SOL", price: 0.50, minP: 100, maxP: 140  },
    ];
    const t = setInterval(() => {
      const room = rooms[rndInt(0, rooms.length)];
      const players = rndInt(room.minP, room.maxP);
      const prize = (players * room.price * 0.9 * 0.88).toFixed(2);
      setJackpot(prev => parseFloat((prev + players * room.price * 0.02).toFixed(2)));
      setRecentWinners(prev => [{
        winner: rndAddr(), prize, roomLabel: room.label, players,
      }, ...prev.slice(0, 11)]);
    }, 7000 + Math.random() * 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Jackpot */}
      <div style={{
        background: "linear-gradient(135deg,#1a1400,#2a1f00)",
        border: "1px solid #FFD70055", borderRadius: 16,
        padding: "20px 28px", marginBottom: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 0 30px #FFD70022",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#FFD70088", letterSpacing: 3, marginBottom: 6 }}>🏆 DAILY JACKPOT</div>
          <div style={{ fontSize: 44, fontWeight: "bold", color: "#FFD700", letterSpacing: -1, lineHeight: 1 }}>
            {jackpot.toFixed(2)} <span style={{ fontSize: 20 }}>SOL</span>
          </div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>2% of every ticket · one winner every 24 hours</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 4, letterSpacing: 2 }}>TODAY'S VOLUME</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#FFD700" }}>{volume2} SOL</div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>Protocol fee: 10% · Jackpot: 2%</div>
        </div>
      </div>

      {/* Recent winners */}
      <div style={{ background: "#0D1117", border: "1px solid #1a2030", borderRadius: 16, padding: "16px 20px" }}>
        <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, marginBottom: 12 }}>🏆 RECENT WINNERS</div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {recentWinners.map((w, i) => (
            <div key={i} style={{
              background: i === 0 ? "#14F19511" : "#131820",
              border: i === 0 ? "1px solid #14F19533" : "1px solid #222",
              borderRadius: 10, padding: "10px 14px", minWidth: 150, flexShrink: 0,
              transition: "all 0.5s ease",
            }}>
              <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>{w.roomLabel} · {w.players}p</div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: i === 0 ? "#14F195" : "#fff", marginBottom: 2 }}>+{w.prize} SOL</div>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{short(w.winner)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
