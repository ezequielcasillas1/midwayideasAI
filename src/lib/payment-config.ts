export const PLATFORM_FEE_PERCENT = 5

export function calculatePlatformFee(amount: number): number {
  return Math.floor(amount * (PLATFORM_FEE_PERCENT / 100))
}

export function calculateSellerAmount(amount: number): number {
  const fee = calculatePlatformFee(amount)
  return amount - fee
}

export const ESCROW_RELEASE_DAYS = 3

export const CURRENCY = 'usd'

export const MIN_TRANSACTION_AMOUNT = 100

export const STRIPE_CONNECT_COUNTRY = 'US'
