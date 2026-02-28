import { NextResponse } from 'next/server'
import { refresh } from '@payloadcms/next/auth'
import config from '@payload-config'

export async function POST(req: Request) {
    try {
        const result = await refresh({ config })

        if (!result || !result.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('Token refresh error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
