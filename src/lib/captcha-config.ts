/**
 * Captcha Configuration
 * 
 * Captcha is only required in production to avoid friction during development.
 * Set NEXT_PUBLIC_CAPTCHA_ENABLED=true to enable in development for testing.
 */

const isProduction = process.env.NODE_ENV === 'production'
const forceEnabled = process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === 'true'

export const CAPTCHA_ENABLED = isProduction || forceEnabled

export const CAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || ''

export function isCaptchaConfigured(): boolean {
  return Boolean(CAPTCHA_SITE_KEY)
}

export function shouldRequireCaptcha(): boolean {
  return CAPTCHA_ENABLED && isCaptchaConfigured()
}
