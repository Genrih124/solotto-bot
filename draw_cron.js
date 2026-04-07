const { Connection, PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const { Program, AnchorProvider, Wallet } = require("@coral-xyz/anchor");
const fs = require("fs");
const idl = require("./target/idl/solotto.json");

const PROGRAM_ID = new PublicKey("8djAC69852xokSdr3joE18eMKVNHT5jPggpHidkYLngA");
const CONNECTION = new Connection("https://mainnet.helius-rpc.com/?api-key=c7152c4f-8ee0-491a-bebf-78e7374c0964", "confirmed");
const WINNERS_FILE = "./app/public/winners.json";
const ROUND_DURATION = 60;

const keypairData = JSON.parse(fs.readFileSync(process.env.HOME + "/.config/solana/id.json"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
const program = new Program(idl, new AnchorProvider(CONNECTION, new Wallet(keypair), { commitment: "confirmed" }));

const ROOMS = [
  { id: 1, label: "0.05 SOL" },
  { id: 2, label: "0.10 SOL" },
  { id: 3, label: "0.20 SOL" },
  { id: 4, label: "0.30 SOL" },
  { id: 5, label: "0.50 SOL" },
];

function getRoomPDA(roomId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("room"), Buffer.from([roomId])],
    PROGRAM_ID
  );
  return pda;
}

function saveWinner(w) {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(WINNERS_FILE)); } catch(e) {}
  list.unshift(w);
  fs.writeFileSync(WINNERS_FILE, JSON.stringify(list.slice(0, 50)));
  console.log(`✅ Room ${w.room}: ${w.winner.slice(0,8)}... +${w.prize} SOL`);
}

const processing = new Set();

async function processRoom(room) {
  if (processing.has(room.id)) return;
  processing.add(room.id);
  try {
    const pda = getRoomPDA(room.id);
    const data = await program.account.roomState.fetch(pda);
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - data.startTime.toNumber();

    if (elapsed < ROUND_DURATION) return; // Round still running

    if (data.tickets.length === 0) {
      // No tickets - just reset the round timer
      await program.methods.resetRound()
        .accounts({ room: pda, authority: keypair.publicKey })
        .rpc();
      console.log(`Room ${room.id}: ♻️ Reset empty round`);
      return;
    }

    // Pick winner
    console.log(`Room ${room.id}: 🎲 Drawing from ${data.tickets.length} tickets...`);
    const slot = await CONNECTION.getSlot();
    let random = BigInt(slot);
    random ^= BigInt(now);
    random ^= BigInt(data.round.toNumber()) * BigInt("0x9e3779b97f4a7c15");
    for (let i = 0; i < data.tickets.length; i++) {
      const bytes = data.tickets[i].toBytes();
      let chunk = BigInt(0);
      for (let j = 0; j < 8; j++) chunk ^= BigInt(bytes[(i+j)%32]) << BigInt(j*8);
      random = BigInt.asUintN(64, random + chunk);
      random ^= random >> BigInt(33);
      random = BigInt.asUintN(64, random * BigInt("0xff51afd7ed558ccd"));
    }
    const index = Number(random % BigInt(data.tickets.length));
    const winnerPubkey = data.tickets[index];
    const winnerPrize = Math.floor(data.totalPool.toNumber() * 0.88);
    const prizeSOL = (winnerPrize / LAMPORTS_PER_SOL).toFixed(4);

    // Send prize
    await sendAndConfirmTransaction(CONNECTION,
      new Transaction().add(SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: winnerPubkey,
        lamports: winnerPrize,
      })),
      [keypair]
    );

    // Reset round on-chain
    await program.methods.drawWinner()
      .accounts({ room: pda, authority: keypair.publicKey, winner: winnerPubkey, vault: pda, systemProgram: PublicKey.default })
      .rpc();

    console.log(`Room ${room.id}: 🏆 ${winnerPubkey.toString().slice(0,8)}... +${prizeSOL} SOL`);
    saveWinner({
      room: room.id, roomLabel: room.label,
      winner: winnerPubkey.toString(), prize: prizeSOL,
      participants: data.tickets.length,
      round: data.round.toNumber(), time: Date.now(),
    });

  } catch(e) {
    console.log(`Room ${room.id}: ${e.message?.slice(0,80)}`);
  } finally {
    processing.delete(room.id);
  }
}

async function run() {
  if (!fs.existsSync("./app/public")) fs.mkdirSync("./app/public", { recursive: true });
  if (!fs.existsSync(WINNERS_FILE)) fs.writeFileSync(WINNERS_FILE, "[]");
  console.log("🎰 SOLOTTO Bot started");

  // Check every 3 seconds
  setInterval(async () => {
    await Promise.all(ROOMS.map(room => processRoom(room)));
  }, 3000);
}

run();
