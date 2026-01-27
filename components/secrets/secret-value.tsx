'use client'

import { useState } from 'react'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { revealSecret } from '@/lib/actions/secrets'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SecretValueProps {
    secretId: string
    className?: string
}

export function SecretValue({ secretId, className }: SecretValueProps) {
    const [revealed, setRevealed] = useState(false)
    const [value, setValue] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleReveal = async () => {
        if (revealed) {
            setRevealed(false)
            return
        }

        if (value) {
            setRevealed(true)
            return
        }

        try {
            setLoading(true)
            const decrypted = await revealSecret(secretId)
            setValue(decrypted)
            setRevealed(true)
        } catch (error) {
            toast.error('Impossible de déchiffrer le secret')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        let targetValue = value
        if (!targetValue) {
            try {
                setLoading(true)
                targetValue = await revealSecret(secretId)
                setValue(targetValue)
            } catch (error) {
                toast.error('Erreur lors de la copie')
                setLoading(false)
                return
            }
        }
        setLoading(false)

        if (targetValue) {
            navigator.clipboard.writeText(targetValue)
            setCopied(true)
            toast.success('Copié dans le presse-papier')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <div className="font-mono text-sm border rounded px-2 py-1 bg-muted/50 min-w-[200px] max-w-[300px] select-all truncate">
                {revealed && value ? value : "••••••••••••••••"}
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReveal} disabled={loading}>
                {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} disabled={loading}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
    )
}
