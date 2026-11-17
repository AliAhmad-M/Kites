import { prisma } from '$lib/server/prisma.server.js';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    try {
        const data = await request.formData();
        const user = locals.user;

        // User must be signed in to create post
        if (!user) {
            return json(
                { error: 'User must be signed in' },
                { status: 401 }
            );
        }

        const topic = data.get('topic');
        if (typeof topic !== 'string' || !['Art', 'Science', 'Philosophy', 'Nature', 'Tech', 'Gaming'].includes(topic)) {
            return json({ error: 'Choose a valid topic' }, { status: 400 });
        }

        // Get picture for post
        const image_file = data.get('image') as File;

        // Check size of picture
        if (image_file && image_file.size > 5242880) {
            return json(
                { error: 'Image is too large' },
                { status: 400 }
            );
        }

        // Handle creation transaction
        const result = await prisma.$transaction(async (t) => {
            // Create the post
            const post = await t.forumPosts.create({
                data: {
                    heading: data.get('heading') as string,
                    content: data.get('content') as string,
                    author_name: user.username,
                    topic,
                    type: 'Blog'
                }
            });

            // Store the image if there was one
            if (image_file) {
                const array_buffer = await image_file.arrayBuffer();
                const buffer = Buffer.from(array_buffer);

                await t.forumImages.create({
                    data: {
                        file_name: image_file.name,
                        mime_type: image_file.type ?? undefined,
                        size: image_file.size ?? undefined,
                        binary_blob: buffer,
                        post_id: post.id
                    }
                });
            }

            // Return ID of the created post
            return post;
        },
        {
            maxWait: 10000,
            timeout: 15000
        });

        return json({ success: true, post_id: result.id, topic: result.topic });

    } catch (e) {
        return json({ error: `Internal server error: ${e}` }, { status: 500 });
    }
}
