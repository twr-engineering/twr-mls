'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

const PSGC_API = 'https://psgc.cloud/api'

interface Barangay {
    code: string
    name: string
}

type Props = {
    path: string
    field: {
        name: string
        label?: string
        required?: boolean
    }
}

/**
 * Barangay select field for the Townships collection.
 * Fetches barangays from PSGC API based on the selected city.
 * Provides a MULTI-SELECT dropdown that cascades from city selection.
 */
export const TownshipBarangaySelectField: React.FC<Props> = ({ path, field }) => {
    // Note: for multi-select, value will be an array of strings
    const { value, setValue } = useField<string[]>({ path })
    const [barangays, setBarangays] = useState<Barangay[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Watch the city field value
    const cityCode = useFormFields(([fields]) => fields['city']?.value as string | undefined)

    // Fetch barangays when city changes
    useEffect(() => {
        if (!cityCode) {
            setBarangays([])
            return
        }

        const fetchBarangays = async () => {
            setLoading(true)
            try {
                let res = await fetch(`${PSGC_API}/cities/${cityCode}/barangays`)

                if (!res.ok) {
                    res = await fetch(`${PSGC_API}/cities-municipalities/${cityCode}/barangays`)
                }

                if (res.ok) {
                    const data: Barangay[] = await res.json()
                    data.sort((a, b) => a.name.localeCompare(b.name))
                    setBarangays(data)
                } else {
                    setBarangays([])
                }
            } catch (err) {
                console.error('Failed to fetch barangays:', err)
                setBarangays([])
            } finally {
                setLoading(false)
            }
        }
        fetchBarangays()
    }, [cityCode])

    // Handle clicks outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredBarangays = useMemo(() => {
        if (!search) return barangays
        return barangays.filter((bgy) =>
            bgy.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [barangays, search])

    // Current selected values (ensure it's an array)
    const selectedCodes = Array.isArray(value) ? value : []

    const isSelected = (code: string) => selectedCodes.includes(code)

    const handleSelect = (bgy: Barangay) => {
        if (isSelected(bgy.code)) {
            // Remove
            setValue(selectedCodes.filter((c) => c !== bgy.code))
        } else {
            // Add
            setValue([...selectedCodes, bgy.code])
        }
        // Don't close dropdown for multi-select convenience
        setSearch('')
    }

    const handleRemove = (code: string) => {
        setValue(selectedCodes.filter((c) => c !== code))
    }

    // Get names for display
    // We might have codes selected from a PREVIOUS city selection that are not in current `barangays` list.
    // Ideally we should keep fetching/storing names, but for now we only know names of currently loaded city.
    // Displaying just code for unknown ones is a fallback.
    const getDisplayName = (code: string) => {
        const found = barangays.find(b => b.code === code)
        return found ? found.name : code
    }

    const isDisabled = !cityCode

    return (
        <div className="field-type select-many" ref={dropdownRef}>
            <label className="field-label">
                {field.label || 'Covered Barangays'}
                {field.required && <span className="required">*</span>}
            </label>

            {/* Selected Tags Area */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '8px'
            }}>
                {selectedCodes.map(code => (
                    <div key={code} style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--theme-elevation-100)',
                        border: '1px solid var(--theme-elevation-200)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '14px'
                    }}>
                        <span>{getDisplayName(code)}</span>
                        <button
                            type="button"
                            onClick={() => handleRemove(code)}
                            style={{
                                marginLeft: '6px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--theme-elevation-500)',
                                fontSize: '16px',
                                lineHeight: 1
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div className="rs-container" style={{ position: 'relative' }}>
                {isDisabled ? (
                    <div style={{
                        padding: '10px 12px',
                        border: '1px solid var(--theme-elevation-100)',
                        borderRadius: '4px',
                        background: 'var(--theme-elevation-50)',
                        color: 'var(--theme-elevation-400)',
                        minHeight: '42px',
                    }}>
                        Select a city first...
                    </div>
                ) : loading ? (
                    <div style={{
                        padding: '10px 12px',
                        border: '1px solid var(--theme-elevation-150)',
                        borderRadius: '4px',
                        background: 'var(--theme-input-bg)',
                        minHeight: '42px',
                    }}>
                        Loading barangays...
                    </div>
                ) : (
                    <>
                        <div
                            onClick={() => setIsOpen(!isOpen)}
                            style={{
                                padding: '10px 12px',
                                border: '1px solid var(--theme-elevation-150)',
                                borderRadius: '4px',
                                background: 'var(--theme-input-bg)',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                minHeight: '42px',
                            }}
                        >
                            <span style={{ color: 'var(--theme-elevation-400)' }}>
                                {isOpen ? 'Type to search...' : `Select barangays (${selectedCodes.length} selected)`}
                            </span>
                            <span style={{ color: 'var(--theme-elevation-400)' }}>▾</span>
                        </div>

                        {isOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 100,
                                background: 'var(--theme-elevation-0)',
                                border: '1px solid var(--theme-elevation-150)',
                                borderRadius: '4px',
                                marginTop: '4px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                maxHeight: '300px',
                                overflow: 'hidden',
                            }}>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: 'none',
                                        borderBottom: '1px solid var(--theme-elevation-150)',
                                        outline: 'none',
                                        background: 'var(--theme-input-bg)',
                                        color: 'inherit',
                                        fontSize: '14px',
                                    }}
                                />
                                <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                                    {filteredBarangays.length === 0 ? (
                                        <div style={{ padding: '12px', color: 'var(--theme-elevation-400)' }}>
                                            No barangays found for this city
                                        </div>
                                    ) : (
                                        filteredBarangays.map((bgy) => {
                                            const active = isSelected(bgy.code)
                                            return (
                                                <div
                                                    key={bgy.code}
                                                    onClick={() => handleSelect(bgy)}
                                                    style={{
                                                        padding: '10px 12px',
                                                        cursor: 'pointer',
                                                        background: active ? 'var(--theme-elevation-100)' : 'transparent',
                                                        display: 'flex',
                                                        justifyContent: 'space-between'
                                                    }}
                                                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--theme-elevation-50)' }}
                                                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                                                >
                                                    <span>{bgy.name}</span>
                                                    {active && <span>✓</span>}
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="field-description">
                Filtered by selected City. You can switch cities to add barangays from different locations if needed.
            </div>
        </div>
    )
}

export default TownshipBarangaySelectField
