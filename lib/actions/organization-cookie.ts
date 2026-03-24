'use server'

import { cookies } from 'next/headers'

const COOKIE_NAME = 'keystone-org-id'

export async function setOrganizationCookie(organizationId: string) {
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, organizationId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 an
        sameSite: 'lax',
    })
}

export async function getOrganizationCookie() {
    const cookieStore = await cookies()
    return cookieStore.get(COOKIE_NAME)?.value
}

export async function clearOrganizationCookie() {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}
