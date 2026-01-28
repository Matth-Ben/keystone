'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export function AppearanceSettingsForm() {
    const [autoClearClipboard, setAutoClearClipboard] = useState(false)

    // Load setting from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('autoClearClipboard')
        if (saved !== null) {
            setAutoClearClipboard(saved === 'true')
        }
    }, [])

    // Save setting to localStorage when changed
    const handleToggle = (checked: boolean) => {
        setAutoClearClipboard(checked)
        localStorage.setItem('autoClearClipboard', String(checked))
        toast.success(
            checked
                ? 'Le presse-papier sera vidé automatiquement'
                : 'Le presse-papier ne sera plus vidé automatiquement'
        )
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {/* Auto-clear clipboard */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="auto-clear-clipboard" className="text-base">
                            Vider le presse-papier automatiquement
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Le presse-papier sera vidé après 30 secondes lors de la copie d'un secret
                        </p>
                    </div>
                    <Switch
                        id="auto-clear-clipboard"
                        checked={autoClearClipboard}
                        onCheckedChange={handleToggle}
                    />
                </div>
            </div>
        </div>
    )
}
