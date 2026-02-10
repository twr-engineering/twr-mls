'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Shield, Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'

type ProfileFormProps = {
    user: {
        id: number
        email: string
        role: string
        avatar?: string | null
    }
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Create preview URL
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)
        setSelectedFile(file)
    }

    const handleSave = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        try {
            // 1. Upload media
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('alt', `${user.email} avatar`)

            console.log('Uploading media...')
            const uploadRes = await fetch('/api/media', {
                method: 'POST',
                body: formData,
            })

            if (!uploadRes.ok) {
                throw new Error('Failed to upload image')
            }

            const mediaData = await uploadRes.json()
            const mediaId = mediaData.doc.id
            console.log('Media uploaded, ID:', mediaId)

            // 2. Update user with media ID
            console.log('Updating user...', user.id)
            const updateRes = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    avatar: mediaId,
                }),
            })

            if (!updateRes.ok) {
                throw new Error('Failed to update profile')
            }

            toast.success('Profile picture updated')

            // Cleanup and state reset
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
            setSelectedFile(null)

            router.refresh()
        } catch (error) {
            console.error('Profile update error:', error)
            toast.error('Failed to update profile picture')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your basic profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div
                                className="relative h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden group cursor-pointer border-2 border-transparent hover:border-primary transition-all"
                                onClick={handleAvatarClick}
                            >
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                                    <Camera className="h-6 w-6 text-white" />
                                </div>

                                {(previewUrl || user.avatar) ? (
                                    <Image
                                        src={previewUrl || user.avatar || '/default.png'}
                                        alt="Avatar"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <User className="h-10 w-10 text-primary" />
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />

                            <div>
                                <h3 className="font-semibold text-lg">
                                    {user.email.split('@')[0]}
                                </h3>
                                <Badge variant="secondary" className="mt-1 capitalize">
                                    {user.role}
                                </Badge>
                            </div>
                        </div>

                        {selectedFile && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={isUploading}
                                    size="sm"
                                >
                                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isUploading}
                                    onClick={() => {
                                        if (previewUrl) URL.revokeObjectURL(previewUrl)
                                        setPreviewUrl(null)
                                        setSelectedFile(null)
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">Email</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">Role</p>
                                <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">User ID</p>
                                <p className="text-sm text-muted-foreground">{user.id}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Click on your avatar to select a new picture.
                        <br />
                        A &quot;Save Changes&quot; button will appear for you to confirm the update.
                        <br /><br />
                        Please contact an administrator if you need to update other details immediately.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
