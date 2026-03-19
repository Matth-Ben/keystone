'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt, decrypt } from '@/lib/vault'
import { requireOrgRole, assertCanWrite, assertCanRevealSecrets } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import type { SecretType } from './secrets'

// Types pour l'export/import CSV
export interface SecretCsvRow {
    client_name: string
    type: SecretType
    title: string
    username: string
    password: string
    host: string
    port: string
    url: string
    db_name: string
    tags: string
    notes: string
}

export interface ImportResult {
    success: boolean
    imported: number
    errors: string[]
    created_clients: string[]
}

export interface ExportResult {
    success: boolean
    data: SecretCsvRow[]
    error?: string
}

const VALID_TYPES: SecretType[] = ['ssh', 'ftp', 'db', 'cms', 'api', 'other']

/**
 * Export tous les secrets de l'organisation en données CSV
 * Déchiffre les mots de passe (nécessite role admin ou member)
 */
export async function exportSecretsToCsv(organizationId: string): Promise<ExportResult> {
    // 1. Vérification de l'authentification et du rôle
    try {
        const { role } = await requireOrgRole(organizationId)
        assertCanRevealSecrets(role)
    } catch (e) {
        return { success: false, data: [], error: 'Permissions insuffisantes pour exporter les secrets' }
    }

    // 2. Récupération des secrets (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const { data: secrets, error } = await adminClient
        .from('secrets')
        .select(`
            *,
            clients!inner (
                id,
                name,
                organization_id
            )
        `)
        .eq('clients.organization_id', organizationId)
        .is('deleted_at', null)
        .order('clients(name)', { ascending: true })

    if (error) {
        console.error('Error exporting secrets:', error)
        return { success: false, data: [], error: 'Erreur lors de la récupération des secrets' }
    }

    // Transformation en format CSV avec déchiffrement des mots de passe
    const csvData: SecretCsvRow[] = []

    for (const secret of secrets) {
        let decryptedPassword = ''
        try {
            decryptedPassword = decrypt(secret.encrypted_password)
        } catch (e) {
            console.error(`Failed to decrypt password for secret ${secret.id}`)
            decryptedPassword = '[ERREUR DE DECHIFFREMENT]'
        }

        csvData.push({
            client_name: secret.clients?.name || '',
            type: secret.type,
            title: secret.title,
            username: secret.username || '',
            password: decryptedPassword,
            host: secret.host || '',
            port: secret.port?.toString() || '',
            url: secret.url || '',
            db_name: secret.db_name || '',
            tags: (secret.tags || []).join(', '),
            notes: secret.notes || '',
        })
    }

    return { success: true, data: csvData }
}

/**
 * Parse une chaîne CSV en lignes
 */
function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }

    result.push(current.trim())
    return result
}

/**
 * Parse le contenu CSV complet
 */
function parseCsv(content: string): { headers: string[], rows: string[][] } {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '')

    if (lines.length === 0) {
        return { headers: [], rows: [] }
    }

    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim())
    const rows = lines.slice(1).map(line => parseCsvLine(line))

    return { headers, rows }
}

/**
 * Valide et transforme les données CSV avant import
 */
export async function validateCsvData(
    organizationId: string,
    csvContent: string
): Promise<{ valid: boolean; rows: SecretCsvRow[]; errors: string[] }> {
    const supabase = await createClient() as any

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { valid: false, rows: [], errors: ['Non authentifié'] }
    }

    try {
        const { role } = await requireOrgRole(organizationId)
        assertCanWrite(role)
    } catch {
        return { valid: false, rows: [], errors: ['Permissions insuffisantes'] }
    }

    const { headers, rows } = parseCsv(csvContent)

    // Vérification des colonnes requises
    const requiredHeaders = ['client_name', 'type', 'title', 'password']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

    if (missingHeaders.length > 0) {
        return {
            valid: false,
            rows: [],
            errors: [`Colonnes manquantes: ${missingHeaders.join(', ')}`]
        }
    }

    const errors: string[] = []
    const parsedRows: SecretCsvRow[] = []

    // Index des colonnes
    const colIndex = {
        client_name: headers.indexOf('client_name'),
        type: headers.indexOf('type'),
        title: headers.indexOf('title'),
        username: headers.indexOf('username'),
        password: headers.indexOf('password'),
        host: headers.indexOf('host'),
        port: headers.indexOf('port'),
        url: headers.indexOf('url'),
        db_name: headers.indexOf('db_name'),
        tags: headers.indexOf('tags'),
        notes: headers.indexOf('notes'),
    }

    rows.forEach((row, index) => {
        const lineNum = index + 2 // +2 car on commence à 1 et on skip le header

        const getValue = (key: keyof typeof colIndex): string => {
            const idx = colIndex[key]
            return idx >= 0 && idx < row.length ? row[idx] : ''
        }

        const clientName = getValue('client_name')
        const type = getValue('type').toLowerCase() as SecretType
        const title = getValue('title')
        const password = getValue('password')

        // Validations
        if (!clientName) {
            errors.push(`Ligne ${lineNum}: client_name est requis`)
            return
        }

        if (!title) {
            errors.push(`Ligne ${lineNum}: title est requis`)
            return
        }

        if (!password) {
            errors.push(`Ligne ${lineNum}: password est requis`)
            return
        }

        if (!VALID_TYPES.includes(type)) {
            errors.push(`Ligne ${lineNum}: type "${type}" invalide (valeurs: ${VALID_TYPES.join(', ')})`)
            return
        }

        const port = getValue('port')
        if (port && isNaN(parseInt(port))) {
            errors.push(`Ligne ${lineNum}: port doit être un nombre`)
            return
        }

        parsedRows.push({
            client_name: clientName,
            type,
            title,
            username: getValue('username'),
            password,
            host: getValue('host'),
            port,
            url: getValue('url'),
            db_name: getValue('db_name'),
            tags: getValue('tags'),
            notes: getValue('notes'),
        })
    })

    return {
        valid: errors.length === 0,
        rows: parsedRows,
        errors
    }
}

