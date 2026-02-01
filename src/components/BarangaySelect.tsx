'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useFormFields, RelationshipField } from '@payloadcms/ui'
import type { RelationshipFieldClientProps } from 'payload'

/**
 * Custom Barangay Select Component
 * Automatically fetches barangays from PSGC API when city is selected
 * Uses debouncing to prevent rapid API calls
 *
 * IMPORTANT: Does NOT use readOnly to avoid form submission issues
 */
export const BarangaySelect: React.FC<RelationshipFieldClientProps> = (props) => {
  const cityField = useFormFields(([fields]) => fields.city)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const cityId = cityField?.value as number | undefined

  useEffect(() => {
    // Clear any pending fetch
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (cityId && typeof cityId === 'number') {
      // Debounce the fetch by 500ms
      debounceTimerRef.current = setTimeout(() => {
        setIsFetching(true)
        setFetchError(null)

        abortControllerRef.current = new AbortController()

        fetch(`/api/psgc/barangays?cityId=${cityId}`, {
          signal: abortControllerRef.current.signal,
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error('Failed to fetch barangays')
            }
            return res.json()
          })
          .then((data) => {
            console.log(`[Barangay Select] Fetched ${data.length} barangays for city ${cityId}`)
            setIsFetching(false)
          })
          .catch((err) => {
            if (err.name === 'AbortError') {
              return
            }
            console.error('[Barangay Select] Error fetching barangays:', err)
            setFetchError(err.message)
            setIsFetching(false)
          })
      }, 500)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [cityId])

  // Build description message
  let description = props.field.admin?.description || 'Filtered by city'

  if (!cityId) {
    description = 'Select a city first (dropdown will be empty until city is selected)'
  } else if (isFetching) {
    description = 'Loading barangays from PSGC API...'
  } else if (fetchError) {
    description = `Error: ${fetchError}. Please try again.`
  } else {
    description = 'Barangays loaded from PSGC API'
  }

  return (
    <RelationshipField
      {...props}
      field={{
        ...props.field,
        admin: {
          ...props.field.admin,
          description,
        },
      }}
    />
  )
}
