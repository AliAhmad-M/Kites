<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { Icon } from "$lib";
    
    let { rank, price } = $props();
    let is_purchasing = $state(false);
    
    async function purchase_rank(rank: string) {
        try {
            if (!page.data.authenticated) {
                goto('/login/signin');
                return;
            }
            is_purchasing = true;
            
            const response = await fetch('/api/user/rank', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rank: rank })
            });
            if (response.status === 200) {
                window.location.href = '/';
            } else {
                const data = await response.json();
                alert(data.error);
            }
            
        } catch (e) {
            console.log('[KITES | ERROR]: ', e);
        } finally {
            is_purchasing = false;
        }
    }
</script>

<button class="purchase" onclick={() => purchase_rank(rank)} disabled={is_purchasing}>
    {#if is_purchasing}
        <span class="loading">Processing...</span>
    {:else}
        <span class="button-content">
            <span>Purchase</span>
            <span class="price-display">
                <Icon mode={undefined} name="token" width={18} height={18} alt="token"/>
                {price.toLocaleString()}
            </span>
        </span>
    {/if}
</button>

<style>
    .purchase {
        width: 100%;
        color: var(--color-text-button);
        background: linear-gradient(135deg, #5b6ef3, #2bffba);
        
        border: none;
        border-radius: 0.75rem;
        
        padding: 0.875rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .purchase:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(91, 110, 243, 0.3);
    }
    
    .purchase:active:not(:disabled) {
        transform: translateY(0);
    }
    
    .purchase:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
    
    .button-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }
    
    .price-display {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-weight: 700;
    }
    
    .loading {
        display: block;
        animation: pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }
</style>