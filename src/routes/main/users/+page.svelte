<script lang="ts">
    import UserSearch from '$lib/navigation/user_search.svelte';
</script>

<svelte:head>
    <title>Kites | Find People</title>
</svelte:head>

<main class="people-page">
    <header class="page-heading">
        <h1>Find people</h1>
        <p class="description">Search for Kites members by username.</p>
    </header>

    <section class="search-section" aria-label="Search members">
        <UserSearch page_layout={true} />
    </section>
</main>

<style>
.people-page {
	width: min(100%, 760px);
	box-sizing: border-box;
	margin: 0 auto;
	padding: 1.5rem 2rem;
}

.page-heading {
	margin-bottom: 1.25rem;
}

h1 {
	margin: 0;
	color: var(--color-text-primary);
	font-size: clamp(1.75rem, 4vw, 2.25rem);
}

.description {
	margin: 0.5rem 0 0;
	color: var(--color-text-secondary);
	font-size: 0.95rem;
}

.search-section {
	width: 100%;
}

@media (max-width: 600px) {
	.people-page {
		padding: 1.25rem 1rem;
	}
}
</style>
