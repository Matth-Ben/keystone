import type { SecretCsvRow } from '@/lib/actions/secrets-csv'

/**
 * Génère le contenu CSV à partir des données
 */
export function generateCsvContent(rows: SecretCsvRow[]): string {
    const headers = ['client_name', 'type', 'title', 'username', 'password', 'host', 'port', 'url', 'db_name', 'tags', 'notes']

    const escapeField = (field: string): string => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`
        }
        return field
    }

    const csvLines = [headers.join(',')]

    for (const row of rows) {
        const line = headers.map(h => escapeField(row[h as keyof SecretCsvRow] || '')).join(',')
        csvLines.push(line)
    }

    return csvLines.join('\n')
}
