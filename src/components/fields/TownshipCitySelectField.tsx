'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useField } from '@payloadcms/ui'

const PSGC_API = 'https://psgc.cloud/api'

interface City {
    code: string
    name: string
    regionCode: string
    provinceCode: string
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
 * City select field for the Townships collection.
 * Fetches cities from PSGC API.
 * Used to filter covered barangays.
 */
export const TownshipCitySelectField: React.FC<Props> = ({ path, field }) => {
    const { value, setValue } = useField<string>({ path })

    // Watch province field
    const provincePath = path.replace(/city$/, 'province')
    const { value: provinceCode } = useField<string>({ path: provincePath })

    const [cities, setCities] = useState<City[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (provinceCode) {
            const fetchCities = async () => {
                setLoading(true)
                try {
                    const res = await fetch(`${PSGC_API}/provinces/${provinceCode}/cities-municipalities`)
                    const data: City[] = await res.json()
                    data.sort((a, b) => a.name.localeCompare(b.name))
                    setCities(data)
                } catch (err) {
                    console.error('Failed to fetch cities:', err)
                    setCities([])
                } finally {
                    setLoading(false)
                }
            }
            fetchCities()
        } else {
            setCities([])
            setLoading(false)
        }
    }, [provinceCode])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredCities = useMemo(() => {
        if (!search) return cities
        return cities.filter((city) =>
            city.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [cities, search])

    const selectedCity = cities.find((c) => c.code === value)

    const handleSelect = (city: City) => {
        setValue(city.code)
        setSearch('')
        setIsOpen(false)
    }

    const handleClear = () => {
        setValue('')
        setSearch('')
    }

    return (
        <div className="field-type text" ref={dropdownRef}>
            <label className="field-label">
                {field.label || 'City'}
                {field.required && <span className="required">*</span>}
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
                        Loading cities...
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
                            <span style={{ color: selectedCity ? 'inherit' : 'var(--theme-elevation-400)' }}>
                                {selectedCity ? selectedCity.name : 'Select a city...'}
                            </span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {selectedCity && (
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
                                    placeholder="Search cities..."
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
                                    {filteredCities.length === 0 ? (
                                        <div style={{ padding: '12px', color: 'var(--theme-elevation-400)' }}>
                                            No cities found
                                        </div>
                                    ) : (
                                        filteredCities.map((city) => (
                                            <div
                                                key={city.code}
                                                onClick={() => handleSelect(city)}
                                                style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    background: city.code === value ? 'var(--theme-elevation-100)' : 'transparent',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--theme-elevation-50)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = city.code === value ? 'var(--theme-elevation-100)' : 'transparent'}
                                            >
                                                {city.name}
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
                {selectedCity ? `PSGC Code: ${selectedCity.code}` : 'Select a city to filter barangays'}
            </div>
        </div>
    )
}

export default TownshipCitySelectField
