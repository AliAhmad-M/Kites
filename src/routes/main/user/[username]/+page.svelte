<script lang="ts">
    import { is_dark_mode, Skeleton, Icon, Tooltip, Dashboard, lazyImage } from '$lib';
    import { goto } from '$app/navigation';
	import { page } from '$app/state';

    const { data } = $props();

    let image: File | undefined = $state();
    let is_uploading_pfp = $state(false);
    let is_logging_out = $state(false);
    
    let show_dropdown = $state(false);
    let show_confirm = $state(false);
    let is_deleting = $state(false);

    let folder = $state("dark_mode_icons");

    $effect(() => {
        folder = $is_dark_mode ? "dark_mode_icons" : "light_mode_icons";
    });

    async function change_pfp(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target?.files && target.files.length > 0) {
            image = target.files[0]; 
        } else {
            image = undefined;
        }

        if (!image || is_uploading_pfp) return;
        is_uploading_pfp = true;
        
        try {
            const form_data = new FormData();
            form_data.append('image', image);
            
            const response = await fetch('/api/user/change_pfp', {
                method: 'POST',
                body: form_data
            });

            if (response.status === 200) {
                window.location.reload();
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (e) {
            console.error('[KITES | ERROR]: ', e);
        } finally {
            is_uploading_pfp = false;
        }
    }
    
    async function logout() {
        if (is_logging_out) return;
        is_logging_out = true;
        try {
            const resp = await fetch('/api/user/logout', { method: 'POST' });
            
            if (resp.status === 200) {
                window.location.href = '/';
            } else {
                const data = await resp.json();
                alert(data.error);
            }
        } catch(e) {
            console.error(e);
        } finally {
            is_logging_out = false;
        }
    }

    async function delete_account() {
        if (is_deleting) return;
        try {
            is_deleting = true;
            const resp = await fetch('/api/user/delete', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: page.params.username }) 
            });
            
            if(resp.status === 200) {
                window.location.href = '/';
            } else {
                const data = await resp.json();
                alert(data.error);
            }
        } catch (e) {
            console.error('[KITES | ERROR]: ', e);
        } finally {
            is_deleting = false;
        }
    }

    function toggle_drowpdown() {
        show_dropdown = !show_dropdown;
        // Close confirmation dialog if open when toggling dropdown
        if (show_confirm) {
            show_confirm = false;
        }
    }

    // Close dropdown when clicking outside
    function handle_outside_click(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.more-options') && !target.closest('.confirm-dialog')) {
            show_dropdown = false;
        }
    }

    function ask_delete_confirmation() {
        show_dropdown = false;
        show_confirm = true;
    }

    function cancel_delete() {
        show_confirm = false;
    }

</script>

<svelte:head>
    <title>Kites | {page.params.username}</title>
</svelte:head>
<svelte:window on:click={handle_outside_click} />

