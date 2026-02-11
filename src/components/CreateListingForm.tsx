'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from './ui/searchable-select'
import { MultiSelect, Option } from './ui/multi-select'

type ListingOption = {
  id: string | number
  label: string
  code?: string
  type?: string // 'Mun', 'City', etc.
}

type ApiDoc = {
  id: string | number
  name?: string
  slug?: string
  psgcCode?: string
}

export type ListingFormData = {
  title?: string
  fullAddress?: string
  price?: number
  description?: string
  provinceId?: string | number
  cityId?: string | number
  barangayId?: string | number
  developmentId?: string | number
  propertyCategoryId?: string | number
  propertyTypeId?: string | number
  propertySubtypeId?: string | number
  transactionType?: string[] | string
  floorAreaSqm?: number
  lotAreaSqm?: number
  minFloorAreaSqm?: number
  minLotAreaSqm?: number
  bedrooms?: number
  bathrooms?: number
  parkingSlots?: number
  furnishing?: string
  constructionYear?: number
  tenure?: string
  titleStatus?: string
  paymentTerms?: string[]
  modelName?: string
  indicativePriceMin?: number
  indicativePriceMax?: number
  standardInclusions?: any
  presellingNotes?: string
  images?: any[]
}

type CreateListingFormProps = {
  initialData?: ListingFormData
  listingId?: string
}

