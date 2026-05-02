import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/types/database'

export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        // {
        //     cookies: {
        //         getAll() {
        //             return document.cookie
        //                 .split(';')
        //                 .map((c) => c.trim())
        //                 .filter(Boolean)
        //                 .map((c) => {
        //                     const [name, value] = c.split('=')
        //                     return { name, value }
        //                 })
        //         },
        //         setAll(cookiesToSet) {
        //             cookiesToSet.forEach(({ name, value, options }) => {
        //                 document.cookie = [
        //                     name,
        //                     '=',
        //                     value,
        //                     options?.path ? `; path=${options.path}` : '; path=/',
        //                     options?.domain ? `; domain=${options.domain}` : '',
        //                     options?.maxAge ? `; max-age=${options.maxAge}` : '',
        //                     options?.httpOnly ? '; httpOnly' : '',
        //                     options?.secure ? '; secure' : '',
        //                 ].join('')
        //             })
        //         },
        //     },
        // }
    )
}