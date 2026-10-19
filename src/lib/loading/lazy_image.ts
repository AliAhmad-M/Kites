import type { Action } from "svelte/action";

type LazyImageOptions = {
    src: string;
    priority?: boolean;
};

export const lazyImage: Action<HTMLImageElement, LazyImageOptions> = (node, options) => {
    const markLoaded = () => node.classList.add("lazy-image-loaded");

    const handleLoad = () => markLoaded();

    const updateOptions = (nextOptions: LazyImageOptions) => {
        if (options.src !== nextOptions.src) {
            node.classList.remove("lazy-image-loaded");
        }

        node.loading = nextOptions.priority ? "eager" : "lazy";
        node.decoding = "async";
        node.fetchPriority = nextOptions.priority ? "high" : "auto";
        node.classList.add("lazy-image");

        if (node.complete) {
            markLoaded();
        }

        options = nextOptions;
    };

    node.addEventListener("load", handleLoad);
    node.addEventListener("error", handleLoad);
    updateOptions(options);

    return {
        update: updateOptions,
        destroy() {
            node.removeEventListener("load", handleLoad);
            node.removeEventListener("error", handleLoad);
        }
    };
};