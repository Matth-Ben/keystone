'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SecretsExportDialog } from './secrets-export-dialog'
import { SecretsImportDialog } from './secrets-import-dialog'
import { Database, Download, Upload, Shield } from 'lucide-react'

interface DataTabProps {
    organizationId: string
    isAdmin: boolean
}

export function DataTab({ organizationId, isAdmin }: DataTabProps) {
    return (
        <div className="space-y-6">
            {/* Section Import/Export */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Gestion des Secrets
                    </CardTitle>
                    <CardDescription>
                        Importez ou exportez les secrets de votre organisation au format CSV
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Export */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-muted/30">
                        <div className="flex gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Download className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-medium">Exporter les secrets</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Téléchargez tous les secrets de l'organisation dans un fichier CSV.
                                    Les mots de passe seront inclus en clair.
                                </p>
                            </div>
                        </div>
                        <SecretsExportDialog
                            organizationId={organizationId}
                            disabled={!isAdmin}
                        />
                    </div>

                    {/* Import */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-muted/30">
                        <div className="flex gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Upload className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-medium">Importer des secrets</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Ajoutez des secrets en masse depuis un fichier CSV.
                                    Les clients inexistants peuvent être créés automatiquement.
                                </p>
                            </div>
                        </div>
                        <SecretsImportDialog
                            organizationId={organizationId}
                            disabled={!isAdmin}
                        />
                    </div>

                    {!isAdmin && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                            <Shield className="h-4 w-4" />
                            <span>
                                Seuls les administrateurs peuvent importer ou exporter des secrets.
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Section Format CSV */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Format CSV attendu</CardTitle>
                    <CardDescription>
                        Structure des colonnes pour l'import de secrets
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-3 font-medium">Colonne</th>
                                    <th className="text-left py-2 px-3 font-medium">Requis</th>
                                    <th className="text-left py-2 px-3 font-medium">Description</th>
                                </tr>
                            </thead>
                            <tbody className="text-muted-foreground">
                                <tr className="border-b">
                                    <td className="py-2 px-3 font-mono text-xs">client_name</td>
                                    <td className="py-2 px-3">Oui</td>
                                    <td className="py-2 px-3">Nom du client (sera créé si inexistant)</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 px-3 font-mono text-xs">type</td>
                                    <td className="py-2 px-3">Oui</td>
                                    <td className="py-2 px-3">ssh, ftp, db, cms, api, other</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 px-3 font-mono text-xs">title</td>
                                    <td className="py-2 px-3">Oui</td>
                                    <td className="py-2 px-3">Titre du secret</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 px-3 font-mono text-xs">password</td>
                                    <td className="py-2 px-3">Oui</td>
                                    <td className="py-2 px-3">Mot de passe ou clé API</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 px-3 font-mono text-xs">username</td>
                                    <td className="py-2 px-3">Non</td>
                                    <td className="py-2 px-3">Nom d'utilisateur</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 px-3 font-mono text-xs">host</td>
                                    <td className="py-2 px-3">Non</td>
                                    <td className="py-2 px-3">Adresse IP ou nom de domaine</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 px-3 font-mono text-xs">port</td>
                                    <td className="py-2 px-3">Non</td>
                                    <td className="py-2 px-3">Numéro de port</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 px-3 font-mono text-xs">url</td>
                                    <td className="py-2 px-3">Non</td>
                                    <td className="py-2 px-3">URL complète</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 px-3 font-mono text-xs">db_name</td>
                                    <td className="py-2 px-3">Non</td>
                                    <td className="py-2 px-3">Nom de la base de données</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 px-3 font-mono text-xs">tags</td>
                                    <td className="py-2 px-3">Non</td>
                                    <td className="py-2 px-3">Tags séparés par des virgules</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 font-mono text-xs">notes</td>
                                    <td className="py-2 px-3">Non</td>
                                    <td className="py-2 px-3">Notes additionnelles</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-muted">
                        <p className="text-xs font-medium mb-2">Exemple :</p>
                        <code className="text-xs text-muted-foreground block whitespace-pre-wrap break-all">
client_name,type,title,username,password,host,port,url,db_name,tags,notes{'\n'}
Acme Corp,db,Production MySQL,admin,Secret123,db.acme.com,3306,,acme_prod,"production,critical",Base principale
                        </code>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
