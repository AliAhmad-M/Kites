import { fetch_posts } from '$lib/server/fetch.server.js';
import { error } from '@sveltejs/kit';

export async function load({ locals, url }) {
    const search = url.searchParams.get('search') || undefined;
    const streamed = (async () => {
        try {
            return await fetch_posts(locals, undefined, 1, { search });
        } catch (e) {
            console.error("[KITES | ERROR]: Failed to fetch posts: ", e);
            throw error(500, { message: "Internal Server Error" });
        }
    })();
    
    return { streamed, search };
}