<div class="container">
    {#await data.streamed}
        <Skeleton type="user"/>
    {:then user_data}
        <div class="profile-card">
            <div class="details">
                <div class="pfp-container">
                    {#if data.authenticated && data.user?.username === page.params.username}
                        <label for="image" class="pfp-label">
                            {#if user_data?.image}
                                <img use:lazyImage={{ src: user_data.image }} src={user_data.image} alt="pfp" class="pfp"/>
                            {:else}
                                <img use:lazyImage={{ src: "/profile.jpg" }} src="/profile.jpg" alt="pfp" class="pfp"/>
                            {/if}
                            <div class="pfp-overlay">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            {#if is_uploading_pfp}
                                <span class="uploading-label">Uploading...</span>
                            {/if}
                        </label>
                        <input type="file" id="image" name="image" accept="image/*" onchange={change_pfp} disabled={is_uploading_pfp}>
                    {:else}
                        {#if user_data?.image}
                            <img use:lazyImage={{ src: user_data.image }} src={user_data.image} alt="pfp" class="pfp"/>
                        {:else}
                            <img use:lazyImage={{ src: "/profile.jpg" }} src="/profile.jpg" alt="pfp" class="pfp"/>
                        {/if}
                    {/if}
                </div>
                <div class="user-info">
                    <div class="username-container">
                        <h2 class="username">{page.params.username}</h2>
                        {#if user_data?.rank !== 'default'}
                            <Tooltip text={user_data?.rank}>
                                <Icon mode={undefined} name={user_data?.rank} width=36 height=36 alt="verified"/>
                            </Tooltip>
                        {/if}
                    </div>
                    <p class="profile-handle">@{page.params.username}</p>
                    {#if data.authenticated && data.user?.username === page.params.username}
                        <p class="email-id">{user_data?.email}</p>
                    {/if}
                </div>
                
                {#if (data.authenticated && data.user?.username === page.params.username) || data.rank === "Admin"}
                <div class="more-options">
                    <Tooltip text="More">
                        <button class="more" onclick={toggle_drowpdown}>
                            <Icon mode={folder} name="more_h" width=24 height=24 alt="more" />
                        </button>
                    </Tooltip>
                    
                    {#if show_dropdown}
                        <div class="dropdown-menu">
                            <button class="dropdown-item delete-account" onclick={ask_delete_confirmation}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                                Delete Account
                            </button>
                        </div>
                    {/if}
                </div>
                {/if}
            </div>
            
            {#if data.authenticated && data.user?.username === page.params.username}
                <div class="divider"></div>
                <div class="buttons">
                    <button class="settings-button" onclick={() => goto('/main/user/settings')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Settings
                    </button>
                    <button class="logout-button" onclick={logout} disabled={is_logging_out}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        {is_logging_out ? 'Logging out...' : 'Log Out'}
                    </button>
                </div>
            {/if}
        </div>
        <div class="profile-grid">
            <section class="activity-section" id="posts" aria-labelledby="posts-heading">
                <div class="section-heading">
                        <h2 id="posts-heading">Posts</h2>
                </div>

                {#each user_data.posts as post (post.id)}
                    <article class="activity-post">
                        <div class="post-meta">
                            <span>{post.topic}</span>
                            <span class="meta-divider">/</span>
                            <span>{post.type}</span>
                        </div>
                        <h3>
                            <a href="/main/posts/{post.topic}/{post.id}">{post.heading}</a>
                        </h3>
                        {#if post.image_url}
                            <a class="post-image-link" href="/main/posts/{post.topic}/{post.id}" tabindex="-1" aria-hidden="true">
                                <img use:lazyImage={{ src: post.image_url }} src={post.image_url} alt="" class="post-image" />
                            </a>
                        {/if}
                        <div class="post-footer">
                            <span>{post.likes} {post.likes === 1 ? 'like' : 'likes'}</span>
                            <a href="/main/posts/{post.topic}/{post.id}">View post <span aria-hidden="true">→</span></a>
                        </div>
                    </article>
                {:else}
                    <div class="empty-posts">
                        <span class="empty-mark" aria-hidden="true">✳</span>
                        <h3>No posts yet</h3>
                        <p>{data.authenticated && data.user?.username === page.params.username ? 'Your posts will show up here.' : 'There is no activity to show yet.'}</p>
                        {#if data.authenticated && data.user?.username === page.params.username}
                            <a href="/main/posts/create_blog">Create your first post</a>
                        {/if}
                    </div>
                {/each}
            </section>

            <aside class="profile-rail" aria-label="Profile information">
                <section class="rail-section">
                    <h2>About</h2>
                    <div class="about-row">
                        <span class="about-label">Rank</span>
                        <span class="about-value">{user_data.rank === 'default' ? 'Member' : user_data.rank}</span>
                    </div>
                    {#if data.authenticated && data.user?.username === page.params.username}
                        <div class="about-row email-row">
                            <span class="about-label">Email</span>
                            <span class="about-value">{user_data.email}</span>
                        </div>
                    {/if}
                </section>
                <section class="rail-section stats-section" aria-label="Activity statistics">
                    <div class="stat-block">
                        <strong>{user_data.post_count}</strong>
                        <span>Posts</span>
                    </div>
                    <div class="stat-block">
                        <strong>{user_data.likes_received}</strong>
                        <span>Likes received</span>
                    </div>
                </section>
            </aside>
        </div>
        {#if user_data?.rank === "Admin" && data.rank === "Admin" && data.authenticated && data.user?.username === page.params.username}
            <Dashboard admin_stats={user_data?.admin_stats} />
        {/if}
    {/await}

    {#if show_confirm}
        <div class="confirm-dialog">
            <div class="confirm-content">
                <h3>Delete Account?</h3>
                <p>This action cannot be undone. All your data will be permanently deleted.</p>
                <div class="confirm-buttons">
                    <button class="cancel-button" onclick={cancel_delete} disabled={is_deleting}>
                        Cancel
                    </button>
                    <button class="delete-button" onclick={delete_account} disabled={is_deleting}>
                        {is_deleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>


<style>
    .container {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        
        margin-top: 2rem;
        padding: 0 1rem;
    }

    .profile-card {
        display: flex;
        flex-direction: column;
        
        width: 100%;
        max-width: 640px;
        box-sizing: border-box;
        
        padding: 2rem;
        
        background-color: var(--color-background-primary);
        
        border: solid 1px var(--color-blue-primary);
        border-radius: 1rem;

        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .details {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        
        width: 100%;
    }

    .pfp-container {
        position: relative;
        flex-shrink: 0;
    }

    .pfp {
        width: 6.25rem;
        height: 6.25rem;
        
        border-radius: 50%;
        
        object-fit: cover;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .pfp-label {
        position: relative;
        display: block;
        cursor: pointer;
        border-radius: 50%;
    }

    .pfp-overlay {
        position: absolute;
        top: 0;
        left: 0;
        
        width: 100%;
        height: 94%;
        
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        
        flex-direction: column;
        justify-content: center;
        align-items: center;
        opacity: 0;

        transition: opacity 0.2s ease;
        color: white;
    }

    .pfp-overlay svg {
        margin-bottom: 0.25rem;
    }

    .uploading-label {
        position: absolute;
        inset: 4px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.58);
        color: #fff;
        font-size: 0.75rem;
    }

    .pfp-label:hover .pfp-overlay {
        opacity: 1;
    }

    .user-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        flex-grow: 1;
    }

    .username-container {
        display: flex;
        gap: 0.5rem;
    }

    .username {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        
        color: var(--color-text-primary);
    }

    .email-id {
        margin: 0.5rem 0 0 0;
        
        font-size: 1rem;
        font-weight: 400;
        
        color: var(--color-text-secondary);
    }

    .more-options {
        margin-bottom: auto;
        position: relative;
    }

    .more {
        background-color: transparent;
        border: none;
        cursor: pointer;
        transition: opacity 0.2s ease;
    }

    .more:hover {
        opacity: 0.7;
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 10;
        
        min-width: 180px;
        
        margin-top: 0.5rem;
        padding: 0.5rem;
        
        background-color: var(--color-background-primary);
        
        border: 1px solid var(--color-navigation-border);
        border-radius: 0.75rem;
        
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        width: 100%;
        
        padding: 0.75rem;
        
        font-size: 0.95rem;
        font-weight: 500;
        
        background-color: transparent;
        border: none;
        border-radius: 0.5rem;
        
        cursor: pointer;
        
        transition: background-color 0.2s ease;
    }

    .delete-account {
        color: var(--color-red-secondary);
    }

    .delete-account:hover {
        background-color: rgba(229, 57, 53, 0.1);
    }

    .delete-account svg {
        color: var(--color-red-secondary);
    }

    .confirm-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
        
        display: flex;
        justify-content: center;
        align-items: center;
        
        background-color: rgba(0, 0, 0, 0.5);
    }

    .confirm-content {
        width: 90%;
        max-width: 400px;
        
        padding: 1.5rem;
        
        background-color: var(--color-background-primary);
        
        border-radius: 1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .confirm-content h3 {
        margin-top: 0;
        margin-bottom: 0.75rem;
        
        font-size: 1.25rem;
        font-weight: 600;
        
        color: var(--color-red-secondary);
    }

    .confirm-content p {
        margin-bottom: 1.5rem;
        
        font-size: 0.95rem;
        
        color: var(--color-text-secondary);
    }

    .confirm-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }

    .cancel-button, .delete-button {
        padding: 0.65rem 1.25rem;
        
        font-size: 0.95rem;
        font-weight: 500;
        
        border-radius: 0.75rem;
        
        cursor: pointer;
        
        transition: all 0.2s ease;
    }

    .cancel-button {
        background-color: transparent;
        color: var(--color-text-primary);
        
        border: 1px solid var(--color-navigation-border);
    }
    
    .cancel-button:hover {
        border-color: var(--color-blue-primary);
        color: var(--color-blue-primary);
    }

    .delete-button {
        background-color: var(--color-red-secondary);
        color: white;
        
        border: none;
    }
    
    .delete-button:hover {
        background-color: var(--color-red-primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(229, 57, 53, 0.4);
    }

    .divider {
        width: 100%;
        height: 1px;
        
        background-color: var(--color-navigation-border);
        
        margin: 2rem 0;
    }

    .buttons {
        display: flex;
        gap: 2rem;
        width: 100%;
    }

    .settings-button, .logout-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        
        padding: 0.65rem 1.25rem;
        
        font-size: 0.95rem;
        font-weight: 500;
        
        border-radius: 0.75rem;
        
        cursor: pointer;
        
        transition: all 0.2s ease;
    }

    .settings-button {
        flex: 1;
        
        background-color: var(--color-blue-primary);
        color: var(--color-text-button);
        
        border: none;
    }

    .settings-button:hover {
        background-color: var(--color-blue-secondary);
        transform: translateY(-2px);
    }

    .settings-button:active {
        transform: translateY(0);
    }

    .logout-button {
        flex: 1;
        
        background-color: transparent;
        color: var(--color-text-primary);
        
        border: 1px solid var(--color-navigation-border);
    }
    
    .logout-button:hover {
        border-color: var(--color-blue-primary);
        color: var(--color-blue-primary);

        transform: translateY(-2px);
    }

    .logout-button:active {
        transform: translateY(0);
    }

    input[type="file"] {
        display: none;
    }

    .container {
        display: block;
        width: min(100%, 1080px);
        margin: 0 auto;
        padding: 0 1.25rem 3rem;
        box-sizing: border-box;
    }

    .profile-card {
        position: relative;
        overflow: hidden;
        width: 100%;
        max-width: none;
        box-sizing: border-box;
        padding: 0 2rem 1.5rem;
        border: 1px solid var(--color-navigation-border);
        border-radius: 0.5rem;
        background: var(--color-background-secondary);
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.12);
    }

    .details {
        position: relative;
        z-index: 1;
        align-items: center;
        gap: 1.25rem;
        width: auto;
        margin: 0 -2rem;
        padding: 1.5rem 2rem;
    }

    .pfp {
        display: block;
        width: 8rem;
        height: 8rem;
        box-sizing: border-box;
        border: 4px solid var(--color-background-secondary);
        background-color: var(--color-background-secondary);
        object-fit: cover;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
    }

    .pfp-label {
        width: 8rem;
        height: 8rem;
    }

    .pfp-overlay {
        inset: 4px;
        width: auto;
        height: auto;
    }

    .user-info {
        min-width: 0;
        padding-bottom: 0.3rem;
    }

    .username-container {
        align-items: center;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .username {
        overflow-wrap: anywhere;
        font-size: 1.75rem;
        line-height: 1.15;
        letter-spacing: 0;
    }

    .profile-handle,
    .email-id {
        margin: 0.35rem 0 0;
        color: var(--color-text-secondary);
        font-size: 0.9rem;
        overflow-wrap: anywhere;
    }

    .more-options {
        align-self: flex-start;
        margin: 0 0 0 auto;
    }

    .more {
        display: grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        border: 1px solid var(--color-navigation-border);
        border-radius: 50%;
        background: var(--color-background-secondary);
    }

    .divider {
        height: 1px;
        margin: 0 0 1.25rem;
    }

    .buttons {
        justify-content: flex-end;
        gap: 0.75rem;
    }

    .settings-button,
    .logout-button {
        flex: 0 0 auto;
        min-height: 2.6rem;
        padding: 0.55rem 1rem;
        border-radius: 0.35rem;
        font-size: 0.9rem;
    }

    .settings-button {
        background: var(--color-blue-primary);
    }

    .settings-button:hover,
    .logout-button:hover {
        transform: none;
    }

    .profile-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 280px;
        align-items: start;
        gap: 1.25rem;
        margin-top: 1.25rem;
    }

    .activity-section,
    .profile-rail {
        min-width: 0;
    }

    .rail-section {
        padding: 1.25rem 1.4rem;
        border: 1px solid var(--color-navigation-border);
        border-radius: 0.5rem;
        background: var(--color-background-secondary);
    }

    .activity-section {
        overflow: hidden;
        border: 1px solid var(--color-navigation-border);
        border-radius: 0.5rem;
        background: var(--color-background-secondary);
    }

    .section-heading {
        display: flex;
        align-items: center;
        padding: 1.25rem 1.4rem;
        border-bottom: 1px solid var(--color-navigation-border);
    }

    .section-heading h2,
    .rail-section h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
    }

    .activity-post {
        padding: 1.25rem 1.4rem;
    }

    .activity-post + .activity-post {
        border-top: 1px solid var(--color-navigation-border);
    }

    .post-meta {
        display: flex;
        gap: 0.5rem;
        color: var(--color-text-secondary);
        font-size: 0.78rem;
        text-transform: uppercase;
    }

    .meta-divider {
        color: var(--color-blue-secondary);
    }

    .activity-post h3 {
        margin: 0.6rem 0 0.9rem;
        font-size: 1.15rem;
        line-height: 1.4;
        overflow-wrap: anywhere;
    }

    .activity-post h3 a,
    .post-footer a {
        color: var(--color-text-primary);
        text-decoration: none;
    }

    .activity-post h3 a:hover,
    .post-footer a:hover {
        color: var(--color-blue-secondary);
    }

    .post-image-link {
        display: block;
        overflow: hidden;
        border-radius: 0.35rem;
    }

    .post-image {
        display: block;
        width: 100%;
        max-height: 280px;
        aspect-ratio: 16 / 8;
        object-fit: cover;
    }

    .post-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 1rem;
        color: var(--color-text-secondary);
        font-size: 0.82rem;
    }

    .post-footer a {
        color: var(--color-blue-secondary);
    }

    .profile-rail {
        position: sticky;
        top: 1rem;
        display: grid;
        gap: 0.75rem;
    }

    .rail-section h2 {
        margin-bottom: 1rem;
    }

    .about-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.7rem 0;
        border-top: 1px solid var(--color-navigation-border);
        font-size: 0.82rem;
    }

    .about-label {
        flex: none;
        color: var(--color-text-secondary);
    }

    .about-value {
        min-width: 0;
        text-align: right;
        overflow-wrap: anywhere;
    }

    .stats-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        padding: 0;
    }

    .stat-block {
        display: grid;
        gap: 0.25rem;
        padding: 1.1rem 1rem;
    }

    .stat-block + .stat-block {
        border-left: 1px solid var(--color-navigation-border);
    }

    .stat-block strong {
        font-size: 1.25rem;
        font-weight: 600;
    }

    .stat-block span {
        color: var(--color-text-secondary);
        font-size: 0.75rem;
    }

    .empty-posts {
        padding: 3rem 1.5rem;
        border-top: 1px solid var(--color-navigation-border);
        text-align: center;
    }

    .empty-mark {
        color: var(--color-blue-secondary);
        font-size: 1.7rem;
    }

    .empty-posts h3 {
        margin: 0.5rem 0;
        font-size: 1.05rem;
    }

    .empty-posts p {
        margin: 0 0 1rem;
        color: var(--color-text-secondary);
        font-size: 0.9rem;
    }

    .empty-posts a {
        color: var(--color-blue-secondary);
        font-size: 0.9rem;
        text-decoration: none;
    }

    @media (max-width: 480px) {
        .details {
            gap: 0.75rem;
            padding: 1.1rem 0;
            margin: 0;
            align-items: center;
        }

        .profile-card {
            padding-right: 1rem;
            padding-left: 1rem;
        }

        .pfp,
        .pfp-label {
            width: 6rem;
            height: 6rem;
        }

        .username {
            font-size: 1.35rem;
        }

        .buttons {
            justify-content: stretch;
            gap: 0.5rem;
        }

        .settings-button,
        .logout-button {
            flex: 1;
            padding-right: 0.5rem;
            padding-left: 0.5rem;
        }

        .profile-grid {
            grid-template-columns: minmax(0, 1fr);
        }

        .profile-rail {
            position: static;
            grid-row: 1;
        }

        .section-heading,
        .activity-post,
        .rail-section:not(.stats-section) {
            padding-right: 1rem;
            padding-left: 1rem;
        }
    }
</style>