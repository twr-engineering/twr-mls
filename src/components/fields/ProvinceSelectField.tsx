'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useField, useForm } from '@payloadcms/ui'

const PSGC_API = 'https://psgc.cloud/api'

interface Province {
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

export const ProvinceSelectField: React.FC<Props> = ({ path, field }) => {
    const { value, setValue } = useField<string>({ path })
    const { dispatchFields } = useForm()
    const [provinces, setProvinces] = useState<Province[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res = await fetch(`${PSGC_API}/provinces`)
                const data: Province[] = await res.json()
                data.sort((a, b) => a.name.localeCompare(b.name))
                setProvinces(data)
            } catch (err) {
                console.error('Failed to fetch provinces:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchProvinces()
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredProvinces = useMemo(() => {
        if (!search) return provinces.slice(0, 100)
        return provinces.filter((province) =>
            province.name.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 100)
    }, [provinces, search])

    const selectedProvince = provinces.find((p) => p.code === value)

    const handleSelect = (province: Province) => {
        setValue(province.code)

        // Update sibling provinceName field
        const provinceNamePath = path.replace(/province$/, 'provinceName')
        dispatchFields({
            type: 'UPDATE',
            path: provinceNamePath,
            value: province.name
        })

        setSearch('')
        setIsOpen(false)
    }

    const handleClear = () => {
        setValue('')

        // Clear sibling provinceName field
        const provinceNamePath = path.replace(/province$/, 'provinceName')
        dispatchFields({
            type: 'UPDATE',
            path: provinceNamePath,
            value: ''
        })

        setSearch('')
    }

    return (
        <div className="field-type relationship" ref={dropdownRef}>
            <label className="field-label">
                {field.label || 'Province'}
                {field.required && <span className="required">*</span>}
            </label>

            <div className="rs-container" style={{ position: 'relative' }}>
                {loading ? (
                    <div className="value-container" style={{
                        padding: '10px 12px',
                        border: '1px solid var(--theme-elevation-150)',
                        borderRadius: '4px',
                        background: 'var(--theme-input-bg)',
                    }}>
                        Loading provinces...
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
                            <span style={{ color: selectedProvince ? 'inherit' : 'var(--theme-elevation-400)' }}>
                                {selectedProvince ? selectedProvince.name : 'Select a province...'}
                            </span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {selectedProvince && (
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
                                    placeholder="Search provinces..."
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
                                    {filteredProvinces.length === 0 ? (
                                        <div style={{ padding: '12px', color: 'var(--theme-elevation-400)' }}>
                                            No provinces found
                                        </div>
                                    ) : (
                                        filteredProvinces.map((province) => (
                                            <div
                                                key={province.code}
                                                onClick={() => handleSelect(province)}
                                                style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    background: province.code === value ? 'var(--theme-elevation-100)' : 'transparent',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--theme-elevation-50)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = province.code === value ? 'var(--theme-elevation-100)' : 'transparent'}
                                            >
                                                {province.name}
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
                {selectedProvince ? `PSGC Code: ${selectedProvince.code}` : 'Select a province from PSGC database'}
            </div>
        </div>
    )
}

export default ProvinceSelectField
