'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { City, Barangay, Development, Province } from '@/payload-types'
import { ImageUpload } from '@/components/image-upload'
import { PropertyClassificationSelect } from '@/components/property-classification-select'

type ListingFormData = z.infer<typeof listingSchema>

type ListingFormProps = {
  cities: City[]
  initialData?: Partial<ListingFormData> & { images?: number[] }
  listingId?: string
}

const baseListingSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(120),
  description: z.any().optional(),
  propertyCategoryId: z.number().min(1, 'Property category is required'),
  propertyTypeId: z.number().min(1, 'Property type is required'),
  propertySubtypeId: z.number().optional(),
  listingType: z.enum(['resale', 'preselling']),
  transactionType: z.enum(['sale', 'rent']),
  cityId: z.number().min(1, 'City is required'),
  barangayId: z.number().min(1, 'Barangay is required'),
  developmentId: z.number().optional(),
  fullAddress: z.string().min(10, 'Full address is required'),
  // Common fields
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  parkingSlots: z.number().optional(),
})

// Use a single schema with all fields, conditionally validate based on listingType
const listingSchema = baseListingSchema
  .extend({
    // Resale-specific fields
    price: z.number().optional(),
    pricePerSqm: z.number().optional(),
    floorAreaSqm: z.number().optional(),
    lotAreaSqm: z.number().optional(),
    furnishing: z.enum(['unfurnished', 'semi_furnished', 'fully_furnished']).optional(),
    constructionYear: z.number().optional(),
    tenure: z.enum(['freehold', 'leasehold']).optional(),
    titleStatus: z.enum(['clean', 'mortgaged']).optional(),
    // Preselling-specific fields
    modelName: z.string().optional(),
    indicativePriceMin: z.number().optional(),
    indicativePriceMax: z.number().optional(),
    minLotAreaSqm: z.number().optional(),
    minFloorAreaSqm: z.number().optional(),
    standardInclusions: z.any().optional(),
    presellingNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.listingType === 'resale') {
        return data.price !== undefined && data.price > 0
      }
      return true
    },
    {
      message: 'Price is required for resale listings',
      path: ['price'],
    },
  )
  .refine(
    (data) => {
      if (data.listingType === 'preselling') {
        return data.developmentId !== undefined && data.developmentId > 0
      }
      return true
    },
    {
      message: 'Development is required for preselling listings',
      path: ['developmentId'],
    },
  )

