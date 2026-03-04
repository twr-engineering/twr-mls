'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

type ModalVariant = 'success' | 'warning' | 'danger' | 'info'

interface ConfirmModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
    variant?: ModalVariant
    loading?: boolean
}

const variantConfig: Record<ModalVariant, {
    icon: React.ReactNode
    confirmClassName: string
}> = {
    success: {
        icon: <CheckCircle className="h-6 w-6 text-green-600" />,
        confirmClassName: 'bg-green-600 hover:bg-green-700 text-white border-0',
    },
    warning: {
        icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
        confirmClassName: 'bg-orange-500 hover:bg-orange-600 text-white border-0',
    },
    danger: {
        icon: <XCircle className="h-6 w-6 text-red-600" />,
        confirmClassName: 'bg-red-600 hover:bg-red-700 text-white border-0',
    },
    info: {
        icon: <Info className="h-6 w-6 text-blue-600" />,
        confirmClassName: 'bg-blue-600 hover:bg-blue-700 text-white border-0',
    },
}

export function ConfirmModal({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    variant = 'info',
    loading = false,
}: ConfirmModalProps) {
    const config = variantConfig[variant]

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                            {config.icon}
                        </div>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pl-[52px]">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        disabled={loading}
                        className={config.confirmClassName}
                    >
                        {loading ? 'Processing...' : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

/**
 * Simple result toast modal (replaces alert() calls).
 * Shows a success or error message with a single "OK" button.
 */
interface ResultModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    variant?: 'success' | 'error'
}

export function ResultModal({
    open,
    onOpenChange,
    title,
    description,
    variant = 'success',
}: ResultModalProps) {
    const icon = variant === 'success'
        ? <CheckCircle className="h-6 w-6 text-green-600" />
        : <XCircle className="h-6 w-6 text-red-600" />

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                            {icon}
                        </div>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pl-[52px]">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        className={variant === 'success'
                            ? 'bg-green-600 hover:bg-green-700 text-white border-0'
                            : 'bg-red-600 hover:bg-red-700 text-white border-0'
                        }
                    >
                        OK
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
