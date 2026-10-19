import { prisma } from "$lib/server/prisma.server";
import { error, type RequestEvent } from "@sveltejs/kit";

export async function load({ locals }: RequestEvent) {
    try {

        // Get user profile picture URL
        const image_url = locals.user && locals.authenticated
            ? `/api/user/image/${encodeURIComponent(locals.user.username)}`
            : null;
    
        // Get tokens for user
        let token_data = null;
        if (locals.user && locals.authenticated) {
            token_data = await prisma.tokens.findUnique({
                where: { user_id: locals.user.id },
                select: { tokens: true }
            });
        }
      
        return {
            my_pfp: image_url,
            tokens: token_data ? token_data.tokens : 0
        };
    } catch (e) {
        console.error("[KITES | ERROR]: ", e);
        throw error(500, "Interal Server Error");
    }
};