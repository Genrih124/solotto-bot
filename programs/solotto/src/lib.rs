use anchor_lang::prelude::*;

declare_id!("8djAC69852xokSdr3joE18eMKVNHT5jPggpHidkYLngA");

const PROTOCOL_FEE_BPS: u64 = 1000;
const JACKPOT_FEE_BPS: u64  = 200;
const WINNER_BPS: u64       = 8800;
const BPS_BASE: u64         = 10000;
const MAX_TICKETS: usize    = 100;
const PROTOCOL_WALLET: &str = "DEbmxpSdKuYHoaYT1Th8jNBoKjXi1ARnhW6zEmRZzMp";

#[program]
pub mod solotto {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, room_id: u8, ticket_price: u64) -> Result<()> {
        let room = &mut ctx.accounts.room;
        room.room_id = room_id;
        room.ticket_price = ticket_price;
        room.round = 1;
        room.start_time = Clock::get()?.unix_timestamp;
        room.tickets = Vec::new();
        room.total_pool = 0;
        room.jackpot = 0;
        room.is_active = true;
        room.authority = ctx.accounts.authority.key();
        room.bump = ctx.bumps.room;
        Ok(())
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
        let ticket_price = ctx.accounts.room.ticket_price;
        require!(ctx.accounts.room.is_active, LotteryError::RoundNotActive);
        require!(ctx.accounts.room.tickets.len() < MAX_TICKETS, LotteryError::TooManyTickets);

        let protocol_fee = ticket_price * PROTOCOL_FEE_BPS / BPS_BASE;
        let jackpot_fee  = ticket_price * JACKPOT_FEE_BPS  / BPS_BASE;
        let total_fee    = protocol_fee + jackpot_fee;
        let vault_amount = ticket_price - total_fee;

        let ix_vault = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.vault.key(),
            vault_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix_vault,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let ix_fee = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &ctx.accounts.protocol_wallet.key(),
            protocol_fee + jackpot_fee,
        );
        anchor_lang::solana_program::program::invoke(
            &ix_fee,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.protocol_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let room = &mut ctx.accounts.room;
        room.tickets.push(ctx.accounts.player.key());
        room.total_pool += vault_amount;
        // jackpot goes to protocol wallet directly

        msg!("Ticket bought: {}", ctx.accounts.player.key());
        msg!("Pool: {} lamports", room.total_pool);
        Ok(())
    }

    pub fn reset_round(ctx: Context<ResetRound>) -> Result<()> {
        let room = &mut ctx.accounts.room;
        let clock = Clock::get()?;
        room.start_time = clock.unix_timestamp;
        room.tickets = Vec::new();
        room.total_pool = 0;
        Ok(())
    }

    pub fn draw_winner(ctx: Context<DrawWinner>) -> Result<()> {
        let room = &mut ctx.accounts.room;
        require!(room.is_active, LotteryError::RoundNotActive);
        require!(!room.tickets.is_empty(), LotteryError::NoTickets);

        let clock = Clock::get()?;

        // On-chain randomness: XOR mix of slot + timestamp + all ticket addresses
        let mut random: u64 = clock.slot;
        random ^= clock.unix_timestamp as u64;
        random ^= room.round.wrapping_mul(0x9e3779b97f4a7c15);
        for (i, ticket) in room.tickets.iter().enumerate() {
            let mut chunk: u64 = 0;
            for j in 0..8 {
                chunk ^= (ticket.to_bytes()[(i + j) % 32] as u64) << (j * 8);
            }
            random = random.wrapping_add(chunk);
            random ^= random >> 33;
            random = random.wrapping_mul(0xff51afd7ed558ccd);
        }
        let index = (random as usize) % room.tickets.len();

        let winner_key = room.tickets[index];
        let winner_prize = room.total_pool * WINNER_BPS / BPS_BASE;

        msg!("Winner: {}", winner_key);
        msg!("Prize: {} lamports", winner_prize);
        msg!("Random index: {} of {}", index, room.tickets.len());

        room.tickets = Vec::new();
        room.total_pool = 0;
        room.round += 1;
        room.start_time = clock.unix_timestamp;

        Ok(())
    }
}

#[account]
pub struct RoomState {
    pub room_id: u8,
    pub ticket_price: u64,
    pub round: u64,
    pub start_time: i64,
    pub tickets: Vec<Pubkey>,
    pub total_pool: u64,
    pub jackpot: u64,
    pub is_active: bool,
    pub authority: Pubkey,
    pub bump: u8,
}

impl RoomState {
    pub const MAX_SIZE: usize = 8 + 1 + 8 + 8 + 8 + (4 + 32 * 100) + 8 + 8 + 1 + 32 + 1;
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = RoomState::MAX_SIZE, seeds = [b"room", &[room_id][..]], bump)]
    pub room: Account<'info, RoomState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(mut, seeds = [b"room", &[room.room_id][..]], bump = room.bump)]
    pub room: Account<'info, RoomState>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: vault holds the pool
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    /// CHECK: protocol wallet
    #[account(mut, constraint = protocol_wallet.key().to_string() == PROTOCOL_WALLET)]
    pub protocol_wallet: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResetRound<'info> {
    #[account(mut, seeds = [b"room", &[room.room_id][..]], bump = room.bump)]
    pub room: Account<'info, RoomState>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DrawWinner<'info> {
    #[account(mut, seeds = [b"room", &[room.room_id][..]], bump = room.bump)]
    pub room: Account<'info, RoomState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: winner receives prize
    #[account(mut)]
    pub winner: UncheckedAccount<'info>,
    /// CHECK: vault holds pool
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum LotteryError {
    #[msg("Round is not active")]
    RoundNotActive,
    #[msg("Round has not ended yet")]
    RoundNotEnded,
    #[msg("No tickets in this round")]
    NoTickets,
    #[msg("Too many tickets")]
    TooManyTickets,
}
