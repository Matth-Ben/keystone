'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { updateUserProfile, type UserProfile } from '@/lib/actions/user-actions'
import { AvatarUpload } from './avatar-upload'
import { useAppStore } from '@/lib/store/app-store'

const profileSchema = z.object({
    full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    avatar_url: z.string().optional()
})

interface GeneralSettingsFormProps {
    profile: UserProfile
}

export function GeneralSettingsForm({ profile }: GeneralSettingsFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { setUserProfile } = useAppStore()

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: profile.full_name || '',
            avatar_url: profile.avatar_url || ''
        }
    })

    async function onSubmit(values: z.infer<typeof profileSchema>) {
        setIsSubmitting(true)
        try {
            await updateUserProfile(values)

            // Update local store immediately to reflect changes in Topbar
            setUserProfile({
                ...profile,
                full_name: values.full_name,
                avatar_url: values.avatar_url || null
            })

            toast.success('Profil mis à jour')
        } catch (error: any) {
            console.error('Update error:', error)
            toast.error(error.message || 'Erreur lors de la mise à jour')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Section */}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="avatar_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <AvatarUpload
                                        currentAvatarUrl={field.value}
                                        onAvatarChange={field.onChange}
                                        fullName={form.watch('full_name')}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                {/* Email (Read-only) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                        value={profile.email}
                        disabled
                        className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                        L'email ne peut pas être modifié
                    </p>
                </div>

                {/* Full Name */}
                <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom complet</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormDescription>
                                Votre nom tel qu'il apparaîtra dans l'application
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                    </Button>
                </div>
            </form>
        </Form>
    )
}
