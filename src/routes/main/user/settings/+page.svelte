<script lang="ts">
    import { enhance } from "$app/forms";
	import { page } from "$app/state";
    
    let { form } = $props();
    let is_updating_username = $state(false);
    let is_changing_password = $state(false);
</script>

<svelte:head>
    <title>Kites | Account Settings</title>
</svelte:head>

<div class="app-layout">
    <main class="content">
        <div class="settings-wrapper">
            <div class="settings-header">
                <a class="settings-back" href="/main/user/{page.data.user?.username}">
                    <span aria-hidden="true">←</span> Profile
                </a>
                <div class="settings-heading-row">
                    <div>
                        <p class="settings-kicker">ACCOUNT</p>
                        <h1>Settings</h1>
                        <p class="settings-subtitle">Manage your identity and sign-in security.</p>
                    </div>
                    <div class="account-chip">
                        <span class="account-avatar" aria-hidden="true">{page.data.user?.username?.slice(0, 1).toUpperCase()}</span>
                        <span>{page.data.user?.username}</span>
                    </div>
                </div>
            </div>

            <div class="settings-grid">
                <section class="settings-card" id="account">
                    <div class="card-header">
                        <span class="section-index">01</span>
                        <div>
                            <h2>Account name</h2>
                            <p class="card-description">Choose how people find you across Kites.</p>
                        </div>
                    </div>
                    
                    <form method="POST" action="?/update_username" use:enhance={() => {
                        is_updating_username = true;
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
                            {#if form?.username_success}
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

                <section class="settings-card" id="security">
                    <div class="card-header">
                        <span class="section-index">02</span>
                        <div>
                            <h2>Password &amp; security</h2>
                            <p class="card-description">Use a strong password you do not reuse elsewhere.</p>
                        </div>
                    </div>
                    
                    <form method="POST" action="?/change_password" use:enhance={() => {
                        is_changing_password = true;
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
                        {#if form?.password_success}
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
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    .settings-header {
        text-align: center;
        margin-bottom: 3rem;
    }

    .settings-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 0 0 0.5rem 0;
    }

    .settings-subtitle {
        font-size: 1.1rem;
        color: var(--color-text-primary);
        opacity: 0.7;
        margin: 0;
    }

    .settings-grid {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        gap: 2rem;
    }

    .settings-card {
        background: var(--color-background-secondary);
        border: 2px solid var(--color-navigation-border);
        border-radius: 0.75rem;

        width: 60%;
        max-width: 480px;
        min-width: 320px;

        padding: 2rem;
        transition: all 0.3s ease;
    }

    .settings-card:hover {
        border-color: var(--color-blue-primary);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .card-header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--color-navigation-border);
    }

    .card-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--color-text-primary);
        margin: 0 0 0.5rem 0;
    }

    .card-description {
        font-size: 0.95rem;
        color: var(--color-text-primary);

        opacity: 0.7;
        margin: 0;
    }

    .settings-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-label {
        font-size: 0.9rem;
        font-weight: 500;
        
        color: var(--color-text-primary);
        margin-bottom: 0.25rem;
    }

    .form-input {
        padding: 0.875rem 1rem;
        border: 2px solid var(--color-navigation-border);
        background: var(--color-background-primary);
        color: var(--color-text-primary);
        
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s ease;
    }

    .form-input:focus {
        outline: none;
        border-color: var(--color-blue-primary);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: var(--color-navigation-border);
    }

    .form-input::placeholder {
        color: var(--color-text-primary);
        opacity: 0.5;
    }

    .primary-button {
        padding: 0.875rem 1.5rem;
        margin-top: 0.5rem;
        
        background: var(--color-blue-primary);
        color: white;
        border: none;
        border-radius: 0.5rem;

        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        
        transition: all 0.2s ease;
    }

    .primary-button:hover {
        background: var(--color-blue-secondary);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .primary-button:active {
        transform: translateY(0);
    }

    .primary-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        
        transform: none;
        box-shadow: none;
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        padding: 0.75rem 1rem;
        border-radius: 6px;
        
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid var(--color-red-primary);
        
        color: var(--color-red-primary);
        font-size: 0.9rem;
    }

    .success-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        padding: 0.75rem 1rem;
        background: rgba(34, 197, 94, 0.1);
        
        border: 1px solid #22c55e;
        border-radius: 6px;
        color: #16a34a;
        font-size: 0.9rem;
    }

    .error-icon,
    .success-icon {
        font-size: 1rem;
        font-weight: bold;
    }

    .settings-wrapper {
        width: min(100%, 1040px);
        box-sizing: border-box;
        padding: 2.5rem 1.5rem 4rem;
    }

    .settings-header {
        text-align: left;
        margin-bottom: 2.5rem;
        padding-bottom: 1.75rem;
        border-bottom: 1px solid var(--color-navigation-border);
    }

    .settings-back {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.75rem;
        color: var(--color-text-secondary);
        font-size: 0.88rem;
        text-decoration: none;
    }

    .settings-back:hover {
        color: var(--color-blue-secondary);
    }

    .settings-heading-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
    }

    .settings-kicker {
        margin: 0 0 0.3rem;
        color: var(--color-blue-secondary);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
    }

    .settings-header h1 {
        margin: 0;
        font-size: 2rem;
        line-height: 1.2;
    }

    .settings-subtitle {
        margin: 0.5rem 0 0;
        color: var(--color-text-secondary);
        font-size: 0.95rem;
    }

    .account-chip {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        max-width: 45%;
        padding: 0.5rem 0.75rem 0.5rem 0.5rem;
        border: 1px solid var(--color-navigation-border);
        border-radius: 2rem;
        color: var(--color-text-primary);
        font-size: 0.85rem;
        overflow-wrap: anywhere;
    }

    .account-avatar {
        display: grid;
        flex: none;
        place-items: center;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background: var(--color-blue-primary);
        color: #fff;
        font-weight: 600;
        text-transform: uppercase;
    }

    .settings-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: start;
        gap: 2.5rem;
    }

    .settings-card,
    .settings-card:hover {
        width: auto;
        min-width: 0;
        max-width: none;
        padding: 1.4rem;
        border: 1px solid var(--color-navigation-border);
        border-top: 2px solid var(--color-blue-primary);
        border-radius: 0.45rem;
        background: var(--color-background-secondary);
        box-shadow: none;
        transform: none;
    }

    .card-header {
        display: flex;
        align-items: flex-start;
        gap: 0.9rem;
        margin: 0 0 1.4rem;
        padding: 0 0 1rem;
        border-bottom: 1px solid var(--color-navigation-border);
    }

    .section-index {
        color: var(--color-blue-secondary);
        font-size: 0.75rem;
        font-weight: 700;
    }

    .card-header h2 {
        margin: 0;
        font-size: 1.15rem;
    }

    .card-description {
        margin-top: 0.35rem;
        color: var(--color-text-secondary);
        font-size: 0.86rem;
        opacity: 1;
    }

    .settings-form {
        gap: 1.15rem;
    }

    .form-label {
        color: var(--color-text-secondary);
        font-size: 0.82rem;
    }

    .form-input {
        min-width: 0;
        box-sizing: border-box;
        padding: 0.75rem 0.85rem;
        border: 1px solid var(--color-navigation-border);
        border-radius: 0.35rem;
        font-family: inherit;
        font-size: 0.92rem;
    }

    .form-input:focus {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-blue-primary) 18%, transparent);
    }

    .primary-button {
        align-self: flex-start;
        min-height: 2.7rem;
        padding: 0.65rem 1rem;
        margin-top: 0.25rem;
        border-radius: 0.35rem;
        font-size: 0.9rem;
    }

    .primary-button:hover {
        transform: none;
        box-shadow: none;
    }

    @media (max-width: 768px) {
        .settings-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
        }

        .settings-card {
            padding: 1.1rem;
        }

        .settings-header h1 {
            font-size: 1.8rem;
        }

        .settings-wrapper {
            padding: 1.5rem 1rem 3rem;
        }
    }

    @media (max-width: 480px) {
        .settings-heading-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 1rem;
        }

        .account-chip {
            max-width: 100%;
        }

        .form-input,
        .primary-button {
            padding: 0.7rem 0.75rem;
        }
    }
</style>