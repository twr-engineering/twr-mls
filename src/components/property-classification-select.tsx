'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type PropertyCategory = {
  id: number
  name: string
}

type PropertyType = {
  id: number
  name: string
  category: number
}

type PropertySubtype = {
  id: number
  name: string
  propertyType: number
}

type PropertyClassificationSelectProps = {
  categoryValue?: number
  typeValue?: number
  subtypeValue?: number
  onCategoryChange: (value: number | undefined) => void
  onTypeChange: (value: number | undefined) => void
  onSubtypeChange: (value: number | undefined) => void
  categoryError?: string
  typeError?: string
  subtypeError?: string
}

export function PropertyClassificationSelect({
  categoryValue,
  typeValue,
  subtypeValue,
  onCategoryChange,
  onTypeChange,
  onSubtypeChange,
  categoryError,
  typeError,
  subtypeError,
}: PropertyClassificationSelectProps) {
  const [categories, setCategories] = useState<PropertyCategory[]>([])
  const [types, setTypes] = useState<PropertyType[]>([])
  const [subtypes, setSubtypes] = useState<PropertySubtype[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [isLoadingSubtypes, setIsLoadingSubtypes] = useState(false)

  // Load categories on mount
  useEffect(() => {
    setIsLoadingCategories(true)
    fetch('/api/property-categories?where[isActive][equals]=true&limit=100')
      .then((res) => res.json())
      .then((data) => {
        // Payload REST API returns { docs: [], totalDocs, ... }
        setCategories(data.docs || [])
      })
      .catch((err) => {
        console.error('Error fetching property categories:', err)
        toast.error('Failed to load property categories')
      })
      .finally(() => setIsLoadingCategories(false))
  }, [])

  // Load types when category changes
  useEffect(() => {
    if (categoryValue) {
      setIsLoadingTypes(true)
      fetch(
        `/api/property-types?where[propertyCategory][equals]=${categoryValue}&where[isActive][equals]=true&limit=100`,
      )
        .then((res) => res.json())
        .then((data) => {
          // Payload REST API returns { docs: [], totalDocs, ... }
          setTypes(data.docs || [])
        })
        .catch((err) => {
          console.error('Error fetching property types:', err)
          toast.error('Failed to load property types')
        })
        .finally(() => setIsLoadingTypes(false))
    } else {
      setTypes([])
      setSubtypes([])
    }
  }, [categoryValue])

  // Load subtypes when type changes
  useEffect(() => {
    if (typeValue) {
      setIsLoadingSubtypes(true)
      fetch(
        `/api/property-subtypes?where[propertyType][equals]=${typeValue}&where[isActive][equals]=true&limit=100`,
      )
        .then((res) => res.json())
        .then((data) => {
          // Payload REST API returns { docs: [], totalDocs, ... }
          setSubtypes(data.docs || [])
        })
        .catch((err) => {
          console.error('Error fetching property subtypes:', err)
          toast.error('Failed to load property subtypes')
        })
        .finally(() => setIsLoadingSubtypes(false))
    } else {
      setSubtypes([])
    }
  }, [typeValue])

  const handleCategoryChange = (value: string) => {
    const categoryId = parseInt(value)
    onCategoryChange(categoryId)
    onTypeChange(undefined)
    onSubtypeChange(undefined)
  }

  const handleTypeChange = (value: string) => {
    const typeId = parseInt(value)
    onTypeChange(typeId)
    onSubtypeChange(undefined)
  }

  const handleSubtypeChange = (value: string) => {
    const subtypeId = parseInt(value)
    onSubtypeChange(subtypeId)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label>Property Category *</Label>
        <Select
          value={categoryValue?.toString()}
          onValueChange={handleCategoryChange}
          disabled={isLoadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoadingCategories ? 'Loading...' : 'Select category'} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[0.8rem] text-muted-foreground">e.g., Residential, Commercial</p>
        {categoryError && (
          <p className="text-[0.8rem] font-medium text-destructive">{categoryError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Property Type *</Label>
        <Select
          value={typeValue?.toString()}
          onValueChange={handleTypeChange}
          disabled={!categoryValue || isLoadingTypes || types.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !categoryValue
                  ? 'Select category first'
                  : isLoadingTypes
                    ? 'Loading...'
                    : types.length === 0
                      ? 'No types available'
                      : 'Select type'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[0.8rem] text-muted-foreground">e.g., House & Lot, Condominium</p>
        {typeError && <p className="text-[0.8rem] font-medium text-destructive">{typeError}</p>}
      </div>

      <div className="space-y-2">
        <Label>Property Subtype</Label>
        <Select
          value={subtypeValue?.toString()}
          onValueChange={handleSubtypeChange}
          disabled={!typeValue || isLoadingSubtypes || subtypes.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !typeValue
                  ? 'Select type first'
                  : isLoadingSubtypes
                    ? 'Loading...'
                    : subtypes.length === 0
                      ? 'No subtypes available'
                      : 'Select subtype (optional)'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {subtypes.map((subtype) => (
              <SelectItem key={subtype.id} value={subtype.id.toString()}>
                {subtype.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[0.8rem] text-muted-foreground">Optional specific subtype</p>
        {subtypeError && (
          <p className="text-[0.8rem] font-medium text-destructive">{subtypeError}</p>
        )}
      </div>
    </div>
  )
}
