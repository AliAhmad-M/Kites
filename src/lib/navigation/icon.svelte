<script>
    let { mode, name, width, height, alt = "" } = $props();

    $effect(() => {
        if (!mode) return;

        const alternate_mode = mode === "dark_mode_icons" ? "light_mode_icons" : "dark_mode_icons";
        const preload = new Image();
        preload.src = `/icons/${alternate_mode}/${name}.svg`;
    });
</script>

{#if mode}
    <img src={`/icons/${mode}/${name}.svg`} width={width} height={height} alt={alt} />
{:else}
    <img src={`/icons/${name}.svg`} width={width} height={height} alt={alt} />
{/if}