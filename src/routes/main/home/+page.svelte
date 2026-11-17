<script lang="ts">
    import { Thumbnail, Skeleton, PostSearch } from "$lib";
    import { onDestroy, onMount, tick } from "svelte";

    const { data } = $props();
    let posts: any[] = $state([]);
    let current_page = $state(1);
    let is_initial_load = $state(true);
    let is_loading = $state(false);
    let has_more_posts = $state(true);
    let search_query = $state(data.search ?? "");
    let applied_search = $state(data.search ?? "");
    let filter_error = $state("");
    let request_revision = 0;
    let search_controller: AbortController | null = null;

    let sentinel: HTMLDivElement;
    let observer: IntersectionObserver | null = null;

    $effect(() => {
        const streamed = data.streamed;
        if (!streamed) return;

        streamed.then((streamed_data) => {
            posts = streamed_data.posts || [];
            has_more_posts = posts.length === 10;
            is_initial_load = false;
            setup_observer();
        }).catch((error) => {
            console.error('[KITES | ERROR]: Failed to load posts:', error);
            is_initial_load = false;
        });
    });

    function setup_observer() {
        observer?.disconnect();
        observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !is_loading && has_more_posts) load_more_posts();
        }, { rootMargin: '200px', threshold: 0.1 });
        if (sentinel) observer.observe(sentinel);
    }

    function create_posts_url(target_page: number) {
        const params = new URLSearchParams({ page: String(target_page), topic: '' });
        if (applied_search) params.set('search', applied_search);
        return `/api/forum/load?${params.toString()}`;
    }

    async function apply_search(query: string) {
        const revision = ++request_revision;
        search_controller?.abort();
        search_controller = new AbortController();
        filter_error = '';
        search_query = query;
        const next_search = query.trim();
        is_loading = true;
        observer?.disconnect();

        try {
            const params = new URLSearchParams({ page: '1', topic: '' });
            if (next_search) params.set('search', next_search);

            const response = await fetch(`/api/forum/load?${params.toString()}`, { signal: search_controller.signal });
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const result = await response.json();

            if (revision !== request_revision) return;
            posts = result.posts || [];
            current_page = 1;
            has_more_posts = posts.length === 10;
            applied_search = next_search;
            is_initial_load = false;
            await tick();
            setup_observer();
        } catch (error) {
            if (revision === request_revision && !(error instanceof DOMException && error.name === 'AbortError')) {
                filter_error = 'Could not load posts. Please try again.';
                console.error('[KITES | ERROR]: Failed to filter posts:', error);
            }
        } finally {
            if (revision === request_revision) is_loading = false;
        }
    }

    async function load_more_posts() {
        if (is_loading || !has_more_posts) return;
        is_loading = true;
        const revision = request_revision;
        const next_page = current_page + 1;

        try {
            const response = await fetch(create_posts_url(next_page));
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const result = await response.json();
            if (revision !== request_revision) return;
            const next_posts = result.posts || [];
            posts = [...posts, ...next_posts];
            current_page = next_page;
            has_more_posts = next_posts.length === 10;
            await tick();
            if (sentinel && observer) observer.observe(sentinel);
        } catch (error) {
            if (revision === request_revision) {
                console.error('[KITES | ERROR]: Failed to load more posts:', error);
                has_more_posts = false;
            }
        } finally {
            if (revision === request_revision) is_loading = false;
        }
    }

    onMount(() => {
        if (!is_initial_load) setup_observer();
    });

    onDestroy(() => {
        observer?.disconnect();
        search_controller?.abort();
    });
</script>

<svelte:head>
    <title>Kites | Home</title>
</svelte:head>

<div class="posts-container">
    <div class="feed-search-row">
        <PostSearch bind:value={search_query} onsearch={apply_search} busy={is_loading} />
    </div>
    <header class="feed-heading">
        <h1>All Posts</h1>
        <span>Browse the latest writing from across Kites.</span>
        {#if filter_error}<p class="filter-error" role="alert">{filter_error}</p>{/if}
    </header>

    {#if is_initial_load}
        <Skeleton type="posts" count={4}/>
    {:else}
        <div class="posts-list">
            {#each posts as post (post.id)}
                <Thumbnail
                    post_id={post.id}
                    pfp={post.author_pfp}
                    username={post.author_name}
                    author_rank={post.author_rank}
                    topic={post.topic}
                    heading={post.heading}
                    user_liked={post.user_liked}
                    image={post.image_url}
                    type={post.type}
                />
            {:else}
                <div class="empty-results">
                    <h2>No posts found</h2>
                    <p>Try a different title search.</p>
                </div>
            {/each}
        </div>
    {/if}

    <div bind:this={sentinel} class="sentinel">
        {#if is_loading && !is_initial_load}
            <Skeleton type="posts" count={2}/>
        {:else if !has_more_posts && posts.length > 0}
            <div class="end-message">You’re all caught up.</div>
        {/if}
    </div>
</div>

<style>
.posts-container {
	display: flex;
	flex-direction: column;
	width: 100%;
}

.feed-search-row {
	display: flex;
	justify-content: center;
	width: 100%;
	margin: 0 auto 1.5rem;
	padding: 0 1rem;
	box-sizing: border-box;
}

.feed-heading {
	align-self: stretch;
	width: 100%;
	box-sizing: border-box;
	margin: 0 0 1.25rem;
	padding: 0.25rem 2rem 1rem;
	border-bottom: 1px solid var(--color-navigation-border);
	text-align: left;
}

.feed-heading h1 {
	margin: 0;
	color: var(--color-text-primary);
	font-size: clamp(1.5rem, 3vw, 2rem);
	line-height: 1.2;
}

.feed-heading span {
	display: block;
	margin-top: 0.35rem;
	color: var(--color-text-secondary);
	font-size: 0.88rem;
}

.filter-error {
	margin: 0.65rem 0 0;
	color: var(--color-red-primary);
	font-size: 0.8rem;
}

.posts-list {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.empty-results {
	width: min(100% - 2rem, 760px);
	box-sizing: border-box;
	margin: 1rem auto;
	padding: 2.5rem 1rem;
	border: 1px solid var(--color-navigation-border);
	border-radius: 0.65rem;
	text-align: center;
}

.empty-results h2 {
	margin: 0 0 0.35rem;
	color: var(--color-text-primary);
	font-size: 1.1rem;
}

.empty-results p {
	margin: 0;
	color: var(--color-text-secondary);
	font-size: 0.9rem;
}

.sentinel {
	width: 100%;
	min-height: 50px;
	margin-top: 1rem;
	padding: 1rem 0;
}

.end-message {
	padding: 1rem;
	color: var(--color-text-secondary);
	text-align: center;
}
</style>
