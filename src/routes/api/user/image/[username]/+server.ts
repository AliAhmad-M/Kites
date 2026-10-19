import { prisma } from "$lib/server/prisma.server";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
    const image = await prisma.userImages.findUnique({
        where: { username: params.username },
        select: { binary_blob: true, mime_type: true }
    });

    if (!image) {
        throw error(404, "Image not found");
    }

    return new Response(image.binary_blob, {
        headers: {
            "Content-Type": image.mime_type,
            "Cache-Control": "public, max-age=3600"
        }
    });
};