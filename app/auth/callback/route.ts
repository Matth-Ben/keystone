import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const next = searchParams.get('next') ?? '/clients'

    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    const buildRedirect = (path: string) => {
        if (isLocalEnv) return NextResponse.redirect(`${origin}${path}`)
        if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${path}`)
        return NextResponse.redirect(`${origin}${path}`)
    }

    const supabase = await createClient()

    // Flow token_hash (email template personnalisé — recommandé pour SSR)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null

    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash })
        if (!error) return buildRedirect(next)
    }

    // Flow PKCE (fallback — code verifier doit être présent dans les cookies)
    const code = searchParams.get('code')

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) return buildRedirect(next)
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
