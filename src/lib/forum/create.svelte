<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';

    function create_post() {
        if (!page.data.authenticated) {
            goto('/login/signin');
            return;
        }

        goto('/main/posts/create_blog');
    }
</script>

<button class="add-button" onclick={create_post} aria-label="Create a blog post" title="Create a blog post">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
</button>

<style>
.add-button {
	position: fixed;
	right: 2rem;
	bottom: 2rem;
	z-index: 50;
	display: grid;
	width: 56px;
	height: 56px;
	place-items: center;
	border: 0;
	border-radius: 50%;
	background: var(--color-blue-primary);
	color: #fff;
	box-shadow: 0 4px 14px rgb(0 0 0 / 18%);
	cursor: pointer;
	transition:
		background-color 160ms ease,
		transform 160ms ease,
		box-shadow 160ms ease;
}

.add-button:hover {
	transform: translateY(-2px);
	background: var(--color-blue-secondary);
	box-shadow: 0 7px 18px rgb(0 0 0 / 22%);
}

.add-button:focus-visible {
	outline: 3px solid color-mix(in srgb, var(--color-blue-primary) 45%, white);
	outline-offset: 3px;
}
</style>
