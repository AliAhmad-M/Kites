/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { prisma } from "$lib/server/prisma.server";

// Fetching featured posts
export async function fetch_featured_posts() {
    const posts = await prisma.forumPosts.findMany({
        take: 5,
        orderBy: { likes: 'desc' },
        include: {
            // Get author profile picture
            author: {
                select: {
                    image: {
                        select: { id: true }
                    }
                }
            }
        }
    });

    // Attatch profile picture URL to the post
    const processed_posts = await Promise.all(
        posts.map(async (post) => {
            return {
                ...post,
                author_pfp: post.author.image
                    ? `/api/user/image/${encodeURIComponent(post.author_name)}`
                    : null
            };
        })
    );

    return processed_posts;
}

// Fetch all posts
export async function fetch_posts(locals: any, topic: string | undefined, page: number = 1) {
    const user = locals.user;

    let posts = await prisma.forumPosts.findMany({
        where: topic ? { topic: topic } : {},
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
                author_pfp: post.author.image
                    ? `/api/user/image/${encodeURIComponent(post.author_name)}`
                    : null,
                user_liked: post.user_likes ? post.user_likes.length > 0 : false
            };
        })
    );
    
    return { posts: processed_posts };
}