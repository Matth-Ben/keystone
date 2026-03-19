'use client'

import { useState, useRef } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Upload, Loader2, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
    validateCsvData,
    importSecretsFromCsv,
    type SecretCsvRow
} from '@/lib/actions/secrets-csv'

interface SecretsImportDialogProps {
    organizationId: string
    disabled?: boolean
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'result'

export function SecretsImportDialog({ organizationId, disabled }: SecretsImportDialogProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<ImportStep>('upload')
    const [isValidating, setIsValidating] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [parsedRows, setParsedRows] = useState<SecretCsvRow[]>([])
    const [createMissingClients, setCreateMissingClients] = useState(false)
    const [importResult, setImportResult] = useState<{
        imported: number
        errors: string[]
        created_clients: string[]
    } | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const resetState = () => {
        setStep('upload')
        setIsValidating(false)
        setIsImporting(false)
        setValidationErrors([])
        setParsedRows([])
        setCreateMissingClients(false)
        setImportResult(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClose = () => {
        setOpen(false)
        setTimeout(resetState, 200)
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.csv')) {
            toast.error('Veuillez sélectionner un fichier CSV')
            return
        }

        setIsValidating(true)
        setValidationErrors([])

        try {
            const content = await file.text()
            const result = await validateCsvData(organizationId, content)

            if (result.errors.length > 0) {
                setValidationErrors(result.errors)
            }

            if (result.rows.length > 0) {
                setParsedRows(result.rows)
                setStep('preview')
            } else if (result.errors.length === 0) {
                toast.warning('Le fichier CSV est vide')
            }
        } catch (error) {
            console.error('Validation error:', error)
            toast.error('Erreur lors de la lecture du fichier')
        } finally {
            setIsValidating(false)
        }
    }

    const handleImport = async () => {
        setIsImporting(true)
        setStep('importing')

        try {
            const result = await importSecretsFromCsv(
                organizationId,
                parsedRows,
                createMissingClients
            )

            setImportResult({
                imported: result.imported,
                errors: result.errors,
                created_clients: result.created_clients
            })
            setStep('result')

            if (result.imported > 0) {
                toast.success(`${result.imported} secrets importés`)
            }
        } catch (error) {
            console.error('Import error:', error)
            toast.error('Erreur lors de l\'import')
            setStep('preview')
        } finally {
            setIsImporting(false)
        }
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            ssh: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            ftp: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            db: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            cms: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            api: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
            other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        }
        return colors[type] || colors.other
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleClose()
            else setOpen(true)
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={disabled}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importer CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Importer des secrets
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'upload' && 'Sélectionnez un fichier CSV contenant les secrets à importer.'}
                        {step === 'preview' && 'Vérifiez les données avant de lancer l\'import.'}
                        {step === 'importing' && 'Import en cours...'}
                        {step === 'result' && 'Résultat de l\'import.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Step: Upload */}
                {step === 'upload' && (
                    <div className="space-y-4 py-4">
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="cursor-pointer flex flex-col items-center gap-3"
                            >
                                {isValidating ? (
                                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                                ) : (
                                    <Upload className="h-10 w-10 text-muted-foreground" />
                                )}
                                <div>
                                    <p className="font-medium">
                                        {isValidating ? 'Validation en cours...' : 'Cliquez pour sélectionner un fichier'}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Format CSV avec colonnes: client_name, type, title, password, ...
                                    </p>
                                </div>
                            </label>
                        </div>

                        {validationErrors.length > 0 && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                                <div className="flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-red-800 dark:text-red-200">
                                            Erreurs de validation
                                        </p>
                                        <ul className="mt-2 space-y-1 text-red-700 dark:text-red-300">
                                            {validationErrors.slice(0, 5).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                            {validationErrors.length > 5 && (
                                                <li>... et {validationErrors.length - 5} autres erreurs</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-2">Format attendu :</p>
                            <code className="block bg-muted p-2 rounded text-xs overflow-x-auto">
                                client_name,type,title,username,password,host,port,url,db_name,tags,notes
                            </code>
                        </div>
                    </div>
                )}

                {/* Step: Preview */}
                {step === 'preview' && (
                    <div className="space-y-4 py-4">
                        {validationErrors.length > 0 && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    {validationErrors.length} erreurs détectées (ces lignes seront ignorées)
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {parsedRows.length} secrets à importer
                            </p>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="create-clients"
                                    checked={createMissingClients}
                                    onCheckedChange={setCreateMissingClients}
                                />
                                <Label htmlFor="create-clients" className="text-sm">
                                    Créer les clients manquants
                                </Label>
                            </div>
                        </div>

                        <ScrollArea className="h-[300px] rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">Client</TableHead>
                                        <TableHead className="w-[80px]">Type</TableHead>
                                        <TableHead>Titre</TableHead>
                                        <TableHead className="w-[120px]">Username</TableHead>
                                        <TableHead className="w-[120px]">Host</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedRows.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium truncate max-w-[150px]">
                                                {row.client_name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={getTypeColor(row.type)}>
                                                    {row.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="truncate max-w-[200px]">
                                                {row.title}
                                            </TableCell>
                                            <TableCell className="truncate max-w-[120px] text-muted-foreground">
                                                {row.username || '-'}
                                            </TableCell>
                                            <TableCell className="truncate max-w-[120px] text-muted-foreground">
                                                {row.host || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                )}

                {/* Step: Importing */}
                {step === 'importing' && (
                    <div className="py-12 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Import des secrets en cours...</p>
                    </div>
                )}

                {/* Step: Result */}
                {step === 'result' && importResult && (
                    <div className="space-y-4 py-4">
                        <div className={`rounded-lg border p-4 ${
                            importResult.errors.length === 0
                                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                                : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
                        }`}>
                            <div className="flex gap-3">
                                {importResult.errors.length === 0 ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
                                )}
                                <div>
                                    <p className={`font-medium ${
                                        importResult.errors.length === 0
                                            ? 'text-green-800 dark:text-green-200'
                                            : 'text-amber-800 dark:text-amber-200'
                                    }`}>
                                        {importResult.imported} secrets importés avec succès
                                    </p>
                                    {importResult.created_clients.length > 0 && (
                                        <p className="text-sm mt-1 text-muted-foreground">
                                            Clients créés : {importResult.created_clients.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {importResult.errors.length > 0 && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                                <div className="flex gap-3">
                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-red-800 dark:text-red-200">
                                            {importResult.errors.length} erreurs
                                        </p>
                                        <ScrollArea className="h-[150px] mt-2">
                                            <ul className="space-y-1 text-red-700 dark:text-red-300">
                                                {importResult.errors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </ScrollArea>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {step === 'upload' && (
                        <Button variant="outline" onClick={handleClose}>
                            Annuler
                        </Button>
                    )}

                    {step === 'preview' && (
                        <>
                            <Button variant="outline" onClick={resetState}>
                                Retour
                            </Button>
                            <Button onClick={handleImport} disabled={parsedRows.length === 0}>
                                <Upload className="mr-2 h-4 w-4" />
                                Importer {parsedRows.length} secrets
                            </Button>
                        </>
                    )}

                    {step === 'result' && (
                        <Button onClick={handleClose}>
                            Fermer
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
