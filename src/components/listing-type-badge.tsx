import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ListingTypeBadgeProps = {
  listingType: 'resale' | 'preselling'
  className?: string
}

export function ListingTypeBadge({ listingType, className }: ListingTypeBadgeProps) {
  const isResale = listingType === 'resale'

  return (
    <Badge
      variant={isResale ? 'default' : 'secondary'}
      className={cn(
        isResale ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700',
        className,
      )}
    >
      {isResale ? 'Resale – Available Property' : 'Preselling – Project Model'}
    </Badge>
  )
}
