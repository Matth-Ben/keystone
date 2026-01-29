import { Suspense } from 'react'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { getOrganization } from '@/lib/actions/organizations'
import { redirect } from 'next/navigation'
import { getDriveEmbedUrl } from '@/lib/drive-utils'
import { Button } from '@/components/ui/button'
import { ExternalLink, FolderOpen } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
    title: 'Documents',
}

export default async function DocumentsPage() {
    const organizationId = await getOrganizationCookie()

    if (!organizationId) {
        redirect('/')
    }

    try {
        const organization = await getOrganization(organizationId)
        const embedUrl = getDriveEmbedUrl(organization.drive_folder_url)

        if (!organization.drive_folder_url || !embedUrl) {
            return (
                <div className="flex h-[calc(100vh-10rem)] w-full flex-col items-center justify-center space-y-4 text-center">
                    <div className="rounded-full bg-muted p-6">
                        <FolderOpen className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Aucun dossier Drive connecté</h3>
                        <p className="max-w-sm text-muted-foreground">
                            Connectez un dossier Google Drive dans les paramètres de l'organisation pour voir vos documents ici.
                        </p>
                    </div>
                </div>
            )
        }

        return (
            <div className="flex h-[calc(100vh-2rem)] flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
                        <p className="text-muted-foreground">
                            Accédez aux documents de votre organisation
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={organization.drive_folder_url} target="_blank" rel="noopener noreferrer">
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

    } catch (error) {
        return (
            <div className="p-8 text-center">
                <h3 className="text-lg font-semibold">Erreur</h3>
                <p className="text-muted-foreground">Impossible de charger les documents.</p>
            </div>
        )
    }
}
