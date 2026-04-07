export default function Landing() {
  return (
    <div style={{ fontFamily: "'Courier New', monospace", color: "#E8E8E8" }}>

      {/* Hero */}
      <div style={{
        textAlign: "center", padding: "80px 20px 60px",
        borderBottom: "1px solid #1a2030",
      }}>
        <div style={{ fontSize: 13, color: "#14F195", letterSpacing: 4, marginBottom: 16 }}>
          PROVABLY FAIR · ON-CHAIN · INSTANT
        </div>
        <h1 style={{ fontSize: 48, fontWeight: "bold", color: "#fff", margin: "0 0 16px", letterSpacing: -1 }}>
          Win SOL every minute.<br/>
          <span style={{ color: "#14F195" }}>No trust required.</span>
        </h1>
        <p style={{ fontSize: 16, color: "#666", maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.8 }}>
          SOLOTTO is a fully on-chain lottery on Solana. Every round lasts 60 seconds.
          Winners are selected automatically by a smart contract — no humans involved.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { label: "Round Duration", value: "60 sec" },
            { label: "Min Ticket", value: "0.05 SOL" },
            { label: "Protocol Fee", value: "10%" },
            { label: "Daily Jackpot", value: "2%" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "#0D1117", border: "1px solid #1a2030",
              borderRadius: 12, padding: "14px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: "bold", color: "#14F195" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: "60px 20px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 11, color: "#9945FF", letterSpacing: 4, marginBottom: 12, textAlign: "center" }}>
          HOW IT WORKS
        </div>
        <h2 style={{ fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 48, color: "#fff" }}>
          Simple. Fast. Transparent.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
          {[
            { step: "01", icon: "🎯", title: "Choose a room", desc: "Pick your stake — 0.05, 0.10, 0.20, 0.30, or 0.50 SOL. Higher rooms = bigger prizes." },
            { step: "02", icon: "🎟", title: "Buy a ticket", desc: "Connect your Phantom wallet and buy a ticket. Your entry is recorded on-chain instantly." },
            { step: "03", icon: "⏱", title: "Wait 60 seconds", desc: "Every room runs a new round every minute. The more players, the bigger the prize pool." },
            { step: "04", icon: "🏆", title: "Winner selected", desc: "A smart contract picks the winner automatically using verifiable randomness. No one can cheat." },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} style={{
              background: "#0D1117", border: "1px solid #1a2030",
              borderRadius: 16, padding: 24,
            }}>
              <div style={{ fontSize: 11, color: "#333", letterSpacing: 2, marginBottom: 8 }}>{step}</div>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Prize breakdown */}
      <div style={{ padding: "40px 20px 60px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 11, color: "#FFD700", letterSpacing: 4, marginBottom: 12, textAlign: "center" }}>
          PRIZE BREAKDOWN
        </div>
        <h2 style={{ fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 40, color: "#fff" }}>
          Where does your ticket go?
        </h2>
        <div style={{
          background: "#0D1117", border: "1px solid #FFD70033",
          borderRadius: 16, padding: 32,
        }}>
          {[
            { label: "🏆 Round Winner", pct: "88%", color: "#14F195", desc: "Goes directly to the winner's wallet" },
            { label: "🎰 Daily Jackpot", pct: "2%", color: "#FFD700", desc: "Accumulates all day, one big winner at midnight" },
            { label: "⚙️ Protocol Fee", pct: "10%", color: "#9945FF", desc: "Funds development and server costs" },
          ].map(({ label, pct, color, desc }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 0", borderBottom: "1px solid #1a2030",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11, color: "#555" }}>{desc}</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: "bold", color, letterSpacing: -1 }}>{pct}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust section */}
      <div style={{
        background: "#0a0f18", borderTop: "1px solid #1a2030",
        borderBottom: "1px solid #1a2030", padding: "60px 20px",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ fontSize: 11, color: "#14F195", letterSpacing: 4, marginBottom: 12, textAlign: "center" }}>
            WHY TRUST US
          </div>
          <h2 style={{ fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 40, color: "#fff" }}>
            We can't cheat. The code can't lie.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {[
              { icon: "🔗", title: "Fully On-Chain", desc: "Every ticket, every winner, every payout lives on the Solana blockchain. Verify any transaction yourself." },
              { icon: "🎲", title: "Verifiable Randomness", desc: "Winners are picked using cryptographic randomness (VRF) — impossible to predict or manipulate." },
              { icon: "📖", title: "Open Source", desc: "Our smart contract code is public. Anyone can read it, audit it, and verify it does exactly what we say." },
              { icon: "⚡", title: "Instant Payouts", desc: "The contract pays the winner automatically. No withdrawal needed. No waiting. Funds in your wallet immediately." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: "#0D1117", border: "1px solid #1a2030",
                borderRadius: 16, padding: 24,
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contract info */}
      <div style={{ padding: "60px 20px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 11, color: "#9945FF", letterSpacing: 4, marginBottom: 12, textAlign: "center" }}>
          TRANSPARENCY
        </div>
        <h2 style={{ fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 40, color: "#fff" }}>
          Verify everything yourself
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Smart Contract", value: "8djAC69852xokSdr3joE18eMKVNHT5jPggpHidkYLngA" },
            { label: "Protocol Wallet", value: "DEbmxpSdKuYHoaYT1Th8jNBoKjXi1ARnhW6zEmRZzMp" },
            { label: "Network", value: "Solana Mainnet" },
            { label: "Source Code", value: "github.com/solotto (coming soon)" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "#0D1117", border: "1px solid #1a2030",
              borderRadius: 12, padding: "16px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: 16, flexWrap: "wrap",
            }}>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, minWidth: 140 }}>{label}</div>
              <div style={{ fontSize: 12, color: "#E8E8E8", fontFamily: "monospace", wordBreak: "break-all" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Blog */}
      <div style={{ padding: "60px 20px", background: "#0a0f18", borderTop: "1px solid #1a2030", borderBottom: "1px solid #1a2030" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, color: "#14F195", letterSpacing: 4, marginBottom: 12, textAlign: "center" }}>LEARN</div>
          <h2 style={{ fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 8, color: "#fff" }}>Solana Gaming Guides</h2>
          <p style={{ textAlign: "center", color: "#555", fontSize: 13, marginBottom: 40 }}>Everything you need to understand on-chain gaming</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
            {[
              { tag: "Gaming", title: "How Provably Fair Blockchain Games Work", url: "/blog/provably-fair-blockchain-games" },
              { tag: "Solana", title: "What Is On-Chain Randomness on Solana?", url: "/blog/on-chain-randomness-solana" },
              { tag: "Smart Contracts", title: "Solana Smart Contracts Explained for Beginners", url: "/blog/solana-smart-contracts-explained" },
              { tag: "Comparison", title: "Blockchain Gaming vs Traditional Platforms", url: "/blog/transparent-blockchain-gaming-vs-traditional" },
              { tag: "Wallet", title: "How to Use Phantom Wallet for On-Chain Games", url: "/blog/phantom-wallet-on-chain-games" },
              { tag: "Solana", title: "Solana Transaction Speed and Why It Matters for Gaming", url: "/blog/solana-transaction-speed-gaming" },
            ].map(({ tag, title, url }) => (
              <a key={url} href={url} style={{ background: "#0D1117", border: "1px solid #1a2030", borderRadius: 14, padding: 20, display: "block", textDecoration: "none", transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#14F19555"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#1a2030"}>
                <div style={{ fontSize: 10, color: "#14F195", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{tag}</div>
                <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff", lineHeight: 1.4 }}>{title}</div>
              </a>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <a href="/blog" style={{ display: "inline-block", background: "transparent", border: "1px solid #14F19533", color: "#14F195", padding: "12px 32px", borderRadius: 10, fontSize: 13, fontWeight: "bold", letterSpacing: 1, textDecoration: "none" }}>VIEW ALL ARTICLES →</a>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: "0 20px 80px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 11, color: "#FFD700", letterSpacing: 4, marginBottom: 12, textAlign: "center" }}>
          FAQ
        </div>
        <h2 style={{ fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 40, color: "#fff" }}>
          Common questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { q: "Do I need to do anything to claim my prize?", a: "No. The smart contract sends the prize directly to your wallet the moment the round ends. Nothing to click." },
            { q: "What happens if no one else joins my round?", a: "If you're the only player, you win 88% of your own ticket back. Rounds always resolve after 60 seconds." },
            { q: "Can I buy multiple tickets in one round?", a: "Yes. Each ticket gives you one entry. Buying 2 tickets when there are 10 total gives you a 20% chance to win." },
            { q: "What wallet do I need?", a: "Phantom wallet (phantom.com) is recommended. Solflare and Backpack also work." },
            { q: "Is this legal?", a: "SOLOTTO is a skill-neutral, transparent on-chain game. Players should check their local regulations before participating." },
          ].map(({ q, a }) => (
            <div key={q} style={{
              background: "#0D1117", border: "1px solid #1a2030",
              borderRadius: 12, padding: "20px 24px",
            }}>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>{q}</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
