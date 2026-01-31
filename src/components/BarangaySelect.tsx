'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useFormFields, RelationshipField } from '@payloadcms/ui'
import type { RelationshipFieldClientProps } from 'payload'

/**
 * Custom Barangay Select Component
 * Automatically fetches barangays from PSGC API when city is selected
 * Uses debouncing to prevent rapid successive API calls
 */
export const BarangaySelect: React.FC<RelationshipFieldClientProps> = (props) => {
  const cityField = useFormFields(([fields]) => fields.city)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Get the selected city ID
  const cityId = cityField?.value

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
        // Fetch barangays for this city to populate the cache
        setIsFetching(true)
        setFetchError(null)

        // Create abort controller for this request
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
            // Ignore aborted requests
            if (err.name === 'AbortError') {
              console.log('[Barangay Select] Request aborted')
              return
            }
            console.error('[Barangay Select] Error fetching barangays:', err)
            setFetchError(err.message)
            setIsFetching(false)
          })
      }, 500) // 500ms debounce
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [cityId])

  // Update description based on fetch state
  let description = props.field.admin?.description || 'Filtered by selected city'

  if (!cityId) {
    description = 'Please select a city first'
  } else if (isFetching) {
    description = 'Loading barangays from PSGC API...'
  } else if (fetchError) {
    description = `Error: ${fetchError}. Please try refreshing the page.`
  } else if (cityId) {
    description = 'Barangays loaded. Select one from the list.'
  }

  return (
    <RelationshipField
      {...props}
      field={{
        ...props.field,
        admin: {
          ...props.field.admin,
          description,
          readOnly: isFetching || !cityId,
        },
      }}
    />
  )
}
