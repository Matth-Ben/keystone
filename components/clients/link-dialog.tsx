'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

const linkSchema = z.object({
    label: z.string().min(1, 'Le libellé est requis'),
    url: z.string().url('URL invalide')
})

interface LinkDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (link: { label: string; url: string }) => void
    initialData?: { label: string; url: string }
    isSaving?: boolean
}

export function LinkDialog({ open, onOpenChange, onSave, initialData, isSaving }: LinkDialogProps) {
    const form = useForm<z.infer<typeof linkSchema>>({
        resolver: zodResolver(linkSchema),
        defaultValues: {
            label: '',
            url: ''
        }
    })

    // Reset form when dialog opens/closes or initialData changes
    useEffect(() => {
        if (open) {
            form.reset(initialData || { label: '', url: '' })
        }
    }, [open, initialData, form])

    const onSubmit = (values: z.infer<typeof linkSchema>) => {
        onSave(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Modifier le lien' : 'Ajouter un lien'}</DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? 'Modifiez les informations du lien utile.'
                            : 'Ajoutez un nouveau lien utile pour ce client.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Libellé</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Documentation" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL</FormLabel>
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

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
