import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // For AES, this is always 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16

// Récupérer la clé maître depuis les variables d'environnement
// En prod, cela doit être défini. En dev, on peut avoir un fallback ou throw.
const getMasterKey = () => {
    const key = process.env.VAULT_MASTER_KEY
    if (!key) {
        if (process.env.NODE_ENV === 'development') {
            // Clé de développement fixe pour éviter de perdre les secrets à chaque redémarrage si non définie
            return Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
        }
        throw new Error('VAULT_MASTER_KEY is not defined')
    }
    // La clé doit être en hexadécimal (64 chars = 32 bytes)
    return Buffer.from(key, 'hex')
}

export function encrypt(text: string): string {
    const masterKey = getMasterKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    // Création du cipher
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv)

    // Chiffrement
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Récupération du tag d'authentification (GCM)
    const authTag = cipher.getAuthTag()

    // Format de stockage : IV:AuthTag:EncryptedContent
    // Tout en hexadécimal pour la simplicité de stockage texte
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
    const masterKey = getMasterKey()

    // Décomposition
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format')
    }

    const [ivHex, authTagHex, contentHex] = parts

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    // Création du decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv)
    decipher.setAuthTag(authTag)

    // Déchiffrement
    let decrypted = decipher.update(contentHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}
