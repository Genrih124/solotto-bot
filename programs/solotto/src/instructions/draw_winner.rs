use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::RoomState;
use crate::error::LotteryError;
use crate::constants::*;

pub fn handler(ctx: Context<DrawWinner>) -> Result<()> {
    let room = &mut ctx.accounts.room;

    require!(room.is_active, LotteryError::RoundNotActive);
    require!(!room.tickets.is_empty(), LotteryError::NoTickets);

    let clock = Clock::get()?;
    let index = (clock.slot as usize) % room.tickets.len();
    let winner_key = room.tickets[index];

    let winner_prize = room.total_pool * WINNER_BPS / BPS_BASE;

    msg!("Winner: {}", winner_key);
    msg!("Prize: {} lamports", winner_prize);

    room.tickets = Vec::new();
    room.total_pool = 0;
    room.round += 1;
    room.start_time = clock.unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
pub struct DrawWinner<'info> {
    #[account(mut, seeds = [b"room", &[room.room_id]], bump = room.bump)]
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
