'use client'

import { useState } from 'react'
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
import { Download, Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { exportSecretsToCsv } from '@/lib/actions/secrets-csv'
import { generateCsvContent } from '@/lib/utils/csv'

interface SecretsExportDialogProps {
    organizationId: string
    disabled?: boolean
}

export function SecretsExportDialog({ organizationId, disabled }: SecretsExportDialogProps) {
    const [open, setOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)

        try {
            const result = await exportSecretsToCsv(organizationId)

            if (!result.success) {
                toast.error(result.error || 'Erreur lors de l\'export')
                return
            }

            if (result.data.length === 0) {
                toast.warning('Aucun secret à exporter')
                setOpen(false)
                return
            }

            // Génération du contenu CSV
            const csvContent = generateCsvContent(result.data)

            // Création du blob et téléchargement
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', `secrets-export-${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast.success(`${result.data.length} secrets exportés avec succès`)
            setOpen(false)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Erreur lors de l\'export')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={disabled}>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Exporter les secrets
                    </DialogTitle>
                    <DialogDescription>
                        Exportez tous les secrets de l'organisation au format CSV.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-amber-800 dark:text-amber-200">
                                    Attention - Données sensibles
                                </p>
                                <p className="mt-1 text-amber-700 dark:text-amber-300">
                                    Le fichier CSV contiendra tous les mots de passe en clair.
                                    Stockez-le de manière sécurisée et supprimez-le après utilisation.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-2">Colonnes incluses :</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>client_name - Nom du client</li>
                            <li>type - Type de secret (ssh, ftp, db, cms, api, other)</li>
                            <li>title - Titre du secret</li>
                            <li>username, password, host, port, url, db_name</li>
                            <li>tags - Tags séparés par des virgules</li>
                            <li>notes - Notes additionnelles</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
                        Annuler
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Export en cours...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Télécharger le CSV
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
