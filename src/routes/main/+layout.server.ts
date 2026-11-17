import { error, type RequestEvent } from "@sveltejs/kit";

export async function load({ locals }: RequestEvent) {
    try {

        // Get user profile picture URL
        const image_url = locals.user && locals.authenticated
            ? `/api/user/image/${encodeURIComponent(locals.user.username)}`
            : null;
    
        return {
            my_pfp: image_url
        };
    } catch (e) {
        console.error("[KITES | ERROR]: ", e);
        throw error(500, "Interal Server Error");
    }
};