/**
 * Import les secrets depuis les données CSV validées
 */
export async function importSecretsFromCsv(
    organizationId: string,
    rows: SecretCsvRow[],
    createMissingClients: boolean = false
): Promise<ImportResult> {
    const supabase = await createClient() as any
    const adminClient = createAdminClient() as any

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, imported: 0, errors: ['Non authentifié'], created_clients: [] }
    }

    try {
        const { role } = await requireOrgRole(organizationId)
        assertCanWrite(role)
    } catch {
        return { success: false, imported: 0, errors: ['Permissions insuffisantes'], created_clients: [] }
    }

    // Récupérer les clients existants de l'organisation
    const { data: existingClients, error: clientsError } = await adminClient
        .from('clients')
        .select('id, name')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

    if (clientsError) {
        return { success: false, imported: 0, errors: ['Erreur de récupération des clients'], created_clients: [] }
    }

    // Map des noms de clients vers leurs IDs (insensible à la casse)
    const clientMap = new Map<string, string>()
    for (const client of existingClients) {
        clientMap.set(client.name.toLowerCase(), client.id)
    }

    const errors: string[] = []
    const createdClients: string[] = []
    let importedCount = 0

    // Identifier les clients manquants
    const uniqueClientNames = [...new Set(rows.map(r => r.client_name))]
    const missingClients = uniqueClientNames.filter(name => !clientMap.has(name.toLowerCase()))

    if (missingClients.length > 0 && !createMissingClients) {
        return {
            success: false,
            imported: 0,
            errors: [`Clients inexistants: ${missingClients.join(', ')}. Activez l'option pour les créer automatiquement.`],
            created_clients: []
        }
    }

    // Créer les clients manquants si demandé
    if (createMissingClients && missingClients.length > 0) {
        for (const clientName of missingClients) {
            const { data: newClient, error: createError } = await supabase
                .from('clients')
                .insert({
                    organization_id: organizationId,
                    name: clientName
                })
                .select('id')
                .single()

            if (createError) {
                errors.push(`Impossible de créer le client "${clientName}": ${createError.message}`)
            } else {
                clientMap.set(clientName.toLowerCase(), newClient.id)
                createdClients.push(clientName)
            }
        }
    }

    // Importer les secrets
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const lineNum = i + 2

        const clientId = clientMap.get(row.client_name.toLowerCase())
        if (!clientId) {
            errors.push(`Ligne ${lineNum}: Client "${row.client_name}" non trouvé`)
            continue
        }

        // Chiffrer le mot de passe
        const encryptedPassword = encrypt(row.password)

        // Parser les tags
        const tags = row.tags
            ? row.tags.split(',').map(t => t.trim()).filter(t => t !== '')
            : null

        // Préparer les données du secret
        const secretData: any = {
            client_id: clientId,
            type: row.type,
            title: row.title,
            encrypted_password: encryptedPassword,
            created_by: user.id
        }

        // Ajouter les champs optionnels seulement s'ils ont une valeur
        if (row.username) secretData.username = row.username
        if (row.host) secretData.host = row.host
        if (row.port) secretData.port = parseInt(row.port)
        if (row.url) secretData.url = row.url
        if (row.db_name) secretData.db_name = row.db_name
        if (tags && tags.length > 0) secretData.tags = tags
        if (row.notes) secretData.notes = row.notes

        const { error: insertError } = await supabase
            .from('secrets')
            .insert(secretData)

        if (insertError) {
            errors.push(`Ligne ${lineNum}: Erreur d'insertion - ${insertError.message}`)
        } else {
            importedCount++
        }
    }

    // Revalidation des caches
    revalidatePath('/secrets')
    revalidatePath('/clients')

    return {
        success: errors.length === 0,
        imported: importedCount,
        errors,
        created_clients: createdClients
    }
}
