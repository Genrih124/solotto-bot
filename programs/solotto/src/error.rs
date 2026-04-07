use anchor_lang::prelude::*;

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
    #[msg("Invalid protocol wallet")]
    InvalidProtocolWallet,
}
