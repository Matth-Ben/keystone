'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus } from 'lucide-react'
import { createClient, updateClient, Client } from '@/lib/actions/clients'
import { useAppStore } from '@/lib/store/app-store'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const formSchema = z.object({
    name: z.string().min(2, {
        message: 'Le nom doit contenir au moins 2 caractères.',
    }),
    website: z.string().url({ message: 'URL invalide' }).optional().or(z.literal('')),
    description: z.string().optional(),
    drive_folder_url: z.string().optional().refine((val) => {
        if (!val) return true;
        return /drive\.google\.com\/.*folders\/([a-zA-Z0-9_-]+)/.test(val);
    }, "L'URL doit être un lien Google Drive valide (ex: https://drive.google.com/drive/folders/XXX)"),
})

interface CreateClientDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onClientCreated?: (client: Client) => void
    clientToEdit?: Client
    organizationId?: string // Override pour le mode "Tous mes secrets"
}

export function CreateClientDialog({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    onClientCreated,
    clientToEdit,
    organizationId,
}: CreateClientDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const { currentOrganization } = useAppStore()

    // Utiliser l'organizationId passé en prop ou celui du store
    const effectiveOrgId = organizationId || currentOrganization?.id

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            website: '',
            description: '',
            drive_folder_url: '',
        },
    })

    // Update form values when clientToEdit changes or dialog opens
    useEffect(() => {
        if (open) {
            form.reset({
                name: clientToEdit?.name || '',
                website: clientToEdit?.website || '',
                description: clientToEdit?.description || '',
                drive_folder_url: clientToEdit?.drive_folder_url || '',
            })
        }
    }, [open, clientToEdit, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!effectiveOrgId && !clientToEdit) return

        try {
            let result: Client

            if (clientToEdit) {
                // Note: updateClient returns { success: true } currently, we might need to fetch or adjust if we want the full object,
                // but for "Edit" usually we don't switch selection.
                // However user request is about "Creation".
                // Let's check createClient return type. It returns 'newClient as Client'.
                await updateClient(clientToEdit.id, {
                    name: values.name,
                    website: values.website || undefined,
                    description: values.description || undefined,
                    drive_folder_url: values.drive_folder_url || undefined,
                })
                result = { ...clientToEdit, ...values } as Client // Emulation for edit
                toast.success('Client modifié avec succès')
            } else {
                result = await createClient({
                    name: values.name,
                    website: values.website || undefined,
                    description: values.description || undefined,
                    organizationId: effectiveOrgId!,
                })
                toast.success('Client créé avec succès')
            }

            onOpenChange?.(false)
            form.reset()
            onClientCreated?.(result)
        } catch (error: any) {
            toast.error('Erreur', {
                description: error.message || 'Une erreur est survenue',
            })
        }
    }

    const isEdit = !!clientToEdit

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Nouveau Client
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Modifier le Client' : 'Nouveau Client'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Modifiez les informations du client.' : 'Ajoutez un nouveau client à votre organisation.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Corp" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Site Web</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://acme.com" {...field} />
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
                                    <FormLabel>Dossier Google Drive</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://drive.google.com/..." {...field} />
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
                                            placeholder="Description du client..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Créer')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
