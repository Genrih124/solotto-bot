use anchor_lang::prelude::*;

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
