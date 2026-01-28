'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadUserAvatar } from '@/lib/actions/upload'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AvatarUploadProps {
    currentAvatarUrl?: string | null
    onAvatarChange: (url: string) => void
    fullName?: string | null
}

export function AvatarUpload({ currentAvatarUrl, onAvatarChange, fullName }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Preview local
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Upload
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const publicUrl = await uploadUserAvatar(formData)
            onAvatarChange(publicUrl)
            setPreview(publicUrl)
            toast.success('Avatar mis à jour')
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de l\'upload')
            setPreview(currentAvatarUrl || null)
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemove = () => {
        setPreview(null)
        onAvatarChange('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="flex items-center gap-4">
            <div className="relative group">
                <Avatar className="h-20 w-20">
                    {preview && <AvatarImage src={preview} className="object-cover" />}
                    <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                        {fullName?.charAt(0).toUpperCase() || <User className="h-10 w-10" />}
                    </AvatarFallback>
                </Avatar>

                {preview && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemove}
                        disabled={isUploading}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            <div className="flex-1">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Upload...
                        </>
                    ) : (
                        "Changer l'avatar"
                    )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG ou WebP. Max 2 MB.
                </p>
            </div>
        </div>
    )
}
