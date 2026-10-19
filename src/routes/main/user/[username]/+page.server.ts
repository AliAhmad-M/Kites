/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '$lib/server/prisma.server';
import { error } from '@sveltejs/kit';
import { get_dashboard_data } from '$lib/server/dashboard.server';

export async function load({ params, locals }) {
    // Access username from route parameters
    const { username } = params;
    
    // Check user existence
    const user = await prisma.users.findUnique({
        where: { username: username },
        select: { id: true }
    });

    if (!user) {
        throw error(404, 'User not found')
    }

    const streamed = (async () => {
        try {
            // Get all user data
            const user = await prisma.users.findUnique({
                where: { username: username },
                select: {
                    username: true,
                    rank: true,
                    email: true,
                    image: {
                        select: { id: true }
                    }
                }
            });

            if (!user) {
                return {};
            }
            
            const is_owner = locals.user?.username === user.username;
            const email = is_owner ? user.email : null;
            const rank = user.rank;
            
            const image_url = user.image
                ? `/api/user/image/${encodeURIComponent(user.username)}`
                : null;

            const post_filter = { author_name: user.username };
            const [posts, post_count, likes_total] = await Promise.all([
                prisma.forumPosts.findMany({
                    where: post_filter,
                    orderBy: { id: 'desc' },
                    take: 8,
                    select: {
                        id: true,
                        heading: true,
                        topic: true,
                        type: true,
                        likes: true,
                        image: { select: { id: true } }
                    }
                }),
                prisma.forumPosts.count({ where: post_filter }),
                prisma.forumPosts.aggregate({
                    where: post_filter,
                    _sum: { likes: true }
                })
            ]);

            const profile_posts = posts.map(({ image, ...post }) => ({
                ...post,
                image_url: image ? `/api/forum/image/${post.id}` : null
            }));
            
            // Get admin dashboard stats
            const dashboard_data = is_owner && user.rank === "Admin"
                ? await get_dashboard_data(user.rank)
                : null;
    
            // Return profile page data
            return {
                email: email,
                rank: rank,
                image: image_url,
                posts: profile_posts,
                post_count,
                likes_received: likes_total._sum.likes ?? 0,
                admin_stats: dashboard_data
            };
        } catch (e) {
            console.error('[KITES | ERROR]: ', e);
            throw error(500, { message: "Internal Server Error" });
        }
    })();
    
    return { streamed };
}