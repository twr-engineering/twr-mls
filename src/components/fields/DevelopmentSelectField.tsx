'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

type Props = {
    path: string
    field: {
        name: string
        label?: string
        required?: boolean
    }
}

interface Development {
    id: string | number
    name: string
}

interface Barangay {
    id: string | number
    psgcCode: string
}

export const DevelopmentSelectField: React.FC<Props> = ({ path, field }) => {
    const { value, setValue } = useField<string | number>({ path })
    const [developments, setDevelopments] = useState<Development[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Watch the barangay field (PSGC code)
    const barangayPsgcCode = useFormFields(([fields]) => fields['barangay']?.value as string | undefined)
    const prevBarangayRef = useRef(barangayPsgcCode)

    // Reset value when barangay changes
    useEffect(() => {
        if (prevBarangayRef.current !== barangayPsgcCode) {
            setValue(null)
            prevBarangayRef.current = barangayPsgcCode
        }
    }, [barangayPsgcCode, setValue])

    useEffect(() => {
        const fetchDevelopments = async () => {
            if (!barangayPsgcCode) {
                setDevelopments([])
                return
            }

            setLoading(true)
            try {
                // Fetch developments filtered by barangay
                const devRes = await fetch(`/api/developments?where[barangay][equals]=${barangayPsgcCode}&where[isActive][equals]=true&limit=100&sort=name`)
                if (!devRes.ok) {
                    setDevelopments([])
                    return
                }
                const devData = await devRes.json()
                setDevelopments(devData.docs || [])
            } catch (err) {
                console.error('Failed to fetch developments:', err)
                setDevelopments([])
            } finally {
                setLoading(false)
            }
        }

        // Initial fetch or update
        fetchDevelopments()
    }, [barangayPsgcCode])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredDevelopments = useMemo(() => {
        if (!search) return developments
        return developments.filter((dev) =>
            dev.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [developments, search])

    const selectedDevelopment = developments.find((d) => String(d.id) === String(value))

    const handleSelect = (dev: Development) => {
        setValue(dev.id)
        setSearch('')
        setIsOpen(false)
    }

    const handleClear = () => {
        setValue('')
        setSearch('')
    }

    return (
        <div className="field-type relationship" ref={dropdownRef}>
            <label className="field-label">
                {field.label || 'Development'}
            </label>

            <div className="rs-container" style={{ position: 'relative' }}>
                {loading ? (
                    <div style={{
                        padding: '10px 12px',
                        border: '1px solid var(--theme-elevation-150)',
                        borderRadius: '4px',
                        background: 'var(--theme-input-bg)',
                        minHeight: '42px',
                    }}>
                        Loading developments...
                    </div>
                ) : developments.length === 0 ? (
                    <div style={{
                        padding: '10px 12px',
                        border: '1px solid var(--theme-elevation-150)',
                        borderRadius: '4px',
                        background: 'var(--theme-input-bg)',
                        color: 'var(--theme-elevation-400)',
                        minHeight: '42px',
                    }}>
                        No developments available
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
                            <span style={{ color: selectedDevelopment ? 'inherit' : 'var(--theme-elevation-400)' }}>
                                {selectedDevelopment ? selectedDevelopment.name : 'Select a development (optional)...'}
                            </span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {selectedDevelopment && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleClear(); }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--theme-elevation-400)',
                                            fontSize: '16px',
                                            padding: '0 4px',
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                                <span style={{ color: 'var(--theme-elevation-400)' }}>▾</span>
                            </div>
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
                                    placeholder="Search developments..."
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
                                    {filteredDevelopments.length === 0 ? (
                                        <div style={{ padding: '12px', color: 'var(--theme-elevation-400)' }}>
                                            No developments found
                                        </div>
                                    ) : (
                                        filteredDevelopments.map((dev) => (
                                            <div
                                                key={dev.id}
                                                onClick={() => handleSelect(dev)}
                                                style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    background: String(dev.id) === String(value) ? 'var(--theme-elevation-100)' : 'transparent',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--theme-elevation-50)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = String(dev.id) === String(value) ? 'var(--theme-elevation-100)' : 'transparent'}
                                            >
                                                {dev.name}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="field-description">
                {selectedDevelopment ? `Selected: ${selectedDevelopment.name}` : 'Subdivision/development within the barangay (optional)'}
            </div>
        </div>
    )
}

export default DevelopmentSelectField
