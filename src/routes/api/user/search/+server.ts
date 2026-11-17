import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.server';

export async function GET({ url }) {
    const query = url.searchParams.get('q')?.trim().slice(0, 32) ?? '';
    if (query.length < 2 || !/^[a-zA-Z0-9_-]+$/.test(query)) {
        return json({ users: [] });
    }

    const users = await prisma.users.findMany({
        where: { username: { contains: query } },
        orderBy: { username: 'asc' },
        take: 6,
        select: {
            username: true,
            image: { select: { id: true } }
        }
    });

    return json({
        users: users.map((user) => ({
            username: user.username,
            image: user.image
                ? `/api/user/image/${encodeURIComponent(user.username)}`
                : '/profile.jpg'
        }))
    });
}
