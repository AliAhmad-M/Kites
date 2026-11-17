/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetch_posts } from "$lib/server/fetch.server";
import { error } from "@sveltejs/kit";

export async function load({ params, locals }: any) {
    const { topic } = params;

    if (!['Art', 'Science', 'Philosophy', 'Nature', 'Tech', 'Gaming'].includes(topic)) {
        throw error(404, { message: "Topic does not exist" });
    }

    const streamed = (async () => {
        try {
            return await fetch_posts(locals, topic);
        } catch (e) {
            console.error("[KITES | ERROR]: Failed to fetch posts: ", e);
            throw error(500, { message: "Internal Server Error" });
        }
    })();
    
    return { streamed };
}
