'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createFolder, updateFolder, SecretFolder } from '@/lib/actions/folders'

const FOLDER_COLORS = [
    { value: '#ef4444', label: 'Rouge' },
    { value: '#f97316', label: 'Orange' },
    { value: '#eab308', label: 'Jaune' },
    { value: '#22c55e', label: 'Vert' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#3b82f6', label: 'Bleu' },
    { value: '#8b5cf6', label: 'Violet' },
    { value: '#ec4899', label: 'Rose' },
]

const formSchema = z.object({
    name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
    color: z.string().optional(),
})

interface CreateFolderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organizationId: string
    folderToEdit?: SecretFolder
    onFolderCreated?: (folder: SecretFolder) => void
}

export function CreateFolderDialog({
    open,
    onOpenChange,
    organizationId,
    folderToEdit,
    onFolderCreated
}: CreateFolderDialogProps) {
    const isEdit = !!folderToEdit
    const [selectedColor, setSelectedColor] = useState<string | null>(folderToEdit?.color || null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: folderToEdit?.name || '',
            color: folderToEdit?.color || '',
        },
    })

    // Reset form when dialog opens or when folderToEdit changes
    useEffect(() => {
        if (open) {
            form.reset({
                name: folderToEdit?.name || '',
                color: folderToEdit?.color || '',
            })
            setSelectedColor(folderToEdit?.color || null)
        }
    }, [open, folderToEdit, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (isEdit && folderToEdit) {
                await updateFolder(folderToEdit.id, {
                    name: values.name,
                    color: selectedColor,
                })
                toast.success('Dossier modifié')
            } else {
                const folder = await createFolder({
                    organizationId,
                    name: values.name,
                    color: selectedColor || undefined,
                })
                toast.success('Dossier créé')
                onFolderCreated?.(folder)
            }
            onOpenChange(false)
            form.reset()
            setSelectedColor(null)
        } catch (error: any) {
            toast.error(error.message || 'Une erreur est survenue')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Modifier le dossier' : 'Nouveau dossier'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Modifiez les informations du dossier.'
                            : 'Créez un dossier pour organiser vos secrets.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom du dossier</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Production, Staging..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>Couleur (optionnel)</FormLabel>
                            <div className="flex flex-wrap gap-2">
                                {FOLDER_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setSelectedColor(
                                            selectedColor === color.value ? null : color.value
                                        )}
                                        className={`w-8 h-8 rounded-full transition-all ${
                                            selectedColor === color.value
                                                ? 'ring-2 ring-offset-2 ring-primary scale-110'
                                                : 'hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting
                                    ? 'Enregistrement...'
                                    : (isEdit ? 'Modifier' : 'Créer')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
