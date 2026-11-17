<script lang="ts">
    type SkeletonType = "posts" | "user" | "post-detail" | "comments";

    let { type, count = 3 } = $props<{
        type: SkeletonType;
        count?: number;
    }>();
</script>

<div class="skeleton-screen" class:profile-loading={type === "user"} role="status" aria-busy="true" aria-label="Loading content">
    {#if type === "posts"}
        <div class="posts-skeleton" aria-hidden="true">
            {#each Array.from({ length: count }) as _}
                <article class="post-skeleton">
                    <div class="post-header">
                        <span class="shape avatar"></span>
                        <span class="shape username"></span>
                        <span class="shape topic"></span>
                    </div>
                    <span class="shape title"></span>
                    <span class="shape title short"></span>
                    <span class="shape meta"></span>
                </article>
            {/each}
        </div>
    {:else if type === "user"}
        <div class="user-skeleton" aria-hidden="true">
            <span class="shape profile-avatar"></span>
            <div class="user-lines"><span class="shape user-name"></span><span class="shape email"></span></div>
        </div>
    {:else if type === "post-detail"}
        <div class="detail-skeleton" aria-hidden="true">
            <div class="post-header"><span class="shape avatar"></span><span class="shape username"></span><span class="shape topic"></span></div>
            <span class="shape detail-title"></span>
            <span class="shape paragraph"></span><span class="shape paragraph"></span><span class="shape paragraph short"></span>
            <span class="shape media"></span>
        </div>
    {:else}
        <div class="comments-skeleton" aria-hidden="true">
            {#each Array.from({ length: count }) as _}
                <div class="comment-skeleton"><span class="shape avatar"></span><div class="comment-lines"><span class="shape comment-name"></span><span class="shape paragraph"></span><span class="shape paragraph short"></span></div></div>
            {/each}
        </div>
    {/if}
</div>

<style>
.skeleton-screen {
	width: 100%;
}

.skeleton-screen.profile-loading {
	display: flex;
	justify-content: center;
}

.posts-skeleton {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.post-skeleton,
.detail-skeleton,
.user-skeleton {
	box-sizing: border-box;
	border: 1px solid var(--color-navigation-border);
	border-radius: 0.75rem;
	background: var(--color-background-secondary);
}

.post-skeleton {
	width: min(100% - 2rem, 760px);
	margin: 0.75rem auto;
	padding: 1.25rem 1.5rem;
}

.post-header,
.user-skeleton,
.comment-skeleton {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.post-header {
	margin-bottom: 1.25rem;
}

.shape {
	position: relative;
	display: block;
	flex: none;
	overflow: hidden;
	border-radius: 0.35rem;
	background: color-mix(in srgb, var(--color-text-secondary) 12%, var(--color-background-primary));
}

.shape::after {
	position: absolute;
	inset: 0;
	transform: translateX(-100%);
	background: linear-gradient(
		90deg,
		transparent,
		color-mix(in srgb, var(--color-text-secondary) 12%, transparent),
		transparent
	);
	animation: skeleton-shimmer 1.8s ease-in-out infinite;
	content: '';
}

.avatar {
	width: 2.25rem;
	height: 2.25rem;
	border-radius: 50%;
}

.username {
	width: 7rem;
	height: 0.75rem;
}

.topic {
	width: 4.5rem;
	height: 0.7rem;
	margin-left: auto;
}

.title {
	width: 82%;
	height: 1rem;
	margin: 0.7rem 0;
}

.short {
	width: 56%;
}

.meta {
	width: 7rem;
	height: 0.65rem;
	margin-top: 1.25rem;
}

.user-skeleton {
	width: min(100%, 640px);
	margin-inline: auto;
	padding: 2rem;
}

.profile-avatar {
	width: 5rem;
	height: 5rem;
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
	height: 1.1rem;
}

.email {
	width: min(11rem, 70%);
	height: 0.75rem;
}

.detail-skeleton {
	max-width: 900px;
	margin: 0 auto;
	padding: clamp(1.25rem, 4vw, 2.5rem);
}

.detail-title {
	width: 75%;
	height: 2rem;
	margin: 1.5rem 0;
}

.paragraph {
	width: 100%;
	height: 0.75rem;
	margin: 0.85rem 0;
}

.media {
	width: 100%;
	aspect-ratio: 16 / 9;
	margin-top: 1.5rem;
	border-radius: 0.6rem;
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
	height: 0.75rem;
}
@keyframes skeleton-shimmer {
	100% {
		transform: translateX(100%);
	}
}
@media (max-width: 600px) {
	.post-skeleton {
		width: calc(100% - 1rem);
		margin: 0.5rem auto;
		padding: 1rem;
	}

	.user-skeleton {
		padding: 1.25rem;
	}

	.profile-avatar {
		width: 4rem;
		height: 4rem;
	}
}
@media (prefers-reduced-motion: reduce) {
	.shape::after {
		animation: none;
	}
}
</style>
