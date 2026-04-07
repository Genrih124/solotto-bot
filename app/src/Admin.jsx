import { useState, useEffect } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const CONNECTION = new Connection("https://mainnet.helius-rpc.com/?api-key=c7152c4f-8ee0-491a-bebf-78e7374c0964", "confirmed");
const PROTOCOL_WALLET = "DEbmxpSdKuYHoaYT1Th8jNBoKjXi1ARnhW6zEmRZzMp";
const PROGRAM_ID = "8djAC69852xokSdr3joE18eMKVNHT5jPggpHidkYLngA";
const PASSWORD = "solotto2026";

function short(a) { return a.slice(0,4) + "..." + a.slice(-4); }

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, today: 0, count: 0 });

  async function load() {
    setLoading(true);
    try {
      // Balance
      const bal = await CONNECTION.getBalance(new PublicKey(PROTOCOL_WALLET));
      setBalance(bal / LAMPORTS_PER_SOL);

      // Transactions
      const sigs = await CONNECTION.getSignaturesForAddress(
        new PublicKey(PROTOCOL_WALLET), { limit: 50 }
      );

      const txList = [];
      let totalSOL = 0;
      let todaySOL = 0;
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);

      for (const sig of sigs.slice(0, 20)) {
        const tx = await CONNECTION.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        if (!tx) continue;

        const time = new Date(tx.blockTime * 1000);
        const accounts = tx.transaction.message.staticAccountKeys || [];
        const sender = accounts[0]?.toString() || "unknown";

        let amount = 0;
        if (tx.meta?.postBalances && tx.meta?.preBalances) {
          const idx = accounts.findIndex(a => a.toString() === PROTOCOL_WALLET);
          if (idx >= 0) {
            amount = (tx.meta.postBalances[idx] - tx.meta.preBalances[idx]) / LAMPORTS_PER_SOL;
          }
        }

        if (amount > 0) {
          totalSOL += amount;
          if (time >= todayStart) todaySOL += amount;
          txList.push({
            sig: sig.signature,
            time,
            sender,
            amount,
            status: tx.meta?.err ? "failed" : "success",
          });
        }
      }

      setTxs(txList);
      setStats({ total: totalSOL, today: todaySOL, count: txList.length });
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (auth) load();
  }, [auth]);

  if (!auth) {
    return (
      <div style={{ minHeight:"100vh", background:"#080B14", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Courier New',monospace" }}>
        <div style={{ background:"#0D1117", border:"1px solid #1a2030", borderRadius:16, padding:40, width:320, textAlign:"center" }}>
          <div style={{ fontSize:24, color:"#14F195", marginBottom:8 }}>◈ SOLOTTO</div>
          <div style={{ fontSize:12, color:"#555", letterSpacing:2, marginBottom:32 }}>ADMIN PANEL</div>
          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && pass === PASSWORD && setAuth(true)}
            style={{ width:"100%", background:"#131820", border:"1px solid #1a2030", color:"#fff", padding:"12px 16px", borderRadius:8, fontSize:14, marginBottom:12, outline:"none", fontFamily:"monospace" }}
          />
          <button
            onClick={() => pass === PASSWORD && setAuth(true)}
            style={{ width:"100%", background:"linear-gradient(135deg,#14F195,#00CC77)", border:"none", color:"#000", padding:"12px", borderRadius:8, fontSize:14, fontWeight:"bold", cursor:"pointer" }}
          >
            LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#080B14", fontFamily:"'Courier New',monospace", color:"#E8E8E8", padding:24 }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:"bold", color:"#14F195", letterSpacing:3 }}>◈ SOLOTTO ADMIN</div>
            <div style={{ fontSize:11, color:"#555", letterSpacing:2, marginTop:4 }}>REAL-TIME BLOCKCHAIN DATA</div>
          </div>
          <button onClick={load} disabled={loading} style={{ background:"linear-gradient(135deg,#9945FF,#7733CC)", border:"none", color:"#fff", padding:"10px 20px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:"bold" }}>
            {loading ? "LOADING..." : "↻ REFRESH"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {[
            { label:"WALLET BALANCE", value: balance.toFixed(4) + " SOL", color:"#14F195" },
            { label:"TODAY'S FEES", value: stats.today.toFixed(4) + " SOL", color:"#FFD700" },
            { label:"TOTAL FEES (50 TX)", value: stats.total.toFixed(4) + " SOL", color:"#00B3FF" },
            { label:"TRANSACTIONS", value: stats.count, color:"#9945FF" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:"#0D1117", border:"1px solid #1a2030", borderRadius:12, padding:20 }}>
              <div style={{ fontSize:9, color:"#555", letterSpacing:2, marginBottom:8 }}>{label}</div>
              <div style={{ fontSize:22, fontWeight:"bold", color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Wallet info */}
        <div style={{ background:"#0D1117", border:"1px solid #1a2030", borderRadius:12, padding:20, marginBottom:24 }}>
          <div style={{ fontSize:11, color:"#555", letterSpacing:2, marginBottom:12 }}>PROTOCOL WALLET</div>
          <div style={{ display:"flex", gap:16, alignItems:"center" }}>
            <div style={{ fontSize:13, color:"#14F195", fontFamily:"monospace" }}>{PROTOCOL_WALLET}</div>
            <a href={`https://solscan.io/account/${PROTOCOL_WALLET}`} target="_blank" rel="noreferrer"
              style={{ fontSize:11, color:"#9945FF", textDecoration:"none" }}>
              VIEW ON SOLSCAN →
            </a>
          </div>
        </div>

        {/* Transactions */}
        <div style={{ background:"#0D1117", border:"1px solid #1a2030", borderRadius:12, padding:20 }}>
          <div style={{ fontSize:11, color:"#555", letterSpacing:2, marginBottom:16 }}>RECENT TRANSACTIONS (FEES RECEIVED)</div>
          {loading ? (
            <div style={{ textAlign:"center", color:"#555", padding:"40px 0" }}>Loading blockchain data...</div>
          ) : txs.length === 0 ? (
            <div style={{ textAlign:"center", color:"#555", padding:"40px 0" }}>No transactions found</div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1a2030" }}>
                  {["TIME", "FROM", "AMOUNT", "TX", "STATUS"].map(h => (
                    <th key={h} style={{ fontSize:9, color:"#555", letterSpacing:2, padding:"8px 12px", textAlign:"left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map((tx, i) => (
                  <tr key={i} style={{ borderBottom:"1px solid #0a0f18" }}>
                    <td style={{ padding:"10px 12px", fontSize:11, color:"#888" }}>
                      {tx.time.toLocaleDateString()} {tx.time.toLocaleTimeString()}
                    </td>
                    <td style={{ padding:"10px 12px", fontSize:11, color:"#E8E8E8", fontFamily:"monospace" }}>
                      {short(tx.sender)}
                    </td>
                    <td style={{ padding:"10px 12px", fontSize:13, fontWeight:"bold", color:"#14F195" }}>
                      +{tx.amount.toFixed(4)} SOL
                    </td>
                    <td style={{ padding:"10px 12px" }}>
                      <a href={`https://solscan.io/tx/${tx.sig}`} target="_blank" rel="noreferrer"
                        style={{ fontSize:11, color:"#9945FF", textDecoration:"none", fontFamily:"monospace" }}>
                        {short(tx.sig)} →
                      </a>
                    </td>
                    <td style={{ padding:"10px 12px" }}>
                      <span style={{ fontSize:10, color: tx.status === "success" ? "#14F195" : "#FF4444", background: tx.status === "success" ? "#14F19511" : "#FF444411", padding:"3px 8px", borderRadius:4 }}>
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop:24, textAlign:"center", fontSize:10, color:"#333" }}>
          SOLOTTO ADMIN · DATA FROM SOLANA MAINNET · {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