export function CreateListingForm({ initialData, listingId }: CreateListingFormProps) {
  const router = useRouter()

  // Basic fields
  const [title, setTitle] = useState(initialData?.title || '')
  const [fullAddress, setFullAddress] = useState(initialData?.fullAddress || '')
  // Store price as string with commas for display
  const [price, setPrice] = useState(initialData?.price ? initialData.price.toLocaleString() : '')
  const [description, setDescription] = useState(initialData?.description || '')

  // Relationships / options
  const [provinces, setProvinces] = useState<ListingOption[]>([])
  const [cities, setCities] = useState<ListingOption[]>([])
  const [barangays, setBarangays] = useState<ListingOption[]>([])
  const [developments, setDevelopments] = useState<ListingOption[]>([])
  const [categories, setCategories] = useState<ListingOption[]>([])
  const [types, setTypes] = useState<ListingOption[]>([])
  const [subtypes, setSubtypes] = useState<ListingOption[]>([])

  // Location State (Payload IDs for filtering UI)
  const [provinceId, setProvinceId] = useState<string>(initialData?.provinceId?.toString() || '')
  const [cityId, setCityId] = useState<string>(initialData?.cityId?.toString() || '')
  const [barangayId, setBarangayId] = useState<string>(initialData?.barangayId?.toString() || '')
  const [developmentId, setDevelopmentId] = useState<string>(initialData?.developmentId?.toString() || '')

  const [categoryId, setCategoryId] = useState<string>(initialData?.propertyCategoryId?.toString() || '')
  const [typeId, setTypeId] = useState<string>(initialData?.propertyTypeId?.toString() || '')
  const [subtypeId, setSubtypeId] = useState<string>(initialData?.propertySubtypeId?.toString() || '')

  // Allow selecting one or both transaction types (sale, rent)
  // Handle both array and string (legacy)
  // User requested simplify to multi-select, but schema supports multiple.
  // We will use the MultiSelect component (array state).
  const [transactionTypes, setTransactionTypes] = useState<string[]>(
    Array.isArray(initialData?.transactionType)
      ? initialData.transactionType
      : initialData?.transactionType
        ? [initialData.transactionType]
        : []
  )


  // Property details
  const [floorAreaSqm, setFloorAreaSqm] = useState<string>(initialData?.floorAreaSqm?.toString() || '')
  const [lotAreaSqm, setLotAreaSqm] = useState<string>(initialData?.lotAreaSqm?.toString() || '')
  const [minFloorAreaSqm, setMinFloorAreaSqm] = useState<string>(initialData?.minFloorAreaSqm?.toString() || '')
  const [minLotAreaSqm, setMinLotAreaSqm] = useState<string>(initialData?.minLotAreaSqm?.toString() || '')
  const [bedrooms, setBedrooms] = useState<string>(initialData?.bedrooms?.toString() || '')
  const [bathrooms, setBathrooms] = useState<string>(initialData?.bathrooms?.toString() || '')
  const [parkingSlots, setParkingSlots] = useState<string>(initialData?.parkingSlots?.toString() || '')
  const [furnishing, setFurnishing] = useState<string>(initialData?.furnishing || '')
  const [constructionYear, setConstructionYear] = useState<string>(initialData?.constructionYear?.toString() || '')
  const [tenure, setTenure] = useState<string>(initialData?.tenure || '')

  // Pricing & Terms
  const [titleStatus, setTitleStatus] = useState<string>(initialData?.titleStatus || '')

  // Payment terms - Multi-select
  const [paymentTerms, setPaymentTerms] = useState<string[]>(
    initialData?.paymentTerms || []
  )


  // Media (images)
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)
  const [existingImages, setExistingImages] = useState<any[]>(initialData?.images || [])

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch options helper
  const fetchOptions = async (url: string, labelField: keyof ApiDoc = 'name'): Promise<ListingOption[]> => {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) throw new Error(`Failed to load ${url}`)
    const data = await res.json()
    const docs: ApiDoc[] = data.docs || []
    return docs.map((doc) => ({
      id: doc.id,
      label: (doc[labelField] as string) || String(doc.id),
      code: doc.psgcCode
    }))
  }

  // Load base options on mount
  useEffect(() => {
    // 1. Fetch Location Data (Provinces)
    const loadProvinces = async () => {
      try {
        const res = await fetch('https://psgc.cloud/api/provinces')
        if (!res.ok) throw new Error('Failed to fetch provinces')
        const data = await res.json()
        // Sort alphabetically
        data.sort((a: any, b: any) => a.name.localeCompare(b.name))

        const provOpts = data.map((p: any) => ({
          id: p.code,
          label: p.name,
          code: p.code
        }))
        setProvinces(provOpts)
      } catch (e) {
        console.error('Province fetch error:', e)
        setError('Failed to load provinces from PSGC API.')
      }
    }

    // 2. Fetch Internal Data (Categories)
    const loadCategories = async () => {
      try {
        const categoryOpts = await fetchOptions('/api/property-categories?limit=50&where[isActive][equals]=true')
        setCategories(categoryOpts)
      } catch (e) {
        console.error('Internal data fetch error:', e)
        setError('Failed to load validation data (Categories).')
      }
    }

    setIsLoading(true)
    Promise.all([loadProvinces(), loadCategories()]).finally(() => setIsLoading(false))
  }, [])

  // Load cities when province changes
  useEffect(() => {
    if (!provinceId) {
      setCities([])
      setCityId('')
      setBarangays([])
      setBarangayId('')
      setDevelopments([])
      setDevelopmentId('')
      return
    }

    void (async () => {
      try {
        // Fetch Cities/Municipalities for the selected province
        const res = await fetch(`https://psgc.cloud/api/provinces/${provinceId}/cities-municipalities`)
        if (!res.ok) throw new Error('Failed to fetch cities')
        const data = await res.json()
        // Sort alphabetically
        data.sort((a: any, b: any) => a.name.localeCompare(b.name))

        const cityOpts = data.map((c: any) => ({
          id: c.code,
          label: c.name,
          code: c.code,
          type: c.type // capture type (City, Mun, SubMun)
        }))
        setCities(cityOpts)
        setCityId('')
      } catch (e) {
        console.error('City fetch error:', e)
        setError('Failed to load cities for selected province.')
      }
    })()
  }, [provinceId])

  // Load barangays when city (PSGC Code) changes
  useEffect(() => {
    if (!cityId) {
      setBarangays([])
      setBarangayId('')
      setDevelopments([])
      setDevelopmentId('')
      return
    }

    void (async () => {
      try {
        // Determine if it's a city or municipality
        const selectedCity = cities.find(c => String(c.id) === String(cityId))
        const isMunicipality = selectedCity?.type === 'Mun'

        // Fetch Barangays from PSGC API
        // Endpoint differs for City vs Municipality
        const endpoint = isMunicipality
          ? `https://psgc.cloud/api/municipalities/${cityId}/barangays`
          : `https://psgc.cloud/api/cities/${cityId}/barangays`

        const res = await fetch(endpoint)
        if (!res.ok) {
          // Fallback: if one fails, try the other? 
          // Or just throw. Let's try to be robust. 
          // If we guessed wrong or type is missing, maybe try the other.
          // But relying on type should be enough if PSGC is consistent.
          // Let's stick to type for now.
          throw new Error(`Failed to fetch barangays (Status ${res.status})`)
        }
        const data = await res.json()
        // Sort alphabetically
        data.sort((a: any, b: any) => a.name.localeCompare(b.name))

        const brgyOpts = data.map((b: any) => ({
          id: b.code,
          label: b.name,
          code: b.code
        }))
        setBarangays(brgyOpts)
        setBarangayId('')
        setDevelopments([])
        setDevelopmentId('')
      } catch (e) {
        console.error(e)
        setError('Failed to load barangays for selected city.')
      }
    })()
  }, [cityId])

  // Load developments when barangay changes
  useEffect(() => {
    if (!barangayId) {
      setDevelopments([])
      setDevelopmentId('')
      return
    }

    void (async () => {
      try {
        // Use barangayId (which is the PSGC code) to filter developments
        const devOpts = await fetchOptions(
          `/api/developments?where[barangay][equals]=${encodeURIComponent(barangayId)}&limit=100&where[isActive][equals]=true`,
          'name'
        )
        setDevelopments(devOpts)
        setDevelopmentId('')
      } catch (e) {
        console.error(e)
        setError('Failed to load developments for selected barangay.')
      }
    })()
  }, [barangayId])

  // Load property types when category changes
  useEffect(() => {
    if (!categoryId) {
      setTypes([])
      setTypeId('')
      return
    }

    void (async () => {
      try {
        const typeOpts = await fetchOptions(
          `/api/property-types?limit=200&where[propertyCategory][equals]=${encodeURIComponent(
            categoryId,
          )}&where[isActive][equals]=true`,
        )
        setTypes(typeOpts)
        setTypeId('')
      } catch (e) {
        console.error(e)
        setError('Failed to load property types for selected category.')
      }
    })()
  }, [categoryId])

  // Load property subtypes when type changes
  useEffect(() => {
    if (!typeId) {
      setSubtypes([])
      setSubtypeId('')
      return
    }

    void (async () => {
      try {
        const url = `/api/property-subtypes?limit=200&where[propertyType][equals]=${encodeURIComponent(
          typeId,
        )}&where[isActive][equals]=true`
        const opts = await fetchOptions(url)
        setSubtypes(opts)
        setSubtypeId('')
      } catch (e) {
        console.error(e)
        setError('Failed to load property subtypes.')
      }
    })()
  }, [typeId])

  const validateCurrentStep = () => {
    if (step === 1) {
      if (!fullAddress || !provinceId || !cityId || !barangayId) {
        setError('Please fill in all location fields (Address, Province, City, Barangay).')
        return false
      }
    }
    if (step === 2) {
      if (!title) {
        setError('Listing Title is required.')
        return false
      }
    }
    if (step === 3) {
      if (!categoryId || !typeId) {
        setError('Property Category and Type are required.')
        return false
      }
    }
    if (step === 4) {
      if (!price) {
        setError('Price is required.')
        return false
      }
    }
    setError(null)
    return true
  }

  const goNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => (prev < 6 ? ((prev + 1) as 2 | 3 | 4 | 5 | 6) : prev))
    }
  }

  const goBack = () => {
    setError(null)
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4 | 5) : prev))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // In PSGC API mode, the IDs ARE the codes
      const cityPsgc = cityId || null
      const barangayPsgc = barangayId || null

      // 1) Upload images to media collection (if any selected)
      const newImageIds: Array<string | number> = []
      if (imageFiles && imageFiles.length > 0) {
        for (const file of Array.from(imageFiles)) {
          const formData = new FormData()

          // Append alt text FIRST (good practice for some parsers)
          // Ensure it's never empty
          const safeAlt = title || file.name || 'Property Image'
          formData.append('alt', safeAlt)

          // Append file
          formData.append('file', file)

          const uploadRes = await fetch('/api/media', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          })

          if (!uploadRes.ok) {
            const data = await uploadRes.json().catch(() => null)
            console.error('Upload error response:', data)
            let msg = `Failed to upload image "${file.name}" (status ${uploadRes.status})`

            if (data) {
              if (data.errors && Array.isArray(data.errors)) {
                msg = data.errors.map((e: any) => e.message).join(', ')
              } else if (data.message) {
                msg = data.message
              } else if (data.error) {
                msg = data.error
              }
            }
            throw new Error(msg)
          }

          const uploaded = await uploadRes.json()
          const mediaId = uploaded?.doc?.id ?? uploaded?.id
          if (mediaId) {
            newImageIds.push(mediaId)
          }
        }
      }

      // Combine existing images (that verify weren't removed) with new uploads
      const finalImageIds = [
        ...existingImages.map((img) => img.id || img),
        ...newImageIds
      ]

      // 2) Create listing with references to uploaded images
      const payloadBody = {
        title,
        fullAddress,
        fullAddress,
        price: price ? Number(price.replace(/,/g, '')) : null,
        description,
        description,
        city: cityPsgc, // Send PSGC Code
        cityName: cities.find((c) => String(c.id) === String(cityId))?.label || '',
        barangay: barangayPsgc, // Send PSGC Code
        barangayName: barangays.find((b) => String(b.id) === String(barangayId))?.label || '',
        province: provinceId,
        provinceName: provinces.find((p) => String(p.id) === String(provinceId))?.label || '',
        development: developmentId ? Number(developmentId) : null,
        propertyCategory: categoryId ? Number(categoryId) : null,
        propertyType: typeId ? Number(typeId) : null,
        propertySubtype: subtypeId ? Number(subtypeId) : null,
        transactionType: transactionTypes,
        floorAreaSqm: floorAreaSqm ? Number(floorAreaSqm) : null,
        lotAreaSqm: lotAreaSqm ? Number(lotAreaSqm) : null,
        minFloorAreaSqm: minFloorAreaSqm ? Number(minFloorAreaSqm) : null,
        minLotAreaSqm: minLotAreaSqm ? Number(minLotAreaSqm) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        parkingSlots: parkingSlots ? Number(parkingSlots) : null,
        furnishing: furnishing || null,
        constructionYear: constructionYear ? Number(constructionYear) : null,
        tenure: tenure || null,
        titleStatus: titleStatus || null,
        // Payload field is hasMany; we send an array
        paymentTerms: paymentTerms,
        // listingType and status defaults are handled by backend (resale + draft for agents)
        images: finalImageIds, // Send merged list
      }

      const endpoint = listingId ? `/api/listings/${listingId}` : '/api/listings/create'
      const method = listingId ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payloadBody),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const msg =
          (data && (data.message || data.error)) ||
          `Failed to save listing (status ${res.status})`
        throw new Error(msg)
      }

      const saved = await res.json()
      const id = saved?.doc?.id ?? saved?.id ?? listingId

      // After creation/update, send them to Payload admin edit view or back to listings
      if (id) {
        // If updated, maybe just go back to listings or show success
        router.push('/listings')
      } else {
        router.push('/listings')
      }
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to create listing')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
          )}

          {/* Step indicator */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className={step === 1 ? 'text-foreground' : ''}>1. Location</span>
            <span>›</span>
            <span className={step === 2 ? 'text-foreground' : ''}>2. Basic Info</span>
            <span>›</span>
            <span className={step === 3 ? 'text-foreground' : ''}>3. Property Details</span>
            <span>›</span>
            <span className={step === 4 ? 'text-foreground' : ''}>4. Pricing &amp; Terms</span>
            <span>›</span>
            <span className={step === 5 ? 'text-foreground' : ''}>5. Media</span>
            <span>›</span>
            <span className={step === 6 ? 'text-foreground' : ''}>6. Admin / Status</span>
          </div>

          {/* STEP 1: Location (matches first tab in Payload) */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullAddress">Full Address</Label>
                  <Input
                    id="fullAddress"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="Street, building, unit, etc."
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-semibold">Location</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Province</Label>
                    <SearchableSelect
                      options={provinces}
                      value={provinceId}
                      onChange={(val: string) => setProvinceId(val)}
                      placeholder="Select province"
                      searchPlaceholder="Search provinces..."
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label>City {cities.length === 0 && !isLoading && provinceId && <span className="text-xs text-destructive">(No cities loaded)</span>}</Label>
                    <SearchableSelect
                      options={cities}
                      value={cityId}
                      onChange={(val: string) => setCityId(val)}
                      placeholder={provinceId ? 'Select city' : 'Select province first'}
                      searchPlaceholder="Search cities..."
                      disabled={isLoading || !provinceId}
                    />
                  </div>

                  <div>
                    <Label>Barangay</Label>
                    <SearchableSelect
                      options={barangays}
                      value={barangayId}
                      onChange={(val: string) => setBarangayId(val)}
                      placeholder={cityId ? 'Select barangay' : 'Select city first'}
                      searchPlaceholder="Search barangays..."
                      disabled={isLoading || !cityId}
                    />
                  </div>
                </div>

                {/* Development Selector */}
                <div>
                  <Label>Development</Label>
                  <SearchableSelect
                    options={developments}
                    value={developmentId}
                    onChange={(val: string) => setDevelopmentId(val)}
                    placeholder={barangayId ? 'Select subdivision/development (optional)' : 'Select barangay first'}
                    searchPlaceholder="Search developments..."
                    disabled={isLoading || !barangayId}
                  />
                  {!barangayId && <p className="text-xs text-muted-foreground mt-1">Select a barangay to see available developments.</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Listing Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., 3BR Condo in Uptown CDO"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the property, key selling points, etc."
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Property Details */}
          {step === 3 && (
            <div className="space-y-6">

              {/* Property Classification */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Property Category <span className="text-destructive">*</span></Label>
                    <Select
                      value={categoryId}
                      onValueChange={(val) => setCategoryId(val)}
                      disabled={isLoading || categories.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a value" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Top-level category (e.g., Residential, Commercial)</p>
                  </div>

                  <div>
                    <Label>Property Type <span className="text-destructive">*</span></Label>
                    <Select
                      value={typeId}
                      onValueChange={(val) => setTypeId(val)}
                      disabled={isLoading || !categoryId || types.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a value" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Specific type within the selected category</p>
                  </div>

                  <div>
                    <Label>Property Subtype</Label>
                    <Select
                      value={subtypeId}
                      onValueChange={(val) => setSubtypeId(val)}
                      disabled={isLoading || !typeId || subtypes.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a value" />
                      </SelectTrigger>
                      <SelectContent>
                        {subtypes.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Optional subtype within the selected property type</p>
                  </div>
                </div>
              </div>

              {/* Areas */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="floorAreaSqm">Floor Area Sqm</Label>
                  <Input
                    id="floorAreaSqm"
                    type="number"
                    min={0}
                    value={floorAreaSqm}
                    onChange={(e) => setFloorAreaSqm(e.target.value)}
                    disabled={isLoading}
                    placeholder="Floor area (sqm)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">For condos, offices, buildings</p>
                </div>
                <div>
                  <Label htmlFor="lotAreaSqm">Lot Area Sqm</Label>
                  <Input
                    id="lotAreaSqm"
                    type="number"
                    min={0}
                    value={lotAreaSqm}
                    onChange={(e) => setLotAreaSqm(e.target.value)}
                    disabled={isLoading}
                    placeholder="Lot area (sqm)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">For lots, house-and-lot</p>
                </div>
              </div>

              {/* Min Areas */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="minFloorAreaSqm">Min Floor Area Sqm</Label>
                  <Input
                    id="minFloorAreaSqm"
                    type="number"
                    min={0}
                    value={minFloorAreaSqm}
                    onChange={(e) => setMinFloorAreaSqm(e.target.value)}
                    disabled={isLoading}
                    placeholder="Min Floor area (sqm)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum floor area (for filtering)</p>
                </div>
                <div>
                  <Label htmlFor="minLotAreaSqm">Min Lot Area Sqm</Label>
                  <Input
                    id="minLotAreaSqm"
                    type="number"
                    min={0}
                    value={minLotAreaSqm}
                    onChange={(e) => setMinLotAreaSqm(e.target.value)}
                    disabled={isLoading}
                    placeholder="Min Lot area (sqm)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum lot area (for filtering)</p>
                </div>
              </div>

              {/* Beds / Baths / Parking */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    disabled={isLoading}
                    placeholder="Bedrooms"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={0}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    disabled={isLoading}
                    placeholder="Bathrooms"
                  />
                </div>
                <div>
                  <Label htmlFor="parkingSlots">Parking Slots</Label>
                  <Input
                    id="parkingSlots"
                    type="number"
                    min={0}
                    value={parkingSlots}
                    onChange={(e) => setParkingSlots(e.target.value)}
                    disabled={isLoading}
                    placeholder="Parking slots"
                  />
                </div>
              </div>

              {/* Furnishing / Construction Year / Tenure */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Furnishing</Label>
                  <Select
                    value={furnishing}
                    onValueChange={(val) => setFurnishing(val)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unfurnished">Unfurnished</SelectItem>
                      <SelectItem value="semi_furnished">Semi-Furnished</SelectItem>
                      <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="constructionYear">Construction Year</Label>
                  <Input
                    id="constructionYear"
                    type="number"
                    min={1900}
                    max={2100}
                    value={constructionYear}
                    onChange={(e) => setConstructionYear(e.target.value)}
                    disabled={isLoading}
                    placeholder="Year built (e.g., 2020)"
                  />
                </div>
                <div>
                  <Label>Tenure</Label>
                  <Select
                    value={tenure}
                    onValueChange={(val) => setTenure(val)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freehold">Freehold</SelectItem>
                      <SelectItem value="leasehold">Leasehold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title Status */}
              <div>
                <Label>Title Status</Label>
                <Select
                  value={titleStatus}
                  onValueChange={(val) => setTitleStatus(val)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">Clean Title</SelectItem>
                    <SelectItem value="mortgaged">Mortgaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          )}

          {/* STEP 4: Pricing & Terms */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Transaction */}
              <div className="space-y-4">
                <div className="max-w-xs space-y-2">
                  <Label>Transaction Type <span className="text-destructive">*</span></Label>
                  <MultiSelect
                    options={[
                      { label: 'For Sale', value: 'sale' },
                      { label: 'For Rent', value: 'rent' },
                    ]}
                    selected={transactionTypes}
                    onChange={setTransactionTypes}
                    placeholder="Select transaction type"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="price">Price (PHP) <span className="text-destructive">*</span></Label>
                    <Input
                      id="price"
                      type="text"
                      value={price}
                      onChange={(e) => {
                        // Remove non-numeric chars except decimal
                        const rawValue = e.target.value.replace(/[^0-9.]/g, '')
                        if (rawValue === '') {
                          setPrice('')
                          return
                        }
                        // Parse and format
                        const number = parseFloat(rawValue)
                        if (!isNaN(number)) {
                          // Allow typing decimal point
                          if (rawValue.endsWith('.')) {
                            setPrice(number.toLocaleString() + '.')
                          } else if (rawValue.includes('.') && rawValue.endsWith('0')) {
                            // Handle cases like "1.0"
                            setPrice(rawValue)
                          } else {
                            setPrice(number.toLocaleString())
                          }
                        } else {
                          setPrice(rawValue)
                        }
                      }}
                      required
                      disabled={isLoading}
                      placeholder="Base price"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Payment Terms (Multi-select) */}
                  <div>
                    <Label>Payment Terms</Label>
                    <MultiSelect
                      options={[
                        { label: 'Cash', value: 'cash' },
                        { label: 'Bank Financing', value: 'bank' },
                        { label: 'Pag-IBIG', value: 'pagibig' },
                        { label: 'Deferred Payment', value: 'deferred' },
                      ]}
                      selected={paymentTerms}
                      onChange={setPaymentTerms}
                      placeholder="Select payment terms"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Media */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm">
                Upload images that will be attached to this listing. You can add more later from the
                admin interface if needed.
              </p>
              <div className="space-y-2">
                <Label htmlFor="images">Listing Images</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isLoading}
                  onChange={(e) => {
                    setImageFiles(e.target.files)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  You can select multiple image files. They will be uploaded to the <code>media</code>{' '}
                  collection and linked to this listing.
                </p>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Current Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingImages.map((img: any, i) => (
                        <div key={img.id || i} className="relative aspect-video rounded-lg overflow-hidden border bg-muted group">
                          <img
                            src={img.url ? (img.url.startsWith('/api') ? img.url.replace('/api/media/file', '/media') : img.url) : 'https://placehold.co/400'}
                            alt={img.alt || 'Listing image'}
                            className="object-cover w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = [...existingImages]
                              newImages.splice(i, 1)
                              setExistingImages(newImages)
                            }}
                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {imageFiles && imageFiles.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground pt-4 border-t w-full block">New Uploads</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Array.from(imageFiles).map((file, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-muted group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="object-cover w-full h-full"
                            onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Admin / Status (review before create) */}
          {step === 6 && (
            <div className="space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the property, key selling points, etc."
                  disabled={isLoading}
                />
              </div>

              {/* Simple review summary */}
              <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Status:</strong> draft (will be set automatically)
                </p>
                <p>
                  <strong>Title:</strong> {title || '—'}
                </p>
                <p>
                  <strong>Address:</strong> {fullAddress || '—'}
                </p>
                <p>
                  <strong>Price:</strong> {price || '—'}
                </p>
                <p><strong>City:</strong> {cities.find(c => String(c.id) === String(cityId))?.label || '—'}</p>
                <p><strong>Barangay:</strong> {barangays.find(c => String(c.id) === String(barangayId))?.label || '—'}</p>
                <p><strong>Development:</strong> {developments.find(c => String(c.id) === String(developmentId))?.label || '—'}</p>
                {existingImages.length > 0 && (
                  <div className="pt-2">
                    <p className="mb-1"><strong>Current Images ({existingImages.length}):</strong></p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {existingImages.map((img: any, i) => (
                        <div key={img.id || i} className="relative h-16 w-24 flex-shrink-0 rounded overflow-hidden border">
                          <img
                            src={img.url ? (img.url.startsWith('/api') ? img.url.replace('/api/media/file', '/media') : img.url) : 'https://placehold.co/400'}
                            alt={img.alt || 'Listing image'}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {imageFiles && imageFiles.length > 0 && (
                  <div className="pt-2">
                    <p className="mb-1"><strong>New Images ({imageFiles.length}):</strong></p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {Array.from(imageFiles).map((file, i) => (
                        <div key={i} className="relative h-16 w-24 flex-shrink-0 rounded overflow-hidden border">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation / actions */}
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => router.push('/listings')}
            >
              Cancel
            </Button>

            <div className="flex gap-2">
              {step > 1 && (
                <Button type="button" variant="outline" disabled={isLoading} onClick={goBack}>
                  Back
                </Button>
              )}

              {step < 6 && (
                <Button type="button" disabled={isLoading} onClick={goNext}>
                  Next
                </Button>
              )}

              {step === 6 && (
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? (listingId ? 'Updating...' : 'Creating...')
                    : (listingId ? 'Update Listing' : 'Create Listing')
                  }
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card >
  )
}
