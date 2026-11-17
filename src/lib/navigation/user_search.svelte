<script lang="ts">
    import { goto } from '$app/navigation';
    import { onDestroy } from 'svelte';

    let { page_layout = false } = $props<{ page_layout?: boolean }>();

    type UserResult = { username: string; image: string };

    let query = $state('');
    let users: UserResult[] = $state([]);
    let is_open = $state(false);
    let is_loading = $state(false);
    let has_error = $state(false);
    let active_index = $state(-1);
    let request_id = 0;
    let search_timeout: ReturnType<typeof setTimeout> | undefined;
    let blur_timeout: ReturnType<typeof setTimeout> | undefined;
    let search_controller: AbortController | undefined;

    function handle_input() {
        is_open = true;
        active_index = -1;
        has_error = false;
        clearTimeout(search_timeout);
        search_controller?.abort();
        const current_request = ++request_id;
        const search_query = query.trim();

        if (search_query.length < 2 || !/^[a-zA-Z0-9_-]+$/.test(search_query)) {
            users = [];
            is_loading = false;
            return;
        }

        is_loading = true;
        search_timeout = setTimeout(async () => {
            const controller = new AbortController();
            search_controller = controller;
            try {
                const response = await fetch(`/api/user/search?q=${encodeURIComponent(search_query)}`, {
                    signal: controller.signal
                });
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const result = await response.json();
                if (current_request === request_id) users = result.users || [];
            } catch (error) {
                if (current_request === request_id && !(error instanceof DOMException && error.name === 'AbortError')) {
                    has_error = true;
                    users = [];
                }
            } finally {
                if (current_request === request_id) is_loading = false;
            }
        }, 200);
    }

    function open_results() {
        clearTimeout(blur_timeout);
        is_open = true;
    }

    function close_results() {
        blur_timeout = setTimeout(() => is_open = false, 150);
    }

    function visit_user(username: string) {
        is_open = false;
        query = '';
        users = [];
        goto(`/main/user/${encodeURIComponent(username)}`);
    }

    function handle_keydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            is_open = false;
            active_index = -1;
            return;
        }

        if (!users.length) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            active_index = (active_index + 1) % users.length;
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            active_index = active_index <= 0 ? users.length - 1 : active_index - 1;
        } else if (event.key === 'Enter' && is_open) {
            event.preventDefault();
            visit_user(users[active_index >= 0 ? active_index : 0].username);
        }
    }

    function clear_search() {
        query = '';
        users = [];
        is_loading = false;
        active_index = -1;
        request_id++;
        search_controller?.abort();
        clearTimeout(search_timeout);
    }

    onDestroy(() => {
        clearTimeout(search_timeout);
        clearTimeout(blur_timeout);
        search_controller?.abort();
    });
</script>

<div class="user-search" class:page-layout={page_layout} onkeydown={handle_keydown}>
    <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7"></circle>
        <path d="m20 20-4-4"></path>
    </svg>
    <input
        type="search"
        bind:value={query}
        oninput={handle_input}
        onfocus={open_results}
        onblur={close_results}
        role="combobox"
        aria-label="Search users by username"
        aria-autocomplete="list"
        aria-expanded={is_open && query.trim().length >= 2}
        aria-controls="user-search-results"
        aria-activedescendant={active_index >= 0 ? `user-search-result-${active_index}` : undefined}
        placeholder="Find people"
    />
    {#if query}
        <button class="clear-search" type="button" aria-label="Clear username search" onclick={clear_search}>
            ×
        </button>
    {/if}

    {#if is_open && query.trim().length >= 2}
        <div class="search-results">
            {#if is_loading}
                <p class="search-message">Searching users...</p>
            {:else if has_error}
                <p class="search-message">User search is unavailable right now.</p>
            {:else if users.length}
                <ul id="user-search-results" role="listbox" aria-label="Matching users">
                    {#each users as user, index (user.username)}
                        <li>
                            <button
                                id="user-search-result-{index}"
                                class:active={active_index === index}
                                type="button"
                                role="option"
                                aria-selected={active_index === index}
                                onmousedown={(event) => event.preventDefault()}
                                onclick={() => visit_user(user.username)}
                            >
                                <img src={user.image} alt="" />
                                <span>{user.username}</span>
                            </button>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="search-message">No users found.</p>
            {/if}
        </div>
    {/if}
</div>

<style>
.user-search {
	position: relative;
	display: flex;
	align-items: center;
	width: clamp(150px, 24vw, 300px);
	box-sizing: border-box;
	padding: 0.35rem 0.55rem;
	border: 1px solid var(--color-navigation-border);
	border-radius: 0.55rem;
	background: var(--color-background-secondary);
}

.user-search:focus-within {
	border-color: var(--color-blue-primary);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-blue-primary) 14%, transparent);
}

.user-search.page-layout {
	width: min(100%, 560px);
	padding: 0.65rem 0.8rem;
	border-radius: 0.65rem;
}

.user-search.page-layout input {
	font-size: 1rem;
}

.search-icon {
	width: 1rem;
	height: 1rem;
	flex: none;
	margin-right: 0.5rem;
	fill: none;
	stroke: var(--color-text-secondary);
	stroke-width: 1.8;
}

input {
	width: 100%;
	min-width: 0;
	border: 0;
	outline: 0;
	background: transparent;
	color: var(--color-text-primary);
	font: inherit;
	font-size: 0.85rem;
}

input::placeholder {
	color: var(--color-text-secondary);
	opacity: 0.9;
}

.clear-search {
	display: grid;
	width: 1.5rem;
	height: 1.5rem;
	flex: none;
	place-items: center;
	border: 0;
	border-radius: 50%;
	background: transparent;
	color: var(--color-text-secondary);
	font-size: 1.15rem;
	cursor: pointer;
}

.clear-search:hover {
	background: var(--color-background-primary);
	color: var(--color-text-primary);
}

.search-results {
	position: absolute;
	top: calc(100% + 0.5rem);
	left: 0;
	z-index: 10;
	width: max(100%, 240px);
	max-height: 22rem;
	overflow-y: auto;
	box-sizing: border-box;
	border: 1px solid var(--color-navigation-border);
	border-radius: 0.65rem;
	background: var(--color-background-primary);
	box-shadow: 0 12px 32px rgb(0 0 0 / 16%);
}

.search-results ul {
	margin: 0;
	padding: 0.35rem;
	list-style: none;
}

.search-results li + li {
	margin-top: 0.15rem;
}

.search-results button {
	display: flex;
	width: 100%;
	align-items: center;
	gap: 0.7rem;
	padding: 0.6rem 0.65rem;
	border: 0;
	border-radius: 0.45rem;
	background: transparent;
	color: var(--color-text-primary);
	font: inherit;
	font-size: 0.875rem;
	text-align: left;
	cursor: pointer;
}

.search-results button:hover,
.search-results button.active {
	background: var(--color-background-secondary);
}

.search-results img {
	width: 2rem;
	height: 2rem;
	flex: none;
	border-radius: 50%;
	object-fit: cover;
}

.search-message {
	margin: 0;
	padding: 0.85rem 0.9rem;
	color: var(--color-text-secondary);
	font-size: 0.82rem;
}

@media (max-width: 600px) {
	.user-search {
		width: clamp(130px, 34vw, 210px);
		margin-left: auto;
	}
}

@media (max-width: 480px) {
	.user-search {
		width: clamp(120px, 40vw, 150px);
	}
}
</style>
