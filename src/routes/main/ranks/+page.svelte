<script>
    import { RankCard } from "$lib";
</script>
<svelte:head>
    <title>Kites | Premium</title>
</svelte:head>

<div class="container">
    <div class="header">
        <h1>Premium Ranks</h1>
        <p>Unlock exclusive features and stand out in the community</p>
    </div>
    
    <div class="content">
        <RankCard rank="Bronze" price={1000}/>
        <RankCard rank="Silver" price={3000}/>
        <RankCard rank="Golden" price={5000}/>
    </div>
</div>

<style>
    .container {
        min-height: 80vh;
        padding: 3rem 2rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .header {
        text-align: center;
        margin-bottom: 3rem;
    }

    .header h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
        color: var(--color-text-primary);
    }

    .header p {
        font-size: 1.1rem;
        color: var(--color-text-secondary);
    }

    .content {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
        place-items: center;
    }

    @media screen and (max-width: 1400px) {
        .content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .header h1 {
            font-size: 2rem;
        }

        .container {
            padding: 2rem 1rem;
        }
    }
</style>