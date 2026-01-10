<script lang="ts">
	import { SignupCard } from "$lib";
	import { dev } from "$app/environment";

	let { form } = $props();
</script>

{#if dev}
	<SignupCard form={form} />
{:else}
	<h1>Sign up unavailable</h1>
	<p>Sorry, we don’t support sign-ups on the live hosted version.</p>
{/if}
