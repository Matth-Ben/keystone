'use client'

import { FolderOpen, ExternalLink } from 'lucide-react'
import { getDriveEmbedUrl } from '@/lib/drive-utils'
import { Client } from '@/lib/actions/clients'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ClientDocumentsTabProps {
    client: Client
}

export function ClientDocumentsTab({ client }: ClientDocumentsTabProps) {
    const embedUrl = getDriveEmbedUrl(client.drive_folder_url)

    if (!client.drive_folder_url || !embedUrl) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center min-h-[400px]">
                <div className="rounded-full bg-muted p-6">
                    <FolderOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Aucun dossier Drive connecté</h3>
                    <p className="max-w-sm text-muted-foreground">
                        Modifiez le client pour ajouter l'URL de son dossier Google Drive.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col space-y-4 h-[600px]">
            <div className="flex justify-end">
                <Button asChild variant="outline" size="sm">
                    <Link href={client.drive_folder_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ouvrir dans Drive
                    </Link>
                </Button>
            </div>

            <div className="flex-1 overflow-hidden rounded-lg border bg-background shadow-sm">
                <iframe
                    src={embedUrl}
                    className="h-full w-full border-0"
                    title="Google Drive Documents"
                    loading="lazy"
                    allowFullScreen
                />
            </div>
        </div>
    )
}
