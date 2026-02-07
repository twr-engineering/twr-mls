'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export interface Option {
    label: string
    value: string
}

interface MultiSelectProps {
    options: Option[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = 'Select options...',
    className,
    disabled = false,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value]
        onChange(newSelected)
    }

    const handleRemove = (value: string, e: React.MouseEvent) => {
        e.stopPropagation()
        handleSelect(value)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between hover:bg-background',
                        selected.length > 0 ? 'h-auto py-2' : 'h-10',
                        className
                    )}
                    disabled={disabled}
                >
                    <div className="flex flex-wrap gap-1">
                        {selected.length > 0 ? (
                            selected.map((item) => {
                                const option = options.find((o) => o.value === item)
                                return (
                                    <Badge variant="secondary" key={item} className="mr-1 mb-1">
                                        {option?.label || item}
                                        <div
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                            }}
                                            onClick={(e) => handleRemove(item, e)}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </div>
                                    </Badge>
                                )
                            })
                        ) : (
                            <span className="text-muted-foreground font-normal">
                                {placeholder}
                            </span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                    {/* No CommandInput as per "not searchable" request */}
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selected.includes(option.value)
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => handleSelect(option.value)}
                                        className="cursor-pointer !pointer-events-auto !opacity-100"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <div
                                            className={cn(
                                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible'
                                            )}
                                        >
                                            <Check className={cn('h-4 w-4')} />
                                        </div>
                                        <span>{option.label}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
