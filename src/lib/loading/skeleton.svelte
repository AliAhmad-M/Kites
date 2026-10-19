<script lang="ts">
    type SkeletonType = "posts" | "user" | "post-detail" | "comments";

    let { type, count = 3 } = $props<{
        type: SkeletonType;
        count?: number;
    }>();
</script>

<div class="skeleton-screen" role="status" aria-busy="true" aria-label="Loading content">
    {#if type === "posts"}
        <div class="posts-skeleton">
            {#each Array.from({ length: count }) as _}
                <article class="post-skeleton" aria-hidden="true">
                    <div class="post-header">
                        <span class="shape avatar"></span>
                        <span class="shape username"></span>
                        <span class="shape topic"></span>
                    </div>
                    <span class="shape title"></span>
                    <span class="shape title short"></span>
                </article>
            {/each}
        </div>
    {:else if type === "user"}
        <div class="user-skeleton" aria-hidden="true">
            <span class="shape profile-avatar"></span>
            <div class="user-lines">
                <span class="shape user-name"></span>
                <span class="shape email"></span>
            </div>
        </div>
    {:else if type === "post-detail"}
        <div class="detail-skeleton" aria-hidden="true">
            <div class="post-header">
                <span class="shape avatar"></span>
                <span class="shape username"></span>
                <span class="shape topic"></span>
            </div>
            <span class="shape detail-title"></span>
            <span class="shape paragraph"></span>
            <span class="shape paragraph"></span>
            <span class="shape paragraph short"></span>
            <span class="shape media"></span>
        </div>
    {:else}
        <div class="comments-skeleton" aria-hidden="true">
            {#each Array.from({ length: count }) as _}
                <div class="comment-skeleton">
                    <span class="shape avatar"></span>
                    <div class="comment-lines">
                        <span class="shape comment-name"></span>
                        <span class="shape paragraph"></span>
                        <span class="shape paragraph short"></span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .skeleton-screen {
        width: 100%;
    }

    .posts-skeleton {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .post-skeleton {
        width: 45vw;
        max-width: 900px;
        box-sizing: border-box;
        margin: 1rem 4rem 1rem 6rem;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        background: var(--color-background-secondary);
    }

    .post-header,
    .user-skeleton,
    .comment-skeleton {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .post-header {
        margin-bottom: 1rem;
    }

    .shape {
        display: block;
        flex: none;
        border-radius: 4px;
        background: linear-gradient(
            100deg,
            var(--color-background-primary) 30%,
            color-mix(in srgb, var(--color-background-primary) 65%, var(--color-text-secondary)) 50%,
            var(--color-background-primary) 70%
        );
        background-size: 200% 100%;
        animation: shimmer 1.4s ease-in-out infinite;
    }

    .avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
    }

    .username {
        width: 7rem;
        height: 0.8rem;
    }

    .topic {
        width: 5rem;
        height: 0.8rem;
        margin-left: auto;
    }

    .title {
        width: 88%;
        height: 1rem;
        margin: 0.5rem 0;
    }

    .short {
        width: 55%;
    }

    .user-skeleton {
        width: 100%;
        max-width: 640px;
        box-sizing: border-box;
        padding: 2rem;
        border: 1px solid var(--color-navigation-border);
        border-radius: 1rem;
        background: var(--color-background-primary);
    }

    .profile-avatar {
        width: 6rem;
        height: 6rem;
        border-radius: 50%;
    }

    .user-lines,
    .comment-lines {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.75rem;
    }

    .user-name {
        width: min(14rem, 80%);
        height: 1.25rem;
    }

    .email {
        width: min(11rem, 70%);
        height: 0.8rem;
    }

    .detail-skeleton {
        max-width: 900px;
        margin: 0 auto;
        padding: 1.5rem;
        border-radius: 1rem;
        background: var(--color-background-secondary);
    }

    .detail-title {
        width: 75%;
        height: 2.5rem;
        margin: 1.5rem 0;
    }

    .paragraph {
        width: 100%;
        height: 0.9rem;
        margin: 0.8rem 0;
    }

    .media {
        width: 100%;
        aspect-ratio: 16 / 9;
        margin-top: 1.5rem;
    }

    .comments-skeleton {
        display: flex;
        flex-direction: column;
    }

    .comment-skeleton {
        align-items: flex-start;
        padding: 1rem 0;
        border-bottom: 1px solid var(--color-navigation-border);
    }

    .comment-name {
        width: 8rem;
        height: 0.8rem;
    }

    @keyframes shimmer {
        to {
            background-position: -200% 0;
        }
    }

    @media (max-width: 1200px) {
        .post-skeleton {
            width: 64vw;
        }
    }

    @media (max-width: 768px) {
        .post-skeleton {
            width: 80vw;
            margin-right: auto;
            margin-left: auto;
        }
    }

    @media (max-width: 480px) {
        .user-skeleton {
            padding: 1.25rem;
        }

        .profile-avatar {
            width: 4rem;
            height: 4rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .shape {
            animation: none;
        }
    }
</style>