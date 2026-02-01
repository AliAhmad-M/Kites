<script lang="ts">
    import { Icon, Purchase } from "$lib"
    
    let { rank, price } = $props();
    
    const perks = {
        'Bronze': {
            discussion: 500,
            blog: 2000
        },
        'Silver': {
            discussion: 750,
            blog: 3500
        },
        'Golden': {
            discussion: 1000,
            blog: 5000
        }
    };
    
    //@ts-ignore
    const currentPerks = perks[rank];
</script>

<div class="card">
    <div class="icon-container">
        <Icon mode={undefined} name={rank} width={56} height={56} alt="verified"/>
    </div>
    
    <div class="content">
        <h2>{rank}</h2>
        <p class="subtitle">Premium Tier</p>
        
        <div class="perks">
            <h3>Perks</h3>
            <ul>
                <li>
                    <span class="perk-icon">✓</span>
                    {rank} verified badge
                </li>
                <li>
                    <span class="perk-icon">✓</span>
                    {currentPerks.discussion} character limit on discussion posts
                </li>
                <li>
                    <span class="perk-icon">✓</span>
                    {currentPerks.blog.toLocaleString()} character limit on discussion posts
                </li>
            </ul>
        </div>
    </div>
    
    <Purchase rank={rank} price={price}/>
</div>

<style>
    .card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        padding: 2rem 1.75rem;   
        width: clamp(250px, 44vw, 320px);

        
        background-color: var(--color-background-primary);
        
        border-radius: 1.25rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    }
    
    @property --angle {
        syntax: "<angle>";
        initial-value: 0deg;
        inherits: false;
    }
    
    .card::after, .card::before {
        content: '';
        
        position: absolute;
        top: -0.125rem;
        left: -0.125rem;
        width: calc(100% + 0.25rem);
        height: calc(100% + 0.25rem);
        
        background-image: conic-gradient(from var(--angle), #2bffba, #5b6ef3, #2bffba);
        z-index: -1;
        
        border-radius: 1.375rem;
        
        animation: spin 3s linear infinite;
    }
    
    .card::before {
        filter: blur(1.5rem);
        opacity: 0.25;
    }
    
    .icon-container {
        margin-bottom: 1rem;
    }
    
    .content {
        width: 100%;
        text-align: center;
    }
    
    .card h2 {
        margin: 0 0 0.25rem 0;
        font-size: 1.75rem;
        color: var(--color-text-primary);
    }
    
    .subtitle {
        margin: 0 0 1.5rem 0;
        font-size: 0.9rem;
        color: var(--color-text-secondary);
    }
    
    .perks {
        margin-bottom: 1.5rem;
        text-align: left;
    }
    
    .perks h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        color: var(--color-text-primary);
    }
    
    .perks ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .perks li {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: var(--color-text-secondary);
    }
    
    .perk-icon {
        color: #2bffba;
        font-weight: bold;
        margin-right: 0.5rem;
        font-size: 1.1rem;
    }
    
    @keyframes spin {
        from { --angle: 0deg; }
        to { --angle: 360deg; }
    }
</style>