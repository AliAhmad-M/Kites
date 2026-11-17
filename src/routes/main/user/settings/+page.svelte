<script lang="ts">
    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import { optimize_profile_image } from '$lib/helper/optimize_profile_image';
    
    let { form } = $props();
    let is_updating_username = $state(false);
    let is_changing_password = $state(false);
    let is_saving_bio = $state(false);
    let bio_text = $state(page.data.bio ?? '');
    let is_uploading_pfp = $state(false);

    let visible_status = $state<Record<string, boolean>>({});
    const status_timers: Record<string, ReturnType<typeof setTimeout>> = {};

    function flash_status(key: string) {
        clearTimeout(status_timers[key]);
        visible_status[key] = true;
        status_timers[key] = setTimeout(() => {
            visible_status[key] = false;
        }, 3000);
    }

    function clear_status(key: string) {
        clearTimeout(status_timers[key]);
        visible_status[key] = false;
    }

    $effect(() => {
        if (form?.username_success) flash_status('username_success');
        if (form?.bio_success) flash_status('bio_success');
        if (form?.password_success) flash_status('password_success');
    });

    async function change_pfp(event: Event) {
        const target = event.target as HTMLInputElement;
        const image = target.files?.[0];
        if (!image || is_uploading_pfp) return;

        is_uploading_pfp = true;
        try {
            const form_data = new FormData();
            form_data.append('image', await optimize_profile_image(image));
            const response = await fetch('/api/user/change_pfp', { method: 'POST', body: form_data });
            if (response.ok) {
                window.location.reload();
            } else {
                const result = await response.json();
                alert(result.error);
            }
        } catch (error) {
            console.error('[KITES | ERROR]: ', error);
        } finally {
            is_uploading_pfp = false;
            target.value = '';
        }
    }
</script>

<svelte:head>
    <title>Kites | Account Settings</title>
</svelte:head>

