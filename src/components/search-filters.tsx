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
import { Filter, X, Share } from 'lucide-react'
import { toast } from 'sonner'
import type { Barangay as PayloadBarangay, Development } from '@/payload-types'

type Barangay = PayloadBarangay & { psgcCode: string }


type SearchFiltersProps = {
  currentFilters: {
    listingType?: string
    transactionType?: string
    provinceId?: string
    cityId?: string
    barangayId?: string
    developmentId?: number
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
    bathrooms?: number
  }
  availableLocations?: Record<string, {
    id: string
    name: string
    cities: Record<string, {
      id: string
      name: string
      barangays: { id: string, name: string }[]
    }>
  }>
}

export function SearchFilters({ availableLocations = {}, currentFilters }: SearchFiltersProps) {
  const router = useRouter()
  const _searchParams = useSearchParams()

  const [listingType, setListingType] = useState(currentFilters.listingType || 'both')
  const [transactionType, setTransactionType] = useState(currentFilters.transactionType || '')
  const [provinceId, setProvinceId] = useState(currentFilters.provinceId?.toString() || '')
  const [cityId, setCityId] = useState(currentFilters.cityId?.toString() || '')
  const [barangayId, setBarangayId] = useState(currentFilters.barangayId?.toString() || '')
  const [developmentId, setDevelopmentId] = useState(currentFilters.developmentId?.toString() || '')
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice?.toString() || '')
  const [bedrooms, setBedrooms] = useState(currentFilters.bedrooms?.toString() || '')
  const [bathrooms, setBathrooms] = useState(currentFilters.bathrooms?.toString() || '')

  const [developments, setDevelopments] = useState<Development[]>([])

  // No need for effects to fetch data anymore, we derive from availableLocations

  const provinces = Object.values(availableLocations).sort((a, b) => a.name.localeCompare(b.name))
  const cities = provinceId && availableLocations[provinceId]
    ? Object.values(availableLocations[provinceId].cities).sort((a, b) => a.name.localeCompare(b.name))
    : []

  const filteredBarangays = provinceId && cityId && availableLocations[provinceId]?.cities[cityId]
    ? availableLocations[provinceId].cities[cityId].barangays.sort((a: any, b: any) =>
      (a.name || '').localeCompare(b.name || ''))
    : []

  // Fetch developments when barangay changes
  useEffect(() => {
    if (barangayId) {
      fetch(`/api/developments?where[barangay][equals]=${barangayId}&limit=100`)
        .then((res) => res.json())
        .then((data) => {
          // Adapt the response from payload API to what the component expects
          const docs = data.docs || []
          setDevelopments(docs)
        })
        .catch((err) => console.error('Error fetching developments:', err))
    } else {
      setDevelopments([])
    }
  }, [barangayId])

  const handleApplyFilters = () => {
    const params = new URLSearchParams()

    if (listingType && listingType !== 'both') params.set('listingType', listingType)
    if (transactionType) params.set('transactionType', transactionType)
    if (provinceId) params.set('provinceId', provinceId)
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
    setProvinceId('')
    setCityId('')
    setBarangayId('')
    setDevelopmentId('')
    setMinPrice('')
    setMaxPrice('')
    setBedrooms('')
    setBathrooms('')
    router.push('/mls')
  }

  const handleShareSearch = async () => {
    // Auto-generate title based on current date
    const title = `Curated Search - ${new Date().toLocaleDateString()}`

    // Collect current filter values
    const filters = {
      listingType,
      transactionType,
      provinceId,
      cityId,
      barangayId,
      developmentId,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
    }

    try {
      const response = await fetch('/api/shared-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, filters }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create shared link')
      }

      // Copy the share URL to clipboard and show success
      try {
        await navigator.clipboard.writeText(data.shareUrl)
        toast.success('Link copied! Ready to share curated listings.')
      } catch {
        // Fallback if clipboard fails (e.g., document not focused)
        prompt('Copy this link to share:', data.shareUrl)
        toast.success('Share link ready!')
      }
    } catch (error) {
      console.error('Share error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create shared link')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Search Filters
          </div>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleShareSearch} className="gap-2">
          <Share className="h-4 w-4" />
          Share Curated Search
        </Button>
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
            <Label>Province</Label>
            <Select value={provinceId} onValueChange={(value) => {
              setProvinceId(value)
              setCityId('')
              setBarangayId('')
              setDevelopmentId('')
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((prov) => (
                  <SelectItem key={prov.id} value={prov.id}>
                    {prov.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Select
              value={cityId}
              onValueChange={(value) => {
                setCityId(value)
                setBarangayId('')
                setDevelopmentId('')
              }}
              disabled={!provinceId || cities.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
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
              disabled={!cityId || filteredBarangays.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Barangays" />
              </SelectTrigger>
              <SelectContent>
                {filteredBarangays.map((barangay: any) => (
                  <SelectItem key={barangay.id} value={barangay.id}>
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
                  <SelectItem key={dev.id} value={String(dev.id)}>
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
    </Card >
  )
}
