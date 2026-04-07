use anchor_lang::prelude::*;
use crate::state::RoomState;
use crate::error::LotteryError;
use crate::constants::*;

pub fn handler(ctx: Context<BuyTicket>) -> Result<()> {
    let ticket_price = ctx.accounts.room.ticket_price;

    require!(ctx.accounts.room.is_active, LotteryError::RoundNotActive);
    require!(ctx.accounts.room.tickets.len() < MAX_TICKETS, LotteryError::TooManyTickets);

    let protocol_fee = ticket_price * PROTOCOL_FEE_BPS / BPS_BASE;
    let jackpot_fee = ticket_price * JACKPOT_FEE_BPS / BPS_BASE;
    let vault_amount = ticket_price - protocol_fee;

    // Transfer to vault
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

    // Transfer protocol fee
    let ix_fee = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.player.key(),
        &ctx.accounts.protocol_wallet.key(),
        protocol_fee,
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
    room.jackpot += jackpot_fee;

    msg!("Ticket bought: {}", ctx.accounts.player.key());
    msg!("Pool: {} lamports", room.total_pool);
    Ok(())
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(mut, seeds = [b"room", &[room.room_id]], bump = room.bump)]
    pub room: Account<'info, RoomState>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: vault
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    /// CHECK: protocol wallet
    #[account(mut, constraint = protocol_wallet.key().to_string() == PROTOCOL_WALLET)]
    pub protocol_wallet: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