export function ListingForm({ cities, initialData, listingId }: ListingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [developments, setDevelopments] = useState<Development[]>([])
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [selectedBarangayId, setSelectedBarangayId] = useState<number | null>(null)
  const [imageIds, setImageIds] = useState<number[]>(initialData?.images || [])

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: initialData || {
      listingType: 'resale',
      transactionType: 'sale',
      price: 0,
    },
  })

  const listingType = form.watch('listingType')

  // Fetch provinces on mount
  useEffect(() => {
    fetch('/api/provinces')
      .then((res) => res.json())
      .then((data) => {
        setProvinces(data.docs || data)
      })
      .catch((err) => {
        console.error('Error fetching provinces:', err)
        toast.error('Failed to load provinces')
      })
  }, [])

  // Filter cities by selected province
  const filteredCities = selectedProvinceId
    ? cities.filter((city) => {
        if (typeof city.province === 'object' && city.province !== null) {
          return city.province.id === selectedProvinceId
        }
        return city.province === selectedProvinceId
      })
    : cities

  useEffect(() => {
    if (selectedCityId) {
      fetch(`/api/psgc/barangays?cityId=${selectedCityId}`)
        .then((res) => res.json())
        .then((data) => {
          setBarangays(data)
          setDevelopments([])
        })
        .catch((err) => {
          console.error('Error fetching barangays:', err)
          toast.error('Failed to load barangays')
        })
    } else {
      setBarangays([])
      setDevelopments([])
    }
  }, [selectedCityId])

  useEffect(() => {
    if (selectedBarangayId) {
      fetch(`/api/psgc/developments?barangayId=${selectedBarangayId}`)
        .then((res) => res.json())
        .then((data) => {
          setDevelopments(data)
        })
        .catch((err) => {
          console.error('Error fetching developments:', err)
          toast.error('Failed to load developments')
        })
    } else {
      setDevelopments([])
    }
  }, [selectedBarangayId])

  const onSubmit = async (data: ListingFormData) => {
    setIsLoading(true)

    try {
      const endpoint = listingId ? `/api/listings/${listingId}` : '/api/listings'
      const method = listingId ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          propertyCategory: data.propertyCategoryId,
          propertyType: data.propertyTypeId,
          propertySubtype: data.propertySubtypeId || null,
          city: data.cityId,
          barangay: data.barangayId,
          development: data.developmentId || null,
          images: imageIds,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save listing')
      }

      toast.success(listingId ? 'Listing updated successfully!' : 'Listing created successfully!')
      router.push('/listings')
      router.refresh()
    } catch (error) {
      console.error('Error saving listing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save listing')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Property title and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 3BR House and Lot in Xavier Estates" {...field} />
                  </FormControl>
                  <FormDescription>Max 120 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Detailed description of the property..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Listing Type */}
        <Card>
          <CardHeader>
            <CardTitle>Listing Type</CardTitle>
            <CardDescription>Select whether this is a resale or preselling listing</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="listingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select listing type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="resale">Resale</SelectItem>
                      <SelectItem value="preselling">Preselling (Admin Only)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Resale: Existing properties ready for move-in. Preselling: Under construction or
                    pre-construction properties.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Property Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Property Classification</CardTitle>
            <CardDescription>Category, type, and subtype of the property</CardDescription>
          </CardHeader>
          <CardContent>
            <PropertyClassificationSelect
              categoryValue={form.watch('propertyCategoryId')}
              typeValue={form.watch('propertyTypeId')}
              subtypeValue={form.watch('propertySubtypeId')}
              onCategoryChange={(value) => form.setValue('propertyCategoryId', value || 0)}
              onTypeChange={(value) => form.setValue('propertyTypeId', value || 0)}
              onSubtypeChange={(value) => form.setValue('propertySubtypeId', value)}
              categoryError={form.formState.errors.propertyCategoryId?.message}
              typeError={form.formState.errors.propertyTypeId?.message}
              subtypeError={form.formState.errors.propertySubtypeId?.message}
            />
          </CardContent>
        </Card>

        {/* Transaction Type */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Type</CardTitle>
            <CardDescription>Sale or rent</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Resale Pricing */}
        {listingType === 'resale' && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Property price and price per square meter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₱) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5000000"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricePerSqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per sqm (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="25000"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>Required for lot properties</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preselling Pricing */}
        {listingType === 'preselling' && (
          <Card>
            <CardHeader>
              <CardTitle>Preselling Pricing & Details</CardTitle>
              <CardDescription>Indicative price range and model information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2BR Unit Type A" {...field} />
                    </FormControl>
                    <FormDescription>Unit model or type name</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="indicativePriceMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Price (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="3000000"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>Starting price range</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="indicativePriceMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Price (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5000000"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>Upper price range</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Disclaimer:</strong> Prices are indicative and subject to change. Final
                  pricing may vary based on unit selection, payment terms, and other factors.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Area & Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Area & Specifications</CardTitle>
            <CardDescription>Property dimensions and features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resale: Actual areas */}
            {listingType === 'resale' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="floorAreaSqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor Area (sqm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="120"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lotAreaSqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Area (sqm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="200"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Preselling: Minimum areas */}
            {listingType === 'preselling' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minFloorAreaSqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Floor Area (sqm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>Minimum floor area for this unit type</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minLotAreaSqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Lot Area (sqm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="150"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>Minimum lot area for this unit type</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parkingSlots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parking Slots</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resale-specific: Furnishing and Construction Year */}
            {listingType === 'resale' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="furnishing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Furnishing</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select furnishing" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unfurnished">Unfurnished</SelectItem>
                          <SelectItem value="semi_furnished">Semi-Furnished</SelectItem>
                          <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="constructionYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Construction Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2020"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Province → City → Barangay selection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Province Selector */}
            <div>
              <label className="text-sm font-medium">Province (Optional Filter)</label>
              <Select
                onValueChange={(value) => {
                  const provinceId = value === 'all' ? null : parseInt(value)
                  setSelectedProvinceId(provinceId)
                  // Reset city, barangay, development when province changes
                  form.setValue('cityId', 0)
                  form.setValue('barangayId', 0)
                  form.setValue('developmentId', undefined)
                  setSelectedCityId(null)
                  setSelectedBarangayId(null)
                  setBarangays([])
                  setDevelopments([])
                }}
                value={selectedProvinceId?.toString() || 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.id.toString()}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Filter cities by province to find cities with duplicate names
              </p>
            </div>

            <FormField
              control={form.control}
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const cityId = parseInt(value)
                      field.onChange(cityId)
                      setSelectedCityId(cityId)
                      form.setValue('barangayId', 0)
                      form.setValue('developmentId', undefined)
                    }}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCities.map((city) => {
                        const provinceName =
                          typeof city.province === 'object' && city.province !== null
                            ? city.province.name
                            : ''
                        return (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                            {provinceName && <span className="text-muted-foreground"> ({provinceName})</span>}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {selectedProvinceId
                      ? `Showing ${filteredCities.length} cities in selected province`
                      : `${filteredCities.length} cities available`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="barangayId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barangay *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const barangayId = parseInt(value)
                      field.onChange(barangayId)
                      setSelectedBarangayId(barangayId)
                      form.setValue('developmentId', undefined)
                    }}
                    value={field.value?.toString()}
                    disabled={!selectedCityId || barangays.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {barangays.map((barangay) => (
                        <SelectItem key={barangay.id} value={barangay.id.toString()}>
                          {barangay.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{!selectedCityId ? 'Select city first' : ''}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="developmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Development / Subdivision {listingType === 'preselling' ? ' *' : '(Optional)'}
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={!selectedBarangayId || developments.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select development" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {developments.map((dev) => (
                        <SelectItem key={dev.id} value={dev.id.toString()}>
                          {dev.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {!selectedBarangayId
                      ? 'Select barangay first'
                      : listingType === 'preselling'
                        ? 'Required for preselling listings'
                        : 'Optional if not in a development'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Complete street address, house number, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Legal & Payment - Resale Only */}
        {listingType === 'resale' && (
          <Card>
            <CardHeader>
              <CardTitle>Legal & Payment</CardTitle>
              <CardDescription>Title and payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="titleStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select title status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clean">Clean</SelectItem>
                          <SelectItem value="mortgaged">Mortgaged</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tenure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenure</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tenure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="freehold">Freehold</SelectItem>
                          <SelectItem value="leasehold">Leasehold</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preselling Additional Details */}
        {listingType === 'preselling' && (
          <Card>
            <CardHeader>
              <CardTitle>Preselling Additional Details</CardTitle>
              <CardDescription>Standard inclusions and internal notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="standardInclusions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standard Inclusions</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Standard features and inclusions for this unit type..."
                      />
                    </FormControl>
                    <FormDescription>Features included in the unit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="presellingNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes, disclaimers, or special conditions..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Internal notes about this preselling listing (not shown to public)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Property Images */}
        <Card>
          <CardHeader>
            <CardTitle>Property Images</CardTitle>
            <CardDescription>Upload photos of the property</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload value={imageIds} onChange={setImageIds} maxImages={10} />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {listingId ? 'Update Listing' : 'Create Listing'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
