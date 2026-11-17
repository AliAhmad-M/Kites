/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '$lib/server/prisma.server';
import { error } from '@sveltejs/kit';

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
                    id: true,
                    username: true,
                    bio: true,
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
            const [posts, comments, liked_posts, post_count, comment_count, liked_count] = await Promise.all([
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
                        image: { select: { id: true } },
                        user_likes: locals.user ? {
                            where: { user_id: locals.user.id },
                            select: { id: true }
                        } : false
                    }
                }),
                prisma.forumComments.findMany({
                    where: { author_name: user.username },
                    orderBy: { id: 'desc' },
                    take: 8,
                    select: {
                        id: true,
                        comment: true,
                        post: {
                            select: {
                                id: true,
                                heading: true,
                                topic: true,
                                image: { select: { id: true } }
                            }
                        }
                    }
                }),
                prisma.forumLikes.findMany({
                    where: { user_id: user.id },
                    orderBy: { id: 'desc' },
                    take: 8,
                    select: {
                        post: {
                            select: {
                                id: true,
                                heading: true,
                                topic: true,
                                likes: true,
                                image: { select: { id: true } },
                                user_likes: locals.user ? {
                                    where: { user_id: locals.user.id },
                                    select: { id: true }
                                } : false
                            }
                        }
                    }
                }),
                prisma.forumPosts.count({ where: post_filter }),
                prisma.forumComments.count({ where: { author_name: user.username } }),
                prisma.forumLikes.count({ where: { user_id: user.id } })
            ]);

            const profile_posts = posts.map(({ image, user_likes, ...post }) => ({
                ...post,
                image_url: image ? `/api/forum/image/${post.id}` : null,
                user_liked: user_likes ? user_likes.length > 0 : false
            }));
            const profile_comments = comments.map(({ post, ...comment }) => ({
                ...comment,
                post: {
                    ...post,
                    image_url: post.image ? `/api/forum/image/${post.id}` : null
                }
            }));
            const profile_likes = liked_posts.map(({ post }) => {
                const { image, user_likes, ...liked_post } = post;
                return {
                    ...liked_post,
                    image_url: image ? `/api/forum/image/${liked_post.id}` : null,
                    user_liked: user_likes ? user_likes.length > 0 : false
                };
            });
            
            // Return profile page data
            return {
                email: email,
                rank: rank,
                bio: user.bio,
                image: image_url,
                posts: profile_posts,
                comments: profile_comments,
                liked_posts: profile_likes,
                post_count,
                comment_count,
                liked_count
            };
        } catch (e) {
            console.error('[KITES | ERROR]: ', e);
            throw error(500, { message: "Internal Server Error" });
        }
    })();
    
    return { streamed };
}
