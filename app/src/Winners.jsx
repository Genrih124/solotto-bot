import { useState, useEffect } from "react";

function short(a) { return a.slice(0,4) + "..." + a.slice(-4); }

export function useWinners(walletAddress) {
  const [winners, setWinners] = useState([]);
  const [lastWinner, setLastWinner] = useState(null);
  const prevCount = useState(0);

  useEffect(() => {
    let prev = 0;
    const fetch = async () => {
      try {
        const res = await window.fetch("/winners.json?t=" + Date.now());
        const data = await res.json();
        if (data.length > prev) {
          const newest = data[0];
          setLastWinner({
            ...newest,
            isMe: walletAddress && newest.winner === walletAddress,
          });
          setTimeout(() => setLastWinner(null), 8000);
        }
        prev = data.length;
        setWinners(data.slice(0, 20).map(w => ({
          ...w,
          isMe: walletAddress && w.winner === walletAddress,
        })));
      } catch(e) {}
    };
    fetch();
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, [walletAddress]);

  return { winners, lastWinner };
}

export function WinnerBanner({ winner, onClose }) {
  if (!winner) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "#000000CC", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: winner.isMe
          ? "linear-gradient(135deg,#0a2a1a,#0d3d22)"
          : "linear-gradient(135deg,#1a1030,#2a1850)",
        border: winner.isMe ? "2px solid #14F195" : "2px solid #9945FF",
        borderRadius: 24, padding: "48px 64px", textAlign: "center",
        boxShadow: winner.isMe ? "0 0 80px #14F19544" : "0 0 80px #9945FF44",
        animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{winner.isMe ? "🎉" : "🏆"}</div>
        <div style={{ fontSize: 14, letterSpacing: 4, color: winner.isMe ? "#14F195" : "#9945FF", marginBottom: 12 }}>
          {winner.isMe ? "YOU WON!" : "ROUND WINNER"}
        </div>
        <div style={{ fontSize: 52, fontWeight: "bold", color: winner.isMe ? "#14F195" : "#fff", letterSpacing: -1, marginBottom: 8 }}>
          +{winner.prize} SOL
        </div>
        <div style={{ fontSize: 13, color: "#666", fontFamily: "monospace", marginBottom: 4 }}>
          {short(winner.winner)}
        </div>
        <div style={{ fontSize: 11, color: "#444", marginBottom: 24 }}>
          Room {winner.roomLabel} · Round #{winner.round} · {winner.participants} players
        </div>
        <div style={{ fontSize: 11, color: "#333" }}>click anywhere to close</div>
      </div>
    </div>
  );
}

export function WinnersFeed({ winners }) {
  if (winners.length === 0) return null;
  return (
    <div style={{
      background: "#0D1117", border: "1px solid #FFD70033",
      borderRadius: 16, padding: 20, marginBottom: 24,
    }}>
      <div style={{ fontSize: 11, color: "#FFD70088", letterSpacing: 3, marginBottom: 12 }}>
        🏆 RECENT WINNERS
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
        {winners.map((w, i) => (
          <div key={i} style={{
            background: w.isMe ? "#14F19511" : "#131820",
            border: w.isMe ? "1px solid #14F19544" : "1px solid #222",
            borderRadius: 10, padding: "10px 16px", minWidth: 160, flexShrink: 0,
          }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>
              {w.roomLabel} · R#{w.round}
            </div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: w.isMe ? "#14F195" : "#fff", marginBottom: 2 }}>
              +{w.prize} SOL
            </div>
            <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>
              {w.isMe ? "★ YOU" : short(w.winner)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
