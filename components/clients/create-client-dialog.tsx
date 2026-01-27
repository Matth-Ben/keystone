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
})

interface CreateClientDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onClientCreated?: () => void
    clientToEdit?: Client
}

export function CreateClientDialog({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    onClientCreated,
    clientToEdit,
}: CreateClientDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const { currentOrganization } = useAppStore()

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            website: '',
            description: '',
        },
    })

    // Update form values when clientToEdit changes or dialog opens
    useEffect(() => {
        if (open) {
            form.reset({
                name: clientToEdit?.name || '',
                website: clientToEdit?.website || '',
                description: clientToEdit?.description || '',
            })
        }
    }, [open, clientToEdit, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!currentOrganization && !clientToEdit) return

        try {
            if (clientToEdit) {
                await updateClient(clientToEdit.id, {
                    name: values.name,
                    website: values.website || undefined,
                    description: values.description || undefined,
                })
                toast.success('Client modifié avec succès')
            } else {
                await createClient({
                    name: values.name,
                    website: values.website || undefined,
                    description: values.description || undefined,
                    organizationId: currentOrganization!.id,
                })
                toast.success('Client créé avec succès')
            }

            onOpenChange?.(false)
            form.reset()
            onClientCreated?.()
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
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
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
