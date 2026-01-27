'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createOrganization } from '@/lib/actions/organizations'
import { useAppStore } from '@/lib/store/app-store'
import { toast } from 'sonner'

const formSchema = z.object({
    name: z.string().min(2, {
        message: 'Le nom doit contenir au moins 2 caractères.',
    }).max(50, {
        message: 'Le nom ne peut pas dépasser 50 caractères.',
    }),
})

interface CreateOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function CreateOrganizationDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateOrganizationDialogProps) {
    const [loading, setLoading] = useState(false)
    const { setCurrentOrganization } = useAppStore()
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const organization = await createOrganization(values.name)

            // Mettre à jour le store
            setCurrentOrganization(organization)

            toast.success('Organisation créée !', {
                description: `${organization.name} a été créée avec succès.`,
            })

            // Fermer le dialog
            onOpenChange(false)
            form.reset()

            // Callback de succès si fourni
            if (onSuccess) {
                onSuccess()
            } else {
                // Sinon, rediriger vers clients
                router.push('/clients')
                router.refresh()
            }
        } catch (error: any) {
            toast.error('Erreur', {
                description: error.message || 'Impossible de créer l\'organisation',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Créer une organisation</DialogTitle>
                    <DialogDescription>
                        Créez une nouvelle organisation pour gérer vos clients et projets.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom de l'organisation</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Mon agence web"
                                            {...field}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Le nom de votre entreprise ou équipe.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Création...' : 'Créer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
