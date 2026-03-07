'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Camera, Loader2, Phone, Save, Mail, Shield, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

    // Form state
    const [firstName, setFirstName] = useState(user.firstName || '')
    const [lastName, setLastName] = useState(user.lastName || '')
    const [phone, setPhone] = useState(user.phone || '')

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar || null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarLoadError, setAvatarLoadError] = useState(false)

    // UI state
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Check if form changed
    useEffect(() => {
        const infoChanged = firstName !== (user.firstName || '') ||
            lastName !== (user.lastName || '') ||
            phone !== (user.phone || '')
        const avatarChanged = !!avatarFile

        setHasChanges(infoChanged || avatarChanged)
    }, [firstName, lastName, phone, avatarFile, user.firstName, user.lastName, user.phone])

    // Reset avatar error when URL changes
    useEffect(() => {
        setAvatarLoadError(false)
    }, [avatarUrl, avatarPreview])

    const handleAvatarClick = () => {
        if (!isEditing) return
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview)
        }

        const previewUrl = URL.createObjectURL(file)
        setAvatarFile(file)
        setAvatarPreview(previewUrl)
        e.target.value = ''
    }

    const handleCancelEditing = () => {
        // Revert all changes securely
        setFirstName(user.firstName || '')
        setLastName(user.lastName || '')
        setPhone(user.phone || '')
        setAvatarFile(null)
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview)
            setAvatarPreview(null)
        }
        setIsEditing(false)
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)

        try {
            let newAvatarUrl = avatarUrl

            // 1. Upload Avatar if changed
            if (avatarFile) {
                const formData = new FormData()
                formData.append('file', avatarFile, `avatar-${Date.now()}.jpg`)
                formData.append('alt', `${user.email} avatar`)

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
                    newAvatarUrl = uploadData.avatarUrl
                }
            }

            // 2. Update Profile Information
            const updateRes = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    firstName: firstName.trim() || null,
                    lastName: lastName.trim() || null,
                    phone: phone.trim() || null,
                }),
            })

            if (!updateRes.ok) {
                const errorData = await updateRes.json().catch(() => null)
                throw new Error(errorData?.error || 'Failed to update profile')
            }

            // Clean up preview URL
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview)
                setAvatarPreview(null)
            }

            // Set final state
            setAvatarFile(null)
            setAvatarUrl(newAvatarUrl)
            setHasChanges(false)
            setIsEditing(false) // Close editing mode on success

            toast.success('Profile saved successfully!')
            router.refresh()
        } catch (error) {
            console.error('Profile update error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    const displayName = [firstName, lastName].filter(Boolean).join(' ') ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.email.split('@')[0]

    // Use preview if available, otherwise use saved URL
    const displayAvatar = avatarPreview || avatarUrl

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Left Column: Identity Sidebar */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                    <Card className="border shadow-sm">
                        <CardContent className="pt-10 pb-8 px-6 flex flex-col items-center text-center">

                            {/* Avatar Picker */}
                            <div className={`relative group mb-6 ${isEditing ? 'cursor-pointer' : ''}`}>
                                <div
                                    className={`h-36 w-36 rounded-full border-4 border-white bg-slate-50 overflow-hidden shadow-md transition-all duration-200 ${isEditing ? 'group-hover:shadow-lg' : ''}`}
                                    onClick={handleAvatarClick}
                                >
                                    {displayAvatar && !avatarLoadError ? (
                                        <Image
                                            src={displayAvatar}
                                            alt="Avatar"
                                            fill
                                            className="object-cover w-full h-full rounded-full"
                                            onError={() => setAvatarLoadError(true)}
                                            sizes="(max-width: 768px) 144px, 144px"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center">
                                            <User className="h-16 w-16 text-slate-300" />
                                        </div>
                                    )}
                                    {/* Hover overlay - Only show in Edit Mode */}
                                    {isEditing && (
                                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200">
                                            <Camera className="h-7 w-7 text-white mb-2" />
                                            <span className="text-white text-xs font-medium tracking-wide">Upload Image</span>
                                        </div>
                                    )}
                                </div>
                                {/* Persistent small icon - Only show in Edit mode */}
                                {isEditing && (
                                    <button
                                        onClick={handleAvatarClick}
                                        className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-primary border-[3px] border-white text-primary-foreground flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={!isEditing}
                            />

                            <h2 className="text-xl font-bold text-slate-900 mb-1">{displayName}</h2>
                            <p className="text-sm text-slate-500 mb-4">{user.email}</p>
                            <Badge variant="secondary" className="capitalize px-3 py-1 font-medium bg-slate-100 text-slate-700 hover:bg-slate-100 shadow-sm border-0">
                                {user.role}
                            </Badge>

                        </CardContent>
                    </Card>

                    {/* Immutable Details */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="h-5 w-5 text-slate-400" />
                                Account Access
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</span>
                                <div className="flex items-center gap-3 text-slate-900 font-medium py-1">
                                    <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role Status</span>
                                <div className="py-1">
                                    <Badge variant="outline" className="capitalize text-slate-700 font-medium border-slate-200">
                                        {user.role}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Editable Profile Data */}
                <div className="w-full lg:w-2/3 flex flex-col gap-6">
                    <Card className="border shadow-sm flex-1">
                        <CardHeader className="pb-6 border-b border-slate-100 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle className="text-xl">Profile Information</CardTitle>
                                    <CardDescription className="mt-1">
                                        {isEditing ? 'Make changes to your personal details below.' : 'Your personal details currently on file.'}
                                    </CardDescription>
                                </div>

                                {/* Action Buttons (Desktop context) */}
                                <div className="hidden sm:flex gap-2">
                                    {!isEditing ? (
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            variant="outline"
                                            className="gap-2 shadow-sm whitespace-nowrap"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit Profile
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={handleCancelEditing}
                                                variant="ghost"
                                                disabled={isSaving}
                                                className="gap-2 text-slate-500 hover:text-slate-900"
                                            >
                                                <X className="h-4 w-4" />
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSaveProfile}
                                                disabled={isSaving || !hasChanges}
                                                className="gap-2 shadow-sm whitespace-nowrap bg-primary text-primary-foreground"
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                                Save Changes
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-8 space-y-8">

                            {/* Names Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="firstName" className="text-slate-700 font-medium">First Name</Label>
                                    {isEditing ? (
                                        <Input
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="e.g. John"
                                            className="bg-slate-50/50 border-slate-200 focus-visible:ring-primary h-11"
                                        />
                                    ) : (
                                        <div className="h-11 flex items-center px-3 border border-transparent text-slate-900 font-medium bg-slate-50/50 rounded-md">
                                            {firstName || '—'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="lastName" className="text-slate-700 font-medium">Last Name</Label>
                                    {isEditing ? (
                                        <Input
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="e.g. Doe"
                                            className="bg-slate-50/50 border-slate-200 focus-visible:ring-primary h-11"
                                        />
                                    ) : (
                                        <div className="h-11 flex items-center px-3 border border-transparent text-slate-900 font-medium bg-slate-50/50 rounded-md">
                                            {lastName || '—'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Phone Row */}
                            <div className="space-y-3 max-w-md">
                                <Label htmlFor="phone" className="text-slate-700 font-medium">Phone Number</Label>
                                {isEditing ? (
                                    <>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <Input
                                                id="phone"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="+63 9XX XXX XXXX"
                                                className="pl-11 bg-slate-50/50 border-slate-200 focus-visible:ring-primary h-11"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground pt-1">
                                            This number may be used to contact you regarding listings.
                                        </p>
                                    </>
                                ) : (
                                    <div className="h-11 flex items-center px-3 gap-3 border border-transparent text-slate-900 font-medium bg-slate-50/50 rounded-md">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        {phone || '—'}
                                    </div>
                                )}
                            </div>

                        </CardContent>
                    </Card>

                    {/* Mobile Floating/Bottom Action button area */}
                    <div className="sm:hidden flex flex-col gap-3 pt-4 pb-8 sticky bottom-0 bg-background/95 backdrop-blur z-20 border-t mt-4 -mx-4 px-4">
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="outline"
                                className="w-full gap-2 shadow-sm h-12 text-base"
                            >
                                <Pencil className="h-5 w-5" />
                                Edit Profile
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleCancelEditing}
                                    variant="outline"
                                    disabled={isSaving}
                                    className="flex-1 h-12 text-slate-600"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving || !hasChanges}
                                    className="flex-[2] gap-2 shadow-md h-12 text-base"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Save className="h-5 w-5" />
                                    )}
                                    Save
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
