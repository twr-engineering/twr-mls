import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure, URL-safe token
 *
 * @param length - Number of bytes (default: 32, produces ~43 character string)
 * @returns URL-safe base64 encoded token
 */
export const generateSecureToken = (length: number = 32): string => {
  return randomBytes(length).toString('base64url')
}
