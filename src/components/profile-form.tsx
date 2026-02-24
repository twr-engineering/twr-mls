'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Camera, Loader2, Phone, Save, X, Pencil, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import Image from 'next/image'

type ProfileFormProps = {
    user: {
        id: number
        email: string
        role: string
        firstName?: string | null
        lastName?: string | null
        phone?: string | null
        avatar?: string | null
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imgObjRef = useRef<HTMLImageElement | null>(null)

    // Profile fields — editing state
    const [firstName, setFirstName] = useState(user.firstName || '')
    const [lastName, setLastName] = useState(user.lastName || '')
    const [phone, setPhone] = useState(user.phone || '')
    const [isEditingInfo, setIsEditingInfo] = useState(false)

    // Last successfully saved values — used for read-only display and cancel-reset
    const [savedFirstName, setSavedFirstName] = useState(user.firstName || '')
    const [savedLastName, setSavedLastName] = useState(user.lastName || '')
    const [savedPhone, setSavedPhone] = useState(user.phone || '')

    // Avatar URL — updated immediately after upload so display doesn't wait for router.refresh()
    const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar || null)

    // State
    const [isUploading, setIsUploading] = useState(false)
    const [isSavingInfo, setIsSavingInfo] = useState(false)

    // Crop dialog state
    const [cropDialogOpen, setCropDialogOpen] = useState(false)
    const [imgSrc, setImgSrc] = useState('')
    const [scale, setScale] = useState(1)
    const [offsetX, setOffsetX] = useState(0)
    const [offsetY, setOffsetY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    const hasProfileChanges =
        firstName !== savedFirstName ||
        lastName !== savedLastName ||
        phone !== savedPhone

    // Draw the canvas preview
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const img = imgObjRef.current
        if (!canvas || !img) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const size = canvas.width
        ctx.clearRect(0, 0, size, size)

        // Draw dark background
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, size, size)

        // Calculate scaled dimensions
        const imgAspect = img.naturalWidth / img.naturalHeight
        let drawW: number, drawH: number

        if (imgAspect > 1) {
            drawH = size * scale
            drawW = drawH * imgAspect
        } else {
            drawW = size * scale
            drawH = drawW / imgAspect
        }

        const drawX = (size - drawW) / 2 + offsetX
        const drawY = (size - drawH) / 2 + offsetY

        ctx.drawImage(img, drawX, drawY, drawW, drawH)

        // Draw circular mask overlay
        ctx.globalCompositeOperation = 'destination-in'
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'

        // Draw circle border
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
        ctx.stroke()
    }, [scale, offsetX, offsetY])

    useEffect(() => {
        drawCanvas()
    }, [drawCanvas])

    // Load image when source changes
    useEffect(() => {
        if (!imgSrc) return
        const img = new window.Image()
        img.onload = () => {
            imgObjRef.current = img
            setScale(1)
            setOffsetX(0)
            setOffsetY(0)
            drawCanvas()
        }
        img.src = imgSrc
    }, [imgSrc]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setImgSrc(reader.result?.toString() || '')
            setCropDialogOpen(true)
            setScale(1)
            setOffsetX(0)
            setOffsetY(0)
        })
        reader.readAsDataURL(file)

        // Reset input so re-selecting same file works
        e.target.value = ''
    }

    // Mouse/touch drag handlers for canvas
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY })
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDragging) return
        setOffsetX(e.clientX - dragStart.x)
        setOffsetY(e.clientY - dragStart.y)
    }

    const handlePointerUp = () => {
        setIsDragging(false)
    }

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.05 : 0.05
        setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)))
    }

    const handleResetCrop = () => {
        setScale(1)
        setOffsetX(0)
        setOffsetY(0)
    }

    const getCroppedBlob = useCallback(async (): Promise<Blob | null> => {
        const canvas = canvasRef.current
        if (!canvas) return null

        // Create output canvas at desired resolution
        const outputCanvas = document.createElement('canvas')
        const outputSize = 400
        outputCanvas.width = outputSize
        outputCanvas.height = outputSize
        const ctx = outputCanvas.getContext('2d')
        if (!ctx) return null

        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, outputSize, outputSize)

        return new Promise((resolve) => {
            outputCanvas.toBlob(
                (blob) => resolve(blob),
                'image/jpeg',
                0.92,
            )
        })
    }, [])

    const handleCropSave = async () => {
        setIsUploading(true)
        try {
            const croppedBlob = await getCroppedBlob()
            if (!croppedBlob) {
                toast.error('Failed to crop image')
                return
            }

            // Upload and link avatar in one secure server-side call
            const formData = new FormData()
            formData.append('file', croppedBlob, `avatar-${Date.now()}.jpg`)
            formData.append('alt', `${user.email} avatar`)

            // Using custom route handler to bypass CSRF blocks on direct payload POSTs
            const uploadRes = await fetch('/api/users/avatar', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })

            if (!uploadRes.ok) {
                const errorData = await uploadRes.json()
                throw new Error(errorData.error || 'Failed to update profile picture')
            }

            const uploadData = await uploadRes.json()
            if (uploadData.avatarUrl) {
                setAvatarUrl(uploadData.avatarUrl)
            }

            toast.success('Avatar updated!')
            setCropDialogOpen(false)
            setImgSrc('')
            router.refresh()
        } catch (error) {
            console.error('Avatar update error:', error)
            toast.error('Failed to update avatar')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSaveInfo = async () => {
        setIsSavingInfo(true)
        try {
            const updateRes = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    firstName: firstName.trim() || null,
                    lastName: lastName.trim() || null,
                    phone: phone.trim() || null,
                }),
            })

            if (!updateRes.ok) throw new Error('Failed to update profile')

            setSavedFirstName(firstName.trim())
            setSavedLastName(lastName.trim())
            setSavedPhone(phone.trim())
            toast.success('Profile updated!')
            setIsEditingInfo(false)
            router.refresh()
        } catch (error) {
            console.error('Profile update error:', error)
            toast.error('Failed to update profile')
        } finally {
            setIsSavingInfo(false)
        }
    }

    const handleCancelEdit = () => {
        setFirstName(savedFirstName)
        setLastName(savedLastName)
        setPhone(savedPhone)
        setIsEditingInfo(false)
    }

    const displayName = [savedFirstName, savedLastName].filter(Boolean).join(' ') || user.email.split('@')[0]

    return (
        <>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Hero Avatar Card */}
                <Card className="overflow-hidden">
                    <div className="relative h-32 bg-gradient-to-br from-primary/80 via-primary/50 to-primary/20" />
                    <CardContent className="relative pb-6">
                        {/* Avatar - overlapping the gradient */}
                        <div className="flex flex-col items-center -mt-16 space-y-3">
                            <div className="relative group">
                                <div
                                    className="h-28 w-28 rounded-full border-4 border-background bg-muted overflow-hidden shadow-xl cursor-pointer transition-transform duration-200 hover:scale-105"
                                    onClick={handleAvatarClick}
                                >
                                    {avatarUrl ? (
                                        <Image
                                            src={avatarUrl}
                                            alt="Avatar"
                                            width={112}
                                            height={112}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-12 w-12 text-primary/60" />
                                        </div>
                                    )}
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                        <Camera className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                {/* Small camera badge */}
                                <button
                                    onClick={handleAvatarClick}
                                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            <div className="text-center space-y-1">
                                <h2 className="text-xl font-bold tracking-tight">{displayName}</h2>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <Badge variant="secondary" className="mt-1 capitalize text-xs">
                                    {user.role}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-semibold">Personal Information</h3>
                            {!isEditingInfo ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditingInfo(true)}
                                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        disabled={isSavingInfo}
                                    >
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveInfo}
                                        disabled={isSavingInfo || !hasProfileChanges}
                                        className="gap-1.5"
                                    >
                                        {isSavingInfo ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Save className="h-3.5 w-3.5" />
                                        )}
                                        Save
                                    </Button>
                                </div>
                            )}
                        </div>

                        {isEditingInfo ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="e.g., +63 912 345 6789"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="space-y-0.5 min-w-0">
                                            <p className="text-xs text-muted-foreground">First Name</p>
                                            <p className="text-sm font-medium truncate">{savedFirstName || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="space-y-0.5 min-w-0">
                                            <p className="text-xs text-muted-foreground">Last Name</p>
                                            <p className="text-sm font-medium truncate">{savedLastName || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Phone className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm font-medium">{savedPhone || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Account Details (read-only) */}
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-base font-semibold mb-5">Account Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Mail className="h-4 w-4 text-blue-500" />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs text-muted-foreground">Email Address</p>
                                    <p className="text-sm font-medium truncate">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <Shield className="h-4 w-4 text-amber-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted-foreground">Role</p>
                                    <p className="text-sm font-medium capitalize">{user.role}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Image Crop Dialog */}
            <Dialog open={cropDialogOpen} onOpenChange={(open) => !isUploading && setCropDialogOpen(open)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Crop Your Avatar</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Drag to reposition. Use the zoom slider or scroll wheel to resize.
                        </p>

                        {/* Canvas crop area */}
                        <div className="flex justify-center">
                            <canvas
                                ref={canvasRef}
                                width={280}
                                height={280}
                                className="rounded-full cursor-grab active:cursor-grabbing border-2 border-border bg-muted/50"
                                style={{ touchAction: 'none' }}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerLeave={handlePointerUp}
                                onWheel={handleWheel}
                            />
                        </div>

                        {/* Zoom control */}
                        <div className="flex items-center gap-3 px-2">
                            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                            <input
                                type="range"
                                min={50}
                                max={300}
                                value={Math.round(scale * 100)}
                                onChange={(e) => setScale(Number(e.target.value) / 100)}
                                className="flex-1 h-1.5 bg-primary/20 rounded-full appearance-none cursor-pointer accent-primary
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                            />
                            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>

                        {/* Reset button */}
                        <div className="flex justify-center">
                            <Button variant="ghost" size="sm" onClick={handleResetCrop} className="gap-1.5 text-xs text-muted-foreground">
                                <RotateCcw className="h-3 w-3" />
                                Reset Position
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCropDialogOpen(false)
                                setImgSrc('')
                            }}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCropSave}
                            disabled={isUploading || !imgSrc}
                            className="gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Apply &amp; Save
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
