'use client'

import React from 'react'
import { useAuth, useField, FieldLabel, FieldDescription } from '@payloadcms/ui'
import ReactSelect from 'react-select'
import type { SelectFieldClientComponent } from 'payload'

export const StatusField: SelectFieldClientComponent = ({ field, path }) => {
    const { value, setValue, showError } = useField({ path })
    const { user } = useAuth()

    // Filter options based on user role
    const filteredOptions = React.useMemo(() => {
        if (!field.options || !Array.isArray(field.options)) {
            return []
        }
        if (user?.role === 'agent') {
            return field.options.filter((option) => {
                const optionValue = typeof option === 'string' ? option : option.value
                return optionValue === 'draft' || optionValue === 'submitted'
            })
        }
        return field.options
    }, [field.options, user?.role])

    // Convert to ReactSelect format
    const selectOptions = React.useMemo(() => {
        return filteredOptions.map((option) => {
            if (typeof option === 'string') {
                return { label: option, value: option }
            }
            return { label: option.label, value: option.value }
        })
    }, [filteredOptions])

    const selectedOption = React.useMemo(() => {
        if (!value) return null
        return selectOptions.find((opt) => opt.value === value) || null
    }, [value, selectOptions])

    // Payload-style theme for react-select
    const customStyles = React.useMemo(() => ({
        control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
            ...base,
            minHeight: '40px',
            borderColor: showError 
                ? 'var(--theme-error-500)' 
                : state.isFocused 
                    ? 'var(--theme-elevation-400)' 
                    : 'var(--theme-elevation-200)',
            boxShadow: state.isFocused 
                ? '0 0 0 1px var(--theme-elevation-400)' 
                : 'none',
            '&:hover': {
                borderColor: showError 
                    ? 'var(--theme-error-500)' 
                    : 'var(--theme-elevation-300)',
            },
            backgroundColor: 'var(--theme-elevation-0)',
        }),
        option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
            ...base,
            backgroundColor: state.isSelected
                ? 'var(--theme-elevation-100)'
                : state.isFocused
                    ? 'var(--theme-elevation-50)'
                    : 'transparent',
            color: 'var(--theme-text)',
            '&:active': {
                backgroundColor: 'var(--theme-elevation-100)',
            },
        }),
        menu: (base: Record<string, unknown>) => ({
            ...base,
            backgroundColor: 'var(--theme-elevation-0)',
            border: '1px solid var(--theme-elevation-200)',
            boxShadow: 'var(--shadow-lg)',
        }),
        singleValue: (base: Record<string, unknown>) => ({
            ...base,
            color: 'var(--theme-text)',
        }),
        placeholder: (base: Record<string, unknown>) => ({
            ...base,
            color: 'var(--theme-elevation-500)',
        }),
    }), [showError])

    return (
        <div className="field-type select">
            <FieldLabel
                htmlFor={path}
                label={field.label}
                required={field.required}
            />
            <ReactSelect
                value={selectedOption}
                onChange={(option) => {
                    setValue(option?.value || null)
                }}
                options={selectOptions}
                isDisabled={field.admin?.readOnly}
                isClearable={!field.required}
                placeholder={field.required ? 'Select...' : '--'}
                styles={customStyles}
            />
            <FieldDescription path={path} description={field.admin?.description} />
            {showError && (
                <div 
                    className="field-error" 
                    style={{ 
                        color: 'var(--theme-error-500)', 
                        marginTop: '4px', 
                        fontSize: '12px' 
                    }}
                >
                    {'This field is required'}
                </div>
            )}
        </div>
    )
}
