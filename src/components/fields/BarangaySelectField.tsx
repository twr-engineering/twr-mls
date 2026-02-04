'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useField, useForm, useFormFields } from '@payloadcms/ui'

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

export const BarangaySelectField: React.FC<Props> = ({ path, field }) => {
    const { value, setValue } = useField<string>({ path })
    const { dispatchFields } = useForm()
    const [barangays, setBarangays] = useState<Barangay[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const cityCode = useFormFields(([fields]) => fields['city']?.value as string | undefined)

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

    const selectedBarangay = barangays.find((b) => b.code === value)

    const handleSelect = (bgy: Barangay) => {
        setValue(bgy.code)

        // Update sibling barangayName field
        const barangayNamePath = path.replace(/barangay$/, 'barangayName')
        dispatchFields({
            type: 'UPDATE',
            path: barangayNamePath,
            value: bgy.name
        })

        setSearch('')
        setIsOpen(false)
    }

    const handleClear = () => {
        setValue('')

        // Clear sibling barangayName field
        const barangayNamePath = path.replace(/barangay$/, 'barangayName')
        dispatchFields({
            type: 'UPDATE',
            path: barangayNamePath,
            value: ''
        })

        setSearch('')
    }

    const isDisabled = !cityCode

    return (
        <div className="field-type relationship" ref={dropdownRef}>
            <label className="field-label">
                {field.label || 'Barangay'}
                {field.required && <span className="required">*</span>}
            </label>

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
                            className="value-container"
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
                            <span style={{ color: selectedBarangay ? 'inherit' : 'var(--theme-elevation-400)' }}>
                                {selectedBarangay ? selectedBarangay.name : 'Select a barangay...'}
                            </span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {selectedBarangay && (
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
                                    placeholder="Search barangays..."
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
                                            No barangays found
                                        </div>
                                    ) : (
                                        filteredBarangays.map((bgy) => (
                                            <div
                                                key={bgy.code}
                                                onClick={() => handleSelect(bgy)}
                                                style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    background: bgy.code === value ? 'var(--theme-elevation-100)' : 'transparent',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--theme-elevation-50)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = bgy.code === value ? 'var(--theme-elevation-100)' : 'transparent'}
                                            >
                                                {bgy.name}
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
                {selectedBarangay ? `PSGC Code: ${selectedBarangay.code}` : 'Select a barangay from PSGC database'}
            </div>
        </div>
    )
}

export default BarangaySelectField
