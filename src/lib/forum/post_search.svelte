<script lang="ts">
    let {
        value = $bindable(''),
        onsearch,
        busy = false
    } = $props<{
        value?: string;
        onsearch: (query: string) => void;
        busy?: boolean;
    }>();

    function update_search() {
        onsearch(value.trim());
    }

    function clear_search() {
        value = '';
        onsearch('');
    }
</script>

<div class="post-search" role="search">
    <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>
    <input type="search" aria-label="Search post titles" bind:value oninput={update_search} placeholder="Search post titles" />
    {#if value}
        <button class="clear-search" type="button" aria-label="Clear search" onclick={clear_search}>×</button>
    {/if}
</div>

<style>
.post-search {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: min(100%, 560px);
	box-sizing: border-box;
	padding: 0.35rem;
	border: 1px solid var(--color-navigation-border);
	border-radius: 0.6rem;
	background: var(--color-background-primary);
	box-shadow: 0 2px 10px rgb(0 0 0 / 5%);
}

.search-icon {
	width: 1.1rem;
	height: 1.1rem;
	flex: none;
	margin-left: 0.55rem;
	fill: none;
	stroke: var(--color-text-secondary);
	stroke-width: 1.8;
}

input {
	min-width: 0;
	flex: 1;
	padding: 0.55rem 0.25rem;
	border: 0;
	outline: 0;
	background: transparent;
	color: var(--color-text-primary);
	font: inherit;
	font-size: 0.9rem;
}

input::placeholder {
	color: var(--color-text-secondary);
	opacity: 0.85;
}

.post-search:focus-within {
	border-color: var(--color-blue-primary);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-blue-primary) 15%, transparent);
}

.clear-search {
	width: 1.8rem;
	height: 1.8rem;
	flex: none;
	border: 0;
	border-radius: 50%;
	background: transparent;
	color: var(--color-text-secondary);
	font-size: 1.2rem;
	cursor: pointer;
}

.clear-search:hover {
	background: var(--color-background-secondary);
	color: var(--color-text-primary);
}
</style>
