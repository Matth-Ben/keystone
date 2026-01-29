'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { updateOrganization, OrganizationDetails } from '@/lib/actions/organizations'
import { Separator } from '@/components/ui/separator'
import { LogoUpload } from '@/components/organization/logo-upload'

const formSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    logo_url: z.string().optional(),
    brand_color: z.string().optional(),
    description: z.string().optional(),
    drive_folder_url: z.string().optional().refine((val) => {
        if (!val) return true;
        return /drive\.google\.com\/.*folders\/([a-zA-Z0-9_-]+)/.test(val);
    }, "L'URL doit être un lien Google Drive valide (ex: https://drive.google.com/drive/folders/XXX)")
})

interface OrganizationDetailsFormProps {
    organization: OrganizationDetails
}

export function OrganizationDetailsForm({ organization }: OrganizationDetailsFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: organization.name || '',
            logo_url: organization.logo_url || '',
            brand_color: organization.brand_color || '',
            description: organization.description || '',
            drive_folder_url: organization.drive_folder_url || ''
        }
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            console.log('Form values to submit:', values)

            const payload = {
                name: values.name,
                logo_url: values.logo_url || undefined,
                brand_color: values.brand_color || undefined,
                description: values.description || undefined,
                drive_folder_url: values.drive_folder_url || undefined
            }

            console.log('Payload to send:', payload)

            await updateOrganization(organization.id, payload)
            toast.success('Organisation mise à jour')
        } catch (error: any) {
            console.error('Update error:', error)
            toast.error(error.message || 'Erreur lors de la mise à jour')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">

                {/* Informations Principales */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informations Générales</h3>
                    <Separator />

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom de l'organisation</FormLabel>
                                <FormControl>
                                    <Input placeholder="Acme Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="logo_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Logo de l'organisation</FormLabel>
                                <FormControl>
                                    <LogoUpload
                                        currentLogoUrl={field.value}
                                        onLogoChange={(url, color) => {
                                            field.onChange(url)
                                            if (color) {
                                                form.setValue('brand_color', color)
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Description courte de votre organisation..."
                                        className="resize-none h-24"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="drive_folder_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Recherche Google Drive</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://drive.google.com/drive/folders/..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    Collez le lien vers le dossier Google Drive de votre organisation pour l'intégrer dans l'onglet "Documents".
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </Form>
    )
}
