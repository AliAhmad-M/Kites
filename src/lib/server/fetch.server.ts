/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { prisma } from "$lib/server/prisma.server";

// Fetch posts with an optional title search.
export async function fetch_posts(
    locals: any,
    topic: string | undefined,
    page: number = 1,
    filters: { search?: string } = {}
) {
    const user = locals.user;

    const where: any = {};
    if (topic) where.topic = topic;
    if (filters.search?.trim()) where.heading = { contains: filters.search.trim() };

    let posts = await prisma.forumPosts.findMany({
        where,
        orderBy: { likes: 'desc' },
        // Take 10 posts per page
        skip: (page - 1) * 10,
        take: 10,
        include: {
            // Get cover image
            image: {
                select: { id: true }
            },

            // Get author profile picture
            author: {
                select: {
                    rank: true,
                    image: {
                        select: { id: true }
                    }
                }
            },

            // Get user like status
            user_likes: user ? {
                where: { user_id: user.id },
                select: { id: true }
            } : false
        }
    });

    // Attatch cover image, author pfp and like status to the posts
    const processed_posts = await Promise.all(
        posts.map(async (post) => {
            return {
                ...post,
                image_url: post.image ? `/api/forum/image/${post.id}` : null,
                author_rank: post.author.rank,
                author_pfp: post.author.image
                    ? `/api/user/image/${encodeURIComponent(post.author_name)}`
                    : null,
                user_liked: post.user_likes ? post.user_likes.length > 0 : false
            };
        })
    );
    
    return { posts: processed_posts };
}
