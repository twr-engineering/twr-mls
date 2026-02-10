'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Listing } from '@/payload-types'

type Option = {
  id: string | number
  label: string
}

type ApiDoc = {
  id: string | number
  name?: string
  slug?: string
}

type EditListingFormProps = {
  listing: Listing
}

export function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter()

  // Basic fields
  const [title, setTitle] = useState('')
  const [fullAddress, setFullAddress] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')

  // Relationships / options
  const [cities, setCities] = useState<Option[]>([])
  const [barangays, setBarangays] = useState<Option[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [types, setTypes] = useState<Option[]>([])

  const [cityId, setCityId] = useState<string>('')
  const [barangayId, setBarangayId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [typeId, setTypeId] = useState<string>('')
  // Allow selecting one or both transaction types (sale, rent)
  const [transactionTypes, setTransactionTypes] = useState<string[]>([])

  // Property details
  const [floorAreaSqm, setFloorAreaSqm] = useState<string>('')
  const [lotAreaSqm, setLotAreaSqm] = useState<string>('')
  const [bedrooms, setBedrooms] = useState<string>('')
  const [bathrooms, setBathrooms] = useState<string>('')
  const [parkingSlots, setParkingSlots] = useState<string>('')
  const [furnishing, setFurnishing] = useState<string>('')
  const [constructionYear, setConstructionYear] = useState<string>('')
  const [tenure, setTenure] = useState<string>('')

  // Pricing & Terms
  const [titleStatus, setTitleStatus] = useState<string>('')
  const [paymentTerm, setPaymentTerm] = useState<string>('') // single-select in UI; mapped to array in payload

  // Media (images)
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)

  // Wizard steps:
  // 1 = Location
  // 2 = Basic Info
  // 3 = Property Details
  // 4 = Pricing & Terms
  // 5 = Media
  // 6 = Status
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper to fetch options from Payload REST endpoints
  const fetchOptions = async (url: string, labelField: keyof ApiDoc = 'name'): Promise<Option[]> => {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) throw new Error(`Failed to load ${url}`)
    const data = await res.json()
    const docs: ApiDoc[] = data.docs || []
    return docs.map((doc) => ({
      id: doc.id,
      label: (doc[labelField] as string) || String(doc.id),
    }))
  }

  // Hydrate initial state from listing prop
  useEffect(() => {
    setTitle(listing.title || '')
    setFullAddress(listing.fullAddress || '')
    setPrice(listing.price ? String(listing.price) : '')
    setDescription(
      typeof listing.description === 'string'
        ? listing.description
        : listing.description
          ? JSON.stringify(listing.description)
          : '',
    )

    // Relationships: support both ID and populated objects
    const cityVal =
      listing.city && typeof listing.city === 'object' && 'id' in listing.city
        ? String((listing.city as any).id) // eslint-disable-line @typescript-eslint/no-explicit-any
        : listing.city
          ? String(listing.city)
          : ''
    const barangayVal =
      listing.barangay && typeof listing.barangay === 'object' && 'id' in listing.barangay
        ? String((listing.barangay as any).id) // eslint-disable-line @typescript-eslint/no-explicit-any
        : listing.barangay
          ? String(listing.barangay)
          : ''

    const categoryVal =
      listing.propertyCategory &&
        typeof listing.propertyCategory === 'object' &&
        'id' in listing.propertyCategory
        ? String((listing.propertyCategory as any).id) // eslint-disable-line @typescript-eslint/no-explicit-any
        : listing.propertyCategory
          ? String(listing.propertyCategory)
          : ''

    const typeVal =
      listing.propertyType && typeof listing.propertyType === 'object' && 'id' in listing.propertyType
        ? String((listing.propertyType as any).id) // eslint-disable-line @typescript-eslint/no-explicit-any
        : listing.propertyType
          ? String(listing.propertyType)
          : ''

    setCityId(cityVal)
    setBarangayId(barangayVal)
    setCategoryId(categoryVal)
    setTypeId(typeVal)

    setTransactionTypes(
      Array.isArray(listing.transactionType) ? (listing.transactionType as string[]) : [],
    )

    setFloorAreaSqm(listing.floorAreaSqm ? String(listing.floorAreaSqm) : '')
    setLotAreaSqm(listing.lotAreaSqm ? String(listing.lotAreaSqm) : '')
    setBedrooms(listing.bedrooms ? String(listing.bedrooms) : '')
    setBathrooms(listing.bathrooms ? String(listing.bathrooms) : '')
    setParkingSlots(listing.parkingSlots ? String(listing.parkingSlots) : '')
    setFurnishing(listing.furnishing || '')
    setConstructionYear(listing.constructionYear ? String(listing.constructionYear) : '')
    setTenure(listing.tenure || '')

    setTitleStatus(listing.titleStatus || '')
    // For now, take the first payment term if any
    const firstPayment =
      Array.isArray(listing.paymentTerms) && listing.paymentTerms.length > 0
        ? String(listing.paymentTerms[0])
        : ''
    setPaymentTerm(firstPayment)
  }, [listing])

  // Load base options on mount
  useEffect(() => {
    void (async () => {
      try {
        const [cityOpts, categoryOpts] = await Promise.all([
          fetchOptions('/api/cities?limit=200&where[isActive][equals]=true'),
          fetchOptions('/api/property-categories?limit=50&where[isActive][equals]=true'),
        ])
        setCities(cityOpts)
        setCategories(categoryOpts)
      } catch (e) {
        console.error(e)
        setError('Failed to load reference data. Please refresh and try again.')
      }
    })()
  }, [])

  // Load barangays when city changes
  useEffect(() => {
    if (!cityId) {
      setBarangays([])
      setBarangayId('')
      return
    }

    void (async () => {
      try {
        const brgys = await fetchOptions(
          `/api/barangays?limit=500&where[city][equals]=${encodeURIComponent(cityId)}&where[isActive][equals]=true`,
        )
        setBarangays(brgys)
        // Keep current barangay if still valid, else reset
      } catch (e) {
        console.error(e)
        setError('Failed to load barangays for selected city.')
      }
    })()
  }, [cityId])

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
      } catch (e) {
        console.error(e)
        setError('Failed to load property types for selected category.')
      }
    })()
  }, [categoryId])

  const goNext = () => {
    setStep((prev) => (prev < 6 ? ((prev + 1) as 2 | 3 | 4 | 5 | 6) : prev))
  }

  const goBack = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4 | 5) : prev))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // 1) Upload any newly added images
      const newImageIds: Array<string | number> = []
      if (imageFiles && imageFiles.length > 0) {
        for (const file of Array.from(imageFiles)) {
          const formData = new FormData()
          formData.append('file', file)
          if (title) {
            formData.append('alt', title)
          }

          const uploadRes = await fetch('/api/media', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          })

          if (!uploadRes.ok) {
            const data = await uploadRes.json().catch(() => null)
            const msg =
              (data && (data.message || data.error)) ||
              `Failed to upload image "${file.name}" (status ${uploadRes.status})`
            throw new Error(msg)
          }

          const uploaded = await uploadRes.json()
          const mediaId = uploaded?.doc?.id ?? uploaded?.id
          if (mediaId) {
            newImageIds.push(mediaId)
          }
        }
      }

      // Existing images (keep them)
      const existingImageIds: Array<string | number> = Array.isArray(listing.images)
        ? (listing.images as any[]) // eslint-disable-line @typescript-eslint/no-explicit-any
          .map((img) =>
            img && typeof img === 'object' && 'id' in img ? (img as any).id : img, // eslint-disable-line @typescript-eslint/no-explicit-any
          )
          .filter(Boolean)
        : []

      const payloadBody = {
        title,
        fullAddress,
        price: price ? Number(price) : null,
        description,
        city: cityId || null,
        barangay: barangayId || null,
        propertyCategory: categoryId || null,
        propertyType: typeId || null,
        transactionType: transactionTypes,
        floorAreaSqm: floorAreaSqm ? Number(floorAreaSqm) : null,
        lotAreaSqm: lotAreaSqm ? Number(lotAreaSqm) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        parkingSlots: parkingSlots ? Number(parkingSlots) : null,
        furnishing: furnishing || null,
        constructionYear: constructionYear ? Number(constructionYear) : null,
        tenure: tenure || null,
        titleStatus: titleStatus || null,
        paymentTerms: paymentTerm ? [paymentTerm] : [],
        images: [...existingImageIds, ...newImageIds],
      }

      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
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
          `Failed to update listing (status ${res.status})`
        throw new Error(msg)
      }

      // After update, go back to listings
      router.push('/listings')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to update listing')
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
            <span className={step === 6 ? 'text-foreground' : ''}>6. Status</span>
          </div>

          {/* STEP 1: Location */}
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
                    <Label>City</Label>
                    <Select
                      value={cityId}
                      onValueChange={(val) => setCityId(val)}
                      disabled={isLoading || cities.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Barangay</Label>
                    <Select
                      value={barangayId}
                      onValueChange={(val) => setBarangayId(val)}
                      disabled={isLoading || !cityId || barangays.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={cityId ? 'Select barangay' : 'Select city first'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {barangays.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Title */}
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
              </div>

              {/* Property Classification */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold">Property Classification</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={categoryId}
                      onValueChange={(val) => setCategoryId(val)}
                      disabled={isLoading || categories.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Type</Label>
                    <Select
                      value={typeId}
                      onValueChange={(val) => setTypeId(val)}
                      disabled={isLoading || !categoryId || types.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={categoryId ? 'Select type' : 'Select category first'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Transaction */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold">Transaction</h2>
                <div className="max-w-xs space-y-2">
                  <Label>Transaction Type</Label>
                  <div className="flex flex-col gap-1 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3 w-3"
                        disabled={isLoading}
                        checked={transactionTypes.includes('sale')}
                        onChange={(e) => {
                          setTransactionTypes((prev) =>
                            e.target.checked
                              ? Array.from(new Set([...prev, 'sale']))
                              : prev.filter((v) => v !== 'sale'),
                          )
                        }}
                      />
                      <span>For Sale</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3 w-3"
                        disabled={isLoading}
                        checked={transactionTypes.includes('rent')}
                        onChange={(e) => {
                          setTransactionTypes((prev) =>
                            e.target.checked
                              ? Array.from(new Set([...prev, 'rent']))
                              : prev.filter((v) => v !== 'rent'),
                          )
                        }}
                      />
                      <span>For Rent</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Property Details */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="titleDetails">Title</Label>
                  <Input
                    id="titleDetails"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter listing title"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the property, key selling points, etc."
                  disabled={isLoading}
                />
              </div>

              {/* Areas */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="floorAreaSqm">Floor Area (sqm)</Label>
                  <Input
                    id="floorAreaSqm"
                    type="number"
                    min={0}
                    value={floorAreaSqm}
                    onChange={(e) => setFloorAreaSqm(e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g., 80"
                  />
                </div>
                <div>
                  <Label htmlFor="lotAreaSqm">Lot Area (sqm)</Label>
                  <Input
                    id="lotAreaSqm"
                    type="number"
                    min={0}
                    value={lotAreaSqm}
                    onChange={(e) => setLotAreaSqm(e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g., 150"
                  />
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
                    placeholder="e.g., 3"
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
                    placeholder="e.g., 2"
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
                    placeholder="e.g., 1"
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
                      <SelectValue placeholder="Select furnishing" />
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
                    placeholder="e.g., 2015"
                  />
                </div>
                <div>
                  <Label>Tenure</Label>
                  <Select value={tenure} onValueChange={(val) => setTenure(val)} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freehold">Freehold</SelectItem>
                      <SelectItem value="leasehold">Leasehold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Pricing & Terms */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="price">Price (PHP)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={1000}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Title Status & Payment Terms */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Title Status */}
                  <div>
                    <Label>Title Status</Label>
                    <Select
                      value={titleStatus}
                      onValueChange={(val) => setTitleStatus(val)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select title status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clean">Clean Title</SelectItem>
                        <SelectItem value="mortgaged">Mortgaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Terms (single-select dropdown in UI) */}
                  <div>
                    <Label>Payment Terms</Label>
                    <Select
                      value={paymentTerm}
                      onValueChange={(val) => setPaymentTerm(val)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Financing</SelectItem>
                        <SelectItem value="pagibig">Pag-IBIG</SelectItem>
                        <SelectItem value="deferred">Deferred Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Media */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm">
                Upload additional images to attach to this listing. Existing images will be kept.
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
                {imageFiles && imageFiles.length > 0 && (
                  <ul className="text-xs text-muted-foreground list-disc pl-4">
                    {Array.from(imageFiles).map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Status (read-only hint for now; agents change via admin if needed) */}
          {step === 6 && (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Status changes (submitted, needs revision, published, rejected) are controlled by the
                approval workflow in the admin panel. This form focuses on content edits.
              </p>
              <div className="space-y-1 text-xs">
                <p>
                  <strong>Current status:</strong> {listing.status || 'draft'}
                </p>
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
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

