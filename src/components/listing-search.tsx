'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export function ListingSearch() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        router.replace(`${pathname}?${params.toString()}`)
    }, 300)

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search my listings..."
                className="pl-8 bg-background"
                defaultValue={searchParams.get('q')?.toString()}
                onChange={(e) => handleSearch(e.target.value)}
            />
        </div>
    )
}