<div class="app-layout">
    <main class="content">
        <div class="settings-wrapper">
            <div class="settings-header">
                <a class="settings-back" href="/main/user/{page.data.user?.username}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="m15 18-6-6 6-6"></path>
                    </svg>
                    Back to profile
                </a>
                <div class="settings-heading-row">
                    <div>
                        <h1>Settings</h1>
                        <p class="settings-subtitle">Manage your identity and sign-in security.</p>
                    </div>
                </div>
            </div>

            <div class="settings-grid">
                <section class="settings-card" id="account">
                    <div class="card-header">
                        <div>
                            <h2>Change username and profile picture</h2>
                            <p class="card-description">Choose how people find you across Kites.</p>
                        </div>
                    </div>

                    <div class="profile-picture-editor">
                        <label for="settings-image" class="settings-pfp-label" aria-label="Change profile picture">
                            <img src={page.data.my_pfp || '/profile.jpg'} alt="Profile" class="settings-pfp" loading="lazy" decoding="async" fetchpriority="low" />
                            <span class="settings-pfp-overlay" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </span>
                            {#if is_uploading_pfp}<span class="uploading-label">Uploading...</span>{/if}
                        </label>
                        <span class="settings-pfp-copy"><strong>Profile picture</strong><small>Choose a new image to update your profile photo.</small></span>
                        <input type="file" id="settings-image" accept="image/*" onchange={change_pfp} disabled={is_uploading_pfp} />
                    </div>
                    
                    <form method="POST" action="?/update_username" use:enhance={() => {
                        is_updating_username = true;
                        clear_status('username_success');
                        return async ({ update }) => {
                            try {
                                await update();
                            } finally {
                                is_updating_username = false;
                            }
                        };
                    }} class="settings-form">
                        <div class="form-group">
                            <label for="current_username" class="form-label">Current Username</label>
                            <input 
                                type="text" 
                                id="current_username" 
                                name="current_username" 
                                value={page.data.user?.username ?? ''} 
                                disabled 
                                class="form-input disabled" 
                            />
                        </div>

                        <div class="form-group">
                            <label for="username" class="form-label">New Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                required 
                                class="form-input"
                                placeholder="Enter new username"
                            />
                            
                            {#if form?.username_error}
                                <div class="error-message" role="alert">
                                    <span class="error-icon">⚠</span>
                                    {form.username_error}
                                </div>
                            {/if}
                            {#if visible_status.username_success}
                                <div class="success-message" role="status">
                                    <span class="success-icon">✓</span>
                                    Username updated successfully!
                                </div>
                            {/if}
                        </div>

                        <button type="submit" class="primary-button" disabled={is_updating_username}>
                            {is_updating_username ? 'Updating...' : 'Update Username'}
                        </button>
                    </form>
                </section>

                <section class="settings-card bio-card" id="bio">
                    <div class="card-header">
                        <div>
                            <h2>Profile bio</h2>
                            <p class="card-description">A short introduction shown on your public profile.</p>
                        </div>
                    </div>
                    <form method="POST" action="?/update_bio" use:enhance={() => {
                        is_saving_bio = true;
                        clear_status('bio_success');
                        return async ({ result, update }) => {
                            try {
                                await update();
                                if (result.type === 'success' && result.data?.bio !== undefined) bio_text = result.data.bio;
                            } finally {
                                is_saving_bio = false;
                            }
                        };
                    }} class="settings-form">
                        <div class="form-group">
                            <label for="bio" class="form-label">About you</label>
                            <textarea id="bio" name="bio" class="form-input bio-input" maxlength="300" rows="4" bind:value={bio_text} placeholder="Share a little about yourself."></textarea>
                            <span class="field-hint">{bio_text.length}/300 characters</span>
                        </div>
                        {#if form?.bio_error}
                            <div class="error-message" role="alert">{form.bio_error}</div>
                        {/if}
                        {#if visible_status.bio_success}
                            <div class="success-message" role="status">Bio saved successfully.</div>
                        {/if}
                        <button type="submit" class="primary-button" disabled={is_saving_bio}>
                            {is_saving_bio ? 'Saving...' : 'Save bio'}
                        </button>
                    </form>
                </section>

                <section class="settings-card" id="security">
                    <div class="card-header">
                        <div>
                            <h2>Password & security</h2>
                            <p class="card-description">Use a strong password you do not reuse elsewhere.</p>
                        </div>
                    </div>
                    
                    <form method="POST" action="?/change_password" use:enhance={() => {
                        is_changing_password = true;
                        clear_status('password_success');
                        return async ({ update }) => {
                            try {
                                await update();
                            } finally {
                                is_changing_password = false;
                            }
                        };
                    }} class="settings-form">
                        <div class="form-group">
                            <label for="current_password" class="form-label">Current Password</label>
                            <input 
                                type="password" 
                                id="current_password" 
                                name="current_password" 
                                class="form-input" 
                                required 
                                placeholder="Enter current password"
                            />
                        </div>

                        <div class="form-group">
                            <label for="new_password" class="form-label">New Password</label>
                            <input 
                                type="password" 
                                id="new_password" 
                                name="new_password" 
                                class="form-input" 
                                required 
                                minlength="8"
                                placeholder="Enter new password (min. 8 characters)"
                            />
                        </div>

                        <div class="form-group">
                            <label for="confirm_password" class="form-label">Confirm New Password</label>
                            <input 
                                type="password" 
                                id="confirm_password" 
                                name="confirm_password" 
                                class="form-input" 
                                required 
                                placeholder="Confirm new password"
                            />
                        </div>

                        {#if form?.password_error}
                            <div class="error-message" role="alert">
                                <span class="error-icon">⚠</span>
                                {form.password_error}
                            </div>
                        {/if}
                        {#if visible_status.password_success}
                            <div class="success-message" role="status">
                                <span class="success-icon">✓</span>
                                Password updated successfully!
                            </div>
                        {/if}

                        <button type="submit" class="primary-button" disabled={is_changing_password}>
                            {is_changing_password ? 'Updating password...' : 'Change Password'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    </main>
</div>

<style>
.settings-wrapper {
	width: min(100%, 900px);
	box-sizing: border-box;
	margin: 0 auto;
	padding: 2rem clamp(1rem, 4vw, 2rem) 4rem;
}

.settings-header {
	margin-bottom: 1.75rem;
	padding-bottom: 1.25rem;
	border-bottom: 1px solid var(--color-navigation-border);
}

.settings-back {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	margin-bottom: 1.25rem;
	color: var(--color-text-secondary);
	font-size: 0.9rem;
	text-decoration: none;
}

.settings-back:hover {
	color: var(--color-blue-secondary);
}

.settings-heading-row {
	display: flex;
	align-items: center;
}

.settings-header h1 {
	margin: 0;
	color: var(--color-text-primary);
	font-size: 2rem;
	line-height: 1.2;
}

.settings-subtitle {
	margin: 0.5rem 0 0;
	color: var(--color-text-secondary);
	font-size: 0.95rem;
}

.settings-grid {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 1rem;
}

.settings-card,
.settings-card:hover {
	width: 100%;
	max-width: none;
	min-width: 0;
	box-sizing: border-box;
	padding: clamp(1.1rem, 3vw, 1.5rem);
	border: 1px solid var(--color-navigation-border);
	border-radius: 0.65rem;
	background: var(--color-background-secondary);
	box-shadow: none;
	transform: none;
	transition: border-color 160ms ease;
}

.settings-card:hover {
	border-color: color-mix(in srgb, var(--color-blue-primary) 55%, var(--color-navigation-border));
}

.card-header {
	margin: 0 0 1.25rem;
	padding: 0 0 1rem;
	border-bottom: 1px solid var(--color-navigation-border);
}

.card-header h2 {
	margin: 0;
	color: var(--color-text-primary);
	font-size: 1.15rem;
	font-weight: 650;
}

.card-description {
	margin: 0.35rem 0 0;
	color: var(--color-text-secondary);
	font-size: 0.88rem;
}

.settings-form {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.45rem;
}

.form-label {
	color: var(--color-text-secondary);
	font-size: 0.83rem;
	font-weight: 600;
}

.form-input {
	width: 100%;
	min-width: 0;
	box-sizing: border-box;
	padding: 0.75rem 0.85rem;
	border: 1px solid var(--color-navigation-border);
	border-radius: 0.4rem;
	background: var(--color-background-primary);
	color: var(--color-text-primary);
	font: inherit;
	font-size: 0.93rem;
}

.form-input:focus {
	outline: none;
	border-color: var(--color-blue-primary);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-blue-primary) 18%, transparent);
}

.form-input.disabled {
	opacity: 0.65;
	cursor: not-allowed;
}

.form-input::placeholder {
	color: var(--color-text-secondary);
	opacity: 0.8;
}

.bio-input {
	min-height: 7rem;
	resize: vertical;
	line-height: 1.5;
}

.field-hint {
	align-self: flex-end;
	color: var(--color-text-secondary);
	font-size: 0.75rem;
}

.primary-button {
	align-self: flex-start;
	min-height: 2.55rem;
	padding: 0.65rem 1rem;
	border: 0;
	border-radius: 0.4rem;
	background: var(--color-blue-primary);
	color: #fff;
	font: inherit;
	font-size: 0.9rem;
	font-weight: 600;
	cursor: pointer;
}

.primary-button:hover:not(:disabled) {
	background: var(--color-blue-secondary);
}

.primary-button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.error-message,
.success-message {
	padding: 0.7rem 0.85rem;
	border-radius: 0.4rem;
	font-size: 0.88rem;
}

.error-message {
	border: 1px solid var(--color-red-primary);
	background: color-mix(in srgb, var(--color-red-primary) 10%, transparent);
	color: var(--color-red-primary);
}

.success-message {
	border: 1px solid #22c55e;
	background: rgb(34 197 94 / 10%);
	color: #16a34a;
}

.error-icon,
.success-icon {
	font-weight: 700;
}

.profile-picture-editor {
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1.25rem;
}

.settings-pfp-label {
	position: relative;
	display: block;
	width: 4.5rem;
	height: 4.5rem;
	flex: none;
	overflow: hidden;
	border-radius: 50%;
	cursor: pointer;
}

.settings-pfp {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.settings-pfp-overlay {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(0 0 0 / 48%);
	color: #fff;
	opacity: 0;
	transition: opacity 150ms ease;
}

.settings-pfp-label:hover .settings-pfp-overlay,
.settings-pfp-label:focus-within .settings-pfp-overlay {
	opacity: 1;
}

.settings-pfp-copy {
	display: grid;
	gap: 0.25rem;
	color: var(--color-text-primary);
	font-size: 0.9rem;
}

.settings-pfp-copy small {
	color: var(--color-text-secondary);
	font-size: 0.78rem;
}

.uploading-label {
	position: absolute;
	right: 0;
	bottom: 0;
	left: 0;
	padding: 0.25rem;
	background: rgb(0 0 0 / 65%);
	color: #fff;
	font-size: 0.65rem;
	text-align: center;
}

input[type='file'] {
	display: none;
}

@media (max-width: 600px) {
	.settings-wrapper {
		padding-top: 1.25rem;
	}

	.settings-header h1 {
		font-size: 1.7rem;
	}

	.primary-button {
		width: 100%;
	}

	.profile-picture-editor {
		align-items: flex-start;
	}
}
</style>
