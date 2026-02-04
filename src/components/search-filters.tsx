'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X } from 'lucide-react'
import type { City, Barangay as PayloadBarangay, Development } from '@/payload-types'

type Barangay = PayloadBarangay & { psgcCode: string }


type SearchFiltersProps = {
  cities: City[]
  currentFilters: {
    listingType?: string
    transactionType?: string
    cityId?: string
    barangayId?: string
    developmentId?: number
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
    bathrooms?: number
  }
}

export function SearchFilters({ cities, currentFilters }: SearchFiltersProps) {
  const router = useRouter()
  const _searchParams = useSearchParams()

  const [listingType, setListingType] = useState(currentFilters.listingType || 'both')
  const [transactionType, setTransactionType] = useState(currentFilters.transactionType || '')
  const [cityId, setCityId] = useState(currentFilters.cityId?.toString() || '')
  const [barangayId, setBarangayId] = useState(currentFilters.barangayId?.toString() || '')
  const [developmentId, setDevelopmentId] = useState(currentFilters.developmentId?.toString() || '')
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice?.toString() || '')
  const [bedrooms, setBedrooms] = useState(currentFilters.bedrooms?.toString() || '')
  const [bathrooms, setBathrooms] = useState(currentFilters.bathrooms?.toString() || '')

  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [developments, setDevelopments] = useState<Development[]>([])

  // Fetch barangays when city changes
  useEffect(() => {
    if (cityId) {
      fetch(`/api/psgc/barangays?cityId=${cityId}`)
        .then((res) => res.json())
        .then((data) => setBarangays(data))
        .catch((err) => console.error('Error fetching barangays:', err))
    } else {
      setBarangays([])
    }
  }, [cityId])

  // Fetch developments when barangay changes
  useEffect(() => {
    if (barangayId) {
      fetch(`/api/psgc/developments?barangayId=${barangayId}`)
        .then((res) => res.json())
        .then((data) => setDevelopments(data))
        .catch((err) => console.error('Error fetching developments:', err))
    } else {
      setDevelopments([])
    }
  }, [barangayId])

  const handleApplyFilters = () => {
    const params = new URLSearchParams()

    if (listingType && listingType !== 'both') params.set('listingType', listingType)
    if (transactionType) params.set('transactionType', transactionType)
    if (cityId) params.set('cityId', cityId)
    if (barangayId) params.set('barangayId', barangayId)
    if (developmentId) params.set('developmentId', developmentId)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (bedrooms) params.set('bedrooms', bedrooms)
    if (bathrooms) params.set('bathrooms', bathrooms)

    router.push(`/mls?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setListingType('both')
    setTransactionType('')
    setCityId('')
    setBarangayId('')
    setDevelopmentId('')
    setMinPrice('')
    setMaxPrice('')
    setBedrooms('')
    setBathrooms('')
    router.push('/mls')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Search Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Listing Type</Label>
            <Select value={listingType} onValueChange={setListingType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">All Types</SelectItem>
                <SelectItem value="resale">Resale Only</SelectItem>
                <SelectItem value="preselling">Preselling Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger>
                <SelectValue placeholder="All Transaction Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Select value={cityId} onValueChange={(value) => {
              setCityId(value)
              setBarangayId('')
              setDevelopmentId('')
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.psgcCode}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Barangay</Label>
            <Select
              value={barangayId}
              onValueChange={(value) => {
                setBarangayId(value)
                setDevelopmentId('')
              }}
              disabled={!cityId || barangays.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Barangays" />
              </SelectTrigger>
              <SelectContent>
                {barangays.map((barangay) => (
                  <SelectItem key={barangay.id} value={barangay.psgcCode}>
                    {barangay.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Development</Label>
            <Select
              value={developmentId}
              onValueChange={setDevelopmentId}
              disabled={!barangayId || developments.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Developments" />
              </SelectTrigger>
              <SelectContent>
                {developments.map((dev) => (
                  <SelectItem key={dev.id} value={dev.id.toString()}>
                    {dev.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Price Range (₱)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bedrooms / Bathrooms</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Bed"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Bath"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply
            </Button>
            <Button onClick={handleClearFilters} variant="outline" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
