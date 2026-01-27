'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Plus, Trash2, Link as LinkIcon, Save } from 'lucide-react'
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

const formSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    logo_url: z.string().url('URL invalide').optional().or(z.literal('')),
    description: z.string().optional(),
    links: z.array(z.object({
        label: z.string().min(1, 'Label requis'),
        url: z.string().url('URL invalide')
    })).optional()
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
            description: organization.description || '',
            links: organization.links || []
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "links"
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            await updateOrganization(organization.id, {
                name: values.name,
                logo_url: values.logo_url || undefined,
                description: values.description || undefined,
                links: values.links || undefined
            })
            toast.success('Organisation mise à jour')
        } catch (error: any) {
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

                    <div className="grid gap-4 md:grid-cols-2">
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
                                    <FormLabel>Logo (URL)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <FormDescription>Lien vers l'image du logo</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

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
                </div>

                {/* Liens Utiles */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Liens Utiles</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ label: '', url: '' })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter un lien
                        </Button>
                    </div>
                    <Separator />

                    {fields.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Aucun lien configuré.</p>
                    ) : (
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-3">
                                    <FormField
                                        control={form.control}
                                        name={`links.${index}.label`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input placeholder="Libellé (ex: Documentation)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`links.${index}.url`}
                                        render={({ field }) => (
                                            <FormItem className="flex-[2]">
                                                <FormControl>
                                                    <div className="relative">
                                                        <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input className="pl-9" placeholder="https://..." {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
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
