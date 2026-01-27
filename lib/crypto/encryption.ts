/**
 * Utilitaire de chiffrement pour les mots de passe
 * Utilise Web Crypto API (natif dans les navigateurs modernes)
 * 
 * IMPORTANT : Le chiffrement se fait côté client AVANT l'envoi à Supabase
 * La clé de chiffrement est dérivée du mot de passe de l'utilisateur
 */

// Convertir une string en ArrayBuffer
function str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length)
    const bufView = new Uint8Array(buf)
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i)
    }
    return buf
}

// Convertir un ArrayBuffer en string
function ab2str(buf: ArrayBuffer): string {
    return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)))
}

// Générer une clé de chiffrement à partir d'un mot de passe
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    )

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    )
}

/**
 * Chiffre un texte avec AES-GCM
 * @param plaintext - Texte en clair à chiffrer
 * @param password - Mot de passe pour dériver la clé (typiquement le mot de passe de l'utilisateur)
 * @returns String base64 contenant : salt + iv + encrypted data
 */
export async function encrypt(plaintext: string, password: string): Promise<string> {
    try {
        const enc = new TextEncoder()

        // Générer un salt aléatoire
        const salt = window.crypto.getRandomValues(new Uint8Array(16))

        // Dériver la clé depuis le mot de passe
        const key = await deriveKey(password, salt)

        // Générer un IV (Initialization Vector) aléatoire
        const iv = window.crypto.getRandomValues(new Uint8Array(12))

        // Chiffrer
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            enc.encode(plaintext)
        )

        // Combiner salt + iv + encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
        combined.set(salt, 0)
        combined.set(iv, salt.length)
        combined.set(new Uint8Array(encrypted), salt.length + iv.length)

        // Convertir en base64
        return btoa(ab2str(combined.buffer))
    } catch (error) {
        console.error('Encryption error:', error)
        throw new Error('Failed to encrypt data')
    }
}

/**
 * Déchiffre un texte chiffré avec AES-GCM
 * @param ciphertext - Texte chiffré en base64
 * @param password - Mot de passe utilisé pour le chiffrement
 * @returns Texte en clair
 */
export async function decrypt(ciphertext: string, password: string): Promise<string> {
    try {
        const dec = new TextDecoder()

        // Décoder depuis base64
        const combined = new Uint8Array(str2ab(atob(ciphertext)))

        // Extraire salt, iv et encrypted data
        const salt = combined.slice(0, 16)
        const iv = combined.slice(16, 28)
        const encrypted = combined.slice(28)

        // Dériver la clé depuis le mot de passe
        const key = await deriveKey(password, salt)

        // Déchiffrer
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            encrypted
        )

        return dec.decode(decrypted)
    } catch (error) {
        console.error('Decryption error:', error)
        throw new Error('Failed to decrypt data - wrong password or corrupted data')
    }
}

/**
 * Génère un mot de passe aléatoire sécurisé
 * @param length - Longueur du mot de passe (défaut: 32)
 * @returns Mot de passe aléatoire
 */
export function generateSecurePassword(length: number = 32): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    const randomValues = new Uint8Array(length)
    window.crypto.getRandomValues(randomValues)

    let password = ''
    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length]
    }

    return password
}

/**
 * Hash un mot de passe avec SHA-256 (pour la clé de chiffrement)
 * @param password - Mot de passe à hasher
 * @returns Hash en base64
 */
export async function hashPassword(password: string): Promise<string> {
    const enc = new TextEncoder()
    const data = enc.encode(password)
    const hash = await window.crypto.subtle.digest('SHA-256', data)
    return btoa(ab2str(hash))
}
