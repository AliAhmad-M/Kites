<script lang="ts">
	import { page } from "$app/state";
    import { Thumbnail, Skeleton, PostSearch } from "$lib";
    import { onDestroy, onMount, tick } from "svelte";
   
    const { data } = $props();
    let posts: any = $state([]);
    let current_page = $state(1);
   
    let is_initial_load = $state(true);
    let is_loading = $state(false);
    let has_more_posts = $state(true);
    let search_query = $state('');
    let applied_search = $state('');
    let search_error = $state('');
    let request_revision = 0;
    let search_controller: AbortController | null = null;
    let sentinel: HTMLDivElement;
    let observer: IntersectionObserver | null = null;
   
    // Handle streamed data when it resolves
    $effect(() => {
        if (data.streamed) {
            data.streamed.then(streamed_data => {
                posts = streamed_data.posts || [];
                
                has_more_posts = posts.length === 10;
                is_initial_load = false;
                setup_observer();
            });
        }
    });

    function setup_observer() {
        // Clean up previous observer if it exists
        if (observer) {
            observer.disconnect();
        }

        // Create a new observer
        observer = new IntersectionObserver((entries) => {
            // Load when reaching end of page
            if (entries[0].isIntersecting && !is_loading && has_more_posts) {
                load_more_posts();
            }
        }, {
            rootMargin: '200px',
            threshold: 0.1
        });
        
        // Start observing if sentinel exists
        if (sentinel) {
            observer.observe(sentinel);
        }
    }
    
    async function load_more_posts() {
        if (is_loading || !has_more_posts) return;
        const load_revision = request_revision;
        
        try {
            is_loading = true;
            const next_page = current_page + 1;
            
            const params = new URLSearchParams({ page: String(next_page), topic: page.params.topic });
            if (applied_search) params.set('search', applied_search);
            const response = await fetch(`/api/forum/load?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const new_data = await response.json();
            if (load_revision !== request_revision) return;
            
            if (new_data.posts && new_data.posts.length > 0) {
                // Append new posts to existing ones
                posts = [...posts, ...new_data.posts];
                current_page = next_page;
                has_more_posts = new_data.posts.length === 10;
                
                // Re-establish the observer after DOM updates
                setTimeout(() => {
                    if (sentinel && observer) {
                        observer.observe(sentinel);
                    }
                }, 100);
            } else {
                has_more_posts = false;
            }
        } catch (e) {
            if (load_revision === request_revision) {
                console.error('[KITES | ERROR]: Error loading more posts: ', e);
                has_more_posts = false;
            }
        } finally {
            if (request_revision === load_revision) is_loading = false;
        }
    }

    async function search_posts(query: string) {
        const revision = ++request_revision;
        search_controller?.abort();
        search_controller = new AbortController();
        search_error = '';
        search_query = query;
        is_loading = true;
        observer?.disconnect();

        try {
            const params = new URLSearchParams({ page: '1', topic: page.params.topic });
            if (query) params.set('search', query);
            const response = await fetch(`/api/forum/load?${params.toString()}`, { signal: search_controller.signal });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();

            if (revision !== request_revision) return;
            posts = result.posts || [];
            current_page = 1;
            has_more_posts = posts.length === 10;
            applied_search = query;
            await tick();
            setup_observer();
        } catch (error) {
            if (revision === request_revision && !(error instanceof DOMException && error.name === 'AbortError')) {
                search_error = 'Could not search posts. Please try again.';
                console.error('[KITES | ERROR]: Topic search failed:', error);
            }
        } finally {
            if (revision === request_revision) is_loading = false;
        }
    }
   
    onMount(() => {
        // If we already have posts (SSR case), setup the observer immediately
        if (posts.length > 0 && !is_initial_load) {
            setup_observer();
        }
    });
   
    onDestroy(() => {
        search_controller?.abort();
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    });
</script>

<svelte:head>
    <title>Kites | {page.params.topic}</title>
</svelte:head>

<div class="posts-container">
    <div class="feed-search-row">
        <PostSearch bind:value={search_query} onsearch={search_posts} busy={is_loading} />
    </div>
    <header class="feed-heading">
        <h1>{page.params.topic}</h1>
        <span>Posts filed under the topic: {page.params.topic}</span>
        {#if search_error}<p class="search-error" role="alert">{search_error}</p>{/if}
    </header>
    {#await data.streamed}
        <Skeleton type="posts" count={4}/>
    {:then posts_data}
        <div class="posts-list">
            {#each posts as post}
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
                <div class="empty-results"><h2>No posts found</h2><p>Try a different title search.</p></div>
            {/each}
        </div>        

    {/await}
   
    <!-- Always keep sentinel visible at the bottom -->
    <div bind:this={sentinel} class="sentinel">
        {#if is_loading && !is_initial_load}
            <Skeleton type="posts" count={2}/>
        {:else if !has_more_posts && posts.length > 0}
            <div class="end-message">No more posts to load</div>
        {/if}
    </div>
</div>

<style>
.posts-container {
	display: flex;
	flex-direction: column;
	width: 100%;
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

.feed-search-row {
	display: flex;
	justify-content: center;
	width: 100%;
	margin: 0 auto 1.5rem;
	padding: 0 1rem;
	box-sizing: border-box;
}

.feed-heading h1 {
	margin: 0;
	color: var(--color-text-primary);
	font-size: 1.8rem;
}

.feed-heading span {
	display: block;
	margin-top: 0.35rem;
	color: var(--color-text-secondary);
	font-size: 0.88rem;
}

.search-error {
	margin: 0.65rem 0 0;
	color: var(--color-red-primary);
	font-size: 0.8rem;
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

.posts-list {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.sentinel {
	padding: 1rem 0;
	margin-top: 1rem;
	width: 100%;
	min-height: 50px;
}

.end-message {
	text-align: center;
	padding: 1rem;
	color: var(--color-text-secondary);
}
</style>
