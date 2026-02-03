/**
 * PSGC Cloud API Client
 * Handles communication with the Philippine Standard Geographic Code (PSGC) Cloud API
 * API Documentation: https://psgc.cloud/api-docs/v2
 */

import type { PSGCBarangay, PSGCCity } from './types'

export class PSGCApiClient {
  private readonly baseUrl = 'https://psgc.cloud/api/v2'
  private readonly retryAttempts = 3
  private readonly retryDelay = 1000 // milliseconds
  private readonly timeout = 10000 // 10 seconds

  /**
   * Fetch all barangays for a specific city/municipality
   * @param cityCode PSGC city/municipality code (e.g., "137602" for Cagayan de Oro)
   * @returns Array of barangays
   */
  async fetchBarangaysByCity(cityCode: string): Promise<PSGCBarangay[]> {
    const url = `${this.baseUrl}/cities-municipalities/${cityCode}/barangays`

    try {
      console.log(`[PSGC API] Fetching barangays for city code: ${cityCode}`)
      const startTime = Date.now()

      const response = await this.fetchWithRetry(url)
      const json = await response.json()
      const data = json.data || json // Extract data property or use response as-is

      const duration = Date.now() - startTime
      console.log(
        `[PSGC API] Successfully fetched ${data.length || 0} barangays in ${duration}ms`,
      )

      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error(`[PSGC API] Failed to fetch barangays for city ${cityCode}:`, error)
      throw new Error(
        `Failed to fetch barangays from PSGC API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Fetch all cities/municipalities from PSGC API
   * @returns Array of cities
   */
  async fetchAllCities(): Promise<PSGCCity[]> {
    const url = `${this.baseUrl}/cities-municipalities`

    try {
      console.log('[PSGC API] Fetching all cities/municipalities')
      const startTime = Date.now()

      const response = await this.fetchWithRetry(url)
      const json = await response.json()
      const data = json.data || json // Extract data property or use response as-is

      const duration = Date.now() - startTime
      console.log(`[PSGC API] Successfully fetched ${data.length || 0} cities in ${duration}ms`)

      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('[PSGC API] Failed to fetch cities:', error)
      throw new Error(
        `Failed to fetch cities from PSGC API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Fetch with retry logic and exponential backoff
   * @private
   */
  private async fetchWithRetry(url: string): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        clearTimeout(timeoutId)

        // Handle HTTP errors
        if (!response.ok) {
          // 404 - City/resource not found
          if (response.status === 404) {
            throw new Error(`PSGC resource not found (404): ${url}`)
          }

          // 429 - Rate limit exceeded
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After')
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.calculateBackoff(attempt)

            console.warn(
              `[PSGC API] Rate limited (429). Waiting ${waitTime}ms before retry ${attempt}/${this.retryAttempts}`,
            )

            if (attempt < this.retryAttempts) {
              await this.sleep(waitTime)
              continue
            }

            throw new Error('PSGC API rate limit exceeded after retries')
          }

          // 500 - Server error
          if (response.status >= 500) {
            console.warn(
              `[PSGC API] Server error (${response.status}). Retry ${attempt}/${this.retryAttempts}`,
            )

            if (attempt < this.retryAttempts) {
              await this.sleep(this.calculateBackoff(attempt))
              continue
            }

            throw new Error(`PSGC API server error: ${response.status}`)
          }

          // Other HTTP errors
          throw new Error(`PSGC API HTTP error: ${response.status}`)
        }

        return response
      } catch (error) {
        lastError = error as Error

        // Don't retry on AbortError (timeout) or specific errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(
              `[PSGC API] Request timeout after ${this.timeout}ms. Retry ${attempt}/${this.retryAttempts}`,
            )
          } else if (error.message.includes('404')) {
            // Don't retry 404s
            throw error
          }
        }

        // Retry with exponential backoff
        if (attempt < this.retryAttempts) {
          const backoffTime = this.calculateBackoff(attempt)
          console.warn(`[PSGC API] Retry ${attempt}/${this.retryAttempts} after ${backoffTime}ms`)
          await this.sleep(backoffTime)
        }
      }
    }

    // All retries failed
    throw lastError || new Error('PSGC API request failed after all retries')
  }

  /**
   * Calculate exponential backoff delay
   * @private
   */
  private calculateBackoff(attempt: number): number {
    return this.retryDelay * Math.pow(2, attempt - 1)
  }

  /**
   * Sleep helper for retry delays
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const psgcClient = new PSGCApiClient()
