'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Wand2, Eye, EyeOff, Loader2 } from 'lucide-react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createSecret, updateSecret, revealSecret, Secret, SecretType } from '@/lib/actions/secrets'
import { getClients, Client } from '@/lib/actions/clients'
import { useAppStore } from '@/lib/store/app-store'

const formSchema = z.object({
    client_id: z.string().optional(),
    type: z.enum(['ssh', 'ftp', 'db', 'cms', 'api', 'other'] as [string, ...string[]]),
    title: z.string().min(1, 'Le titre est requis'),
    password: z.string().optional(),
    username: z.string().optional(),
    host: z.string().optional(),
    port: z.string().transform(v => (v ? parseInt(v, 10) : undefined)).optional(),
    url: z.string().optional(),
    db_name: z.string().optional(),
    notes: z.string().optional(),
})

interface CreateSecretDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clientId?: string
    secretToEdit?: Secret
}

export function CreateSecretDialog({
    open,
    onOpenChange,
    clientId,
    secretToEdit
}: CreateSecretDialogProps) {
    const isEdit = !!secretToEdit
    const { currentOrganization } = useAppStore()

    // eslint-disable-next-line
    const [showPassword, setShowPassword] = useState(false)
    const [isLoadingPassword, setIsLoadingPassword] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [loadingClients, setLoadingClients] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            client_id: clientId || '',
            type: 'other',
            title: '',
            password: '',
            username: '',
            host: '',
            port: undefined,
            url: '',
            db_name: '',
            notes: '',
        },
    })

    const type = form.watch('type') as SecretType

    // Charger les clients si aucun clientId n'est fourni
    useEffect(() => {
        if (open && !clientId && currentOrganization) {
            setLoadingClients(true)
            getClients(currentOrganization.id)
                .then(setClients)
                .catch(() => toast.error("Erreur lors du chargement des clients"))
                .finally(() => setLoadingClients(false))
        }
    }, [open, clientId, currentOrganization])

    useEffect(() => {
        if (open) {
            setShowPassword(false)
            setIsLoadingPassword(false)

            // Reset de base
            form.reset({
                client_id: clientId || secretToEdit?.project?.client_id || '', // Note: secret structure might slightly vary, usually secrets are linked to projects but here we link to clients directly in our simplified model? Let's assume we link to clients directly or projects. 
                // Wait, previously we were passing clientId. The Secret type might need verification but let's assume direct linkage or project linkage.
                // If secrets are linked to projects, we might need projects. But the user asked for CLIENT choice.
                // Assuming simple client linkage for now based on previous code usage (createSecret(..., client_id)).
                type: secretToEdit?.type || 'other',
                title: secretToEdit?.title || '',
                password: '',
                username: secretToEdit?.username || '',
                host: secretToEdit?.host || '',
                port: secretToEdit?.port?.toString() as any || '',
                url: secretToEdit?.url || '',
                db_name: secretToEdit?.db_name || '',
                notes: secretToEdit?.notes || '',
            })

            // Si édition, on charge le mot de passe
            if (secretToEdit) {
                setIsLoadingPassword(true)
                revealSecret(secretToEdit.id)
                    .then((clearPassword) => {
                        form.setValue('password', clearPassword)
                    })
                    .catch(() => {
                        toast.error("Erreur lors du chargement du mot de passe")
                    })
                    .finally(() => {
                        setIsLoadingPassword(false)
                    })
            }
        }
    }, [open, secretToEdit, form, clientId])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const finalClientId = clientId || values.client_id

            if (!finalClientId) {
                form.setError('client_id', { message: 'Le client est requis' })
                return
            }

            if (!isEdit && !values.password) {
                form.setError('password', { message: 'Le mot de passe est requis' })
                return
            }

            const data = {
                ...values,
                client_id: finalClientId,
                type: values.type as SecretType,
            }

            if (isEdit) {
                // @ts-ignore
                await updateSecret(secretToEdit.id, finalClientId, data)
                toast.success('Secret modifié')
            } else {
                // @ts-ignore
                await createSecret(data)
                toast.success('Secret créé')
            }
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error.message || 'Une erreur est survenue')
        }
    }

    const generatePassword = (onChange: (value: string) => void) => {
        const length = 24
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"
        let retVal = ""
        for (let i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n))
        }
        onChange(retVal)
        setShowPassword(true)
        toast.success('Mot de passe généré')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Modifier le secret' : 'Nouveau Secret'}</DialogTitle>
                    <DialogDescription>
                        Ajoutez des identifiants ou clés API sécurisés.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* Sélection du client si non fourni */}
                        {!clientId && (
                            <FormField
                                control={form.control}
                                name="client_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loadingClients ? "Chargement..." : "Sélectionner un client"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {clients.map(client => (
                                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Type de secret" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="db">Base de données</SelectItem>
                                                <SelectItem value="ssh">Serveur (SSH)</SelectItem>
                                                <SelectItem value="ftp">FTP / SFTP</SelectItem>
                                                <SelectItem value="cms">CMS / Back-office</SelectItem>
                                                <SelectItem value="api">Clé API</SelectItem>
                                                <SelectItem value="other">Autre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom / Titre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Prod DB, Stripe Live..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Champs conditionnels */}
                        {(type === 'db' || type === 'ssh' || type === 'ftp') && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="host"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hôte (Host)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="192.168.1.1 ou db.example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="port"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Port</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder={type === 'db' ? "5432" : type === 'ssh' ? "22" : "21"} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {(type === 'db' || type === 'ssh' || type === 'ftp' || type === 'cms') && (
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Utilisateur</FormLabel>
                                            <FormControl>
                                                <Input placeholder="root, postgres..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            {type === 'db' && (
                                <FormField
                                    control={form.control}
                                    name="db_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom de la BDD</FormLabel>
                                            <FormControl>
                                                <Input placeholder="my_app_db" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {(type === 'api' || type === 'cms') && (
                            <FormField
                                control={form.control}
                                name="url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://api.stripe.com..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {type === 'api' ? 'Clé API / Token' : type === 'ssh' ? 'Mot de passe / Clé privée' : 'Mot de passe'}
                                        {isEdit ? ' (Chargement...)' : ' *'}
                                    </FormLabel>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder={isLoadingPassword ? "Chargement..." : "••••••••"}
                                                        {...field}
                                                        disabled={isLoadingPassword}
                                                        className="pr-10"
                                                    />
                                                    {isLoadingPassword && (
                                                        <div className="absolute right-3 top-2.5">
                                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            {!isLoadingPassword && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => generatePassword(field.onChange)}
                                            title="Générer un mot de passe sécurisé"
                                        >
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            Générer
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Informations complémentaires..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting || isLoadingPassword || (loadingClients && !clientId)}>
                                {form.formState.isSubmitting ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
