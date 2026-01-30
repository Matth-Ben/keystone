
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get('orgId')
    const next = searchParams.get('next') || '/clients'

    if (orgId) {
        const cookieStore = await cookies()
        cookieStore.delete('keystone-org-id')
        cookieStore.set('keystone-org-id', orgId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 an
        })
    }

    redirect(next)
}
