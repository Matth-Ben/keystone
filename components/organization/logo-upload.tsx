'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadOrganizationLogo } from '@/lib/actions/upload'
import { toast } from 'sonner'
import { extractDominantColor } from '@/lib/utils/color-extractor'

interface LogoUploadProps {
    currentLogoUrl?: string | null
    onLogoChange: (url: string, color?: string) => void
}

export function LogoUpload({ currentLogoUrl, onLogoChange }: LogoUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentLogoUrl || null)
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
            // Extract dominant color
            const dominantColor = await extractDominantColor(file)
            console.log('Extracted color:', dominantColor)

            const formData = new FormData()
            formData.append('file', file)

            const publicUrl = await uploadOrganizationLogo(formData)
            onLogoChange(publicUrl, dominantColor)
            setPreview(publicUrl)
            toast.success('Logo uploadé avec succès')
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de l\'upload')
            setPreview(currentLogoUrl || null)
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemove = () => {
        setPreview(null)
        onLogoChange('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/10">
                    {preview ? (
                        <>
                            <img
                                src={preview}
                                alt="Logo preview"
                                className="object-contain w-full h-full p-2"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={handleRemove}
                                disabled={isUploading}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </>
                    ) : (
                        <Upload className="h-8 w-8 text-muted-foreground/50" />
                    )}
                </div>

                {/* Upload button */}
                <div className="flex-1">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Upload en cours...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                {preview ? 'Changer le logo' : 'Uploader un logo'}
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG, WebP ou SVG. Max 2 MB.
                    </p>
                </div>
            </div>
        </div>
    )
}
