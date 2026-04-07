use anchor_lang::prelude::*;
use crate::state::RoomState;

pub fn handler(ctx: Context<Initialize>, room_id: u8, ticket_price: u64) -> Result<()> {
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

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = RoomState::MAX_SIZE,
        seeds = [b"room", &[room_id][..]],
        bump
    )]
    pub room: Account<'info, RoomState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
