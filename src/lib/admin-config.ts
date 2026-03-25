export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

export const ADMIN_ENABLED = IS_DEVELOPMENT

export function isAdminAccessAllowed(): boolean {
  return ADMIN_ENABLED
}

export function bypassTierCheck(): boolean {
  return IS_DEVELOPMENT
}
