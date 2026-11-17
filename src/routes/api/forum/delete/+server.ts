import { prisma } from '$lib/server/prisma.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    try {
        const data = await request.json();
        const post_id = data.post_id;
        const author = data.author_name;
        
        if (!locals.user || !locals.authenticated) {
            return json(
                { error: 'Failed to delete comment' },
                { status: 401 }
            );
        }

        const user = await prisma.users.findUnique({
            where: { id: locals.user.id },
            select: { rank: true }
        });

        // Only author or admin can delete post
        if (locals.user?.username !== author && user?.rank !== 'Admin') {
            return json(
                { error: 'Failed to delete post' },
                { status: 401 }
            );
        }

        await prisma.forumPosts.delete({
            where: { id: post_id }
        });

        return json({ success: true });
    
    } catch (e) {
        return json({ error: `Internal server error: ${e}` }, { status: 500 });
    }
}
