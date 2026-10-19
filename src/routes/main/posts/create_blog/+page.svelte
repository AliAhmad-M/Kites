<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { tick } from 'svelte';
    import { marked } from 'marked';
    import sanitizeHtml from 'sanitize-html';

   // character limit configuration based on user type
   type RankType = 'default' | 'Bronze' | 'Silver' | 'Gold' | 'Admin';
    
    const character_limits: Record<RankType, number> = {
        'default': 1200,
        'Bronze': 2000,
        'Silver': 3500,
        'Gold': 5000,
        'Admin': Infinity
    };

    // Get user rank
    let user_rank = page.data.rank;

    // Now validate the rank
    let rank: RankType = Object.keys(character_limits).includes(user_rank) ? user_rank as RankType : 'default';

    // Define character limit reactively
    let character_limit = character_limits[rank];
      
    let heading_text = $state("");
    let content_text = $state("");
    let topic_chosen = $state("");

    let image: File | undefined = $state(undefined);
    let image_preview_url = $state("");
    let editor_mode = $state<'write' | 'preview' | 'split'>('split');
    let editor = $state<HTMLTextAreaElement>();
    let safe_preview = $state("");
    let is_drag_over = $state(false);

    let is_creating = $state(false);
    
    let is_over_limit = $state(false);
    let heading_too_large = $state(false);
    
    let character_count = $state(0);
    let character_count_heading = $state(0);

    // Calculate character count and check if over limit
    $effect(() => {
        calcualte_character_count();
    });

    $effect(() => {
        if (!image) {
            image_preview_url = "";
            return;
        }

        const preview_url = URL.createObjectURL(image);
        image_preview_url = preview_url;
        return () => URL.revokeObjectURL(preview_url);
    });

    $effect(() => {
        const markdown = content_text;
        void render_preview(markdown);
    });

    async function render_preview(markdown: string) {
        try {
            const html = await marked(markdown);
            safe_preview = sanitizeHtml(html, {
                allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'del', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'a', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
                allowedAttributes: { a: ['href', 'target', 'rel'] }
            });
        } catch (error) {
            console.error('[KITES | ERROR]: Failed to render markdown preview:', error);
            safe_preview = '';
        }
    }

    async function focus_editor() {
        if (editor_mode === 'preview') {
            editor_mode = 'split';
            await tick();
        }
    }

    async function insert_markdown(before: string, after = before, placeholder = 'text') {
        await focus_editor();
        if (!editor) return;

        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selected_text = content_text.slice(start, end) || placeholder;
        content_text = `${content_text.slice(0, start)}${before}${selected_text}${after}${content_text.slice(end)}`;
        await tick();
        editor.focus();
        editor.setSelectionRange(start + before.length, start + before.length + selected_text.length);
    }

    async function insert_block(prefix: string, fallback_text: string) {
        await focus_editor();
        if (!editor) return;

        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selected_text = content_text.slice(start, end) || fallback_text;
        const formatted_text = selected_text.split('\n').map((line) => `${prefix}${line}`).join('\n');
        content_text = `${content_text.slice(0, start)}${formatted_text}${content_text.slice(end)}`;
        await tick();
        editor.focus();
        editor.setSelectionRange(start, start + formatted_text.length);
    }
    
    // Calculate character count
    function calcualte_character_count() {
        // Calculate characters without spaces
        character_count = content_text.replace(/\s/g, '').length;
        
        // Check if over character limit
        is_over_limit = character_count > character_limit;

        character_count_heading = heading_text.replace(/\s/g, '').length;

        // Check if heading is too large
        heading_too_large = character_count_heading > 70;
    
    }

    // Image uploading logic
    function handle_file_upload(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target?.files && target.files.length > 0) {
            image = target.files[0]; 
        } else {
            image = undefined;
        }
    }

    function handle_file_drop(event: DragEvent) {
        event.preventDefault();
        is_drag_over = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
            image = files[0];
        }
    }

    function handle_drag_over(event: DragEvent) {
        event.preventDefault();
        is_drag_over = true;
    }

    function handle_drag_leave(event: DragEvent) {
        event.preventDefault();
        is_drag_over = false;
    }

    function remove_image() {
        image = undefined;
    }

    async function create_blogpost() {
        if (!heading_text.trim() || !topic_chosen.trim() || !content_text.trim()) return;

        // Check if over the character limit
        if (is_over_limit || heading_too_large) return;

        try {
            is_creating = true;

            const form_data = new FormData();
            form_data.append('heading', heading_text);
            form_data.append('content', content_text);
            form_data.append('topic', topic_chosen);
            form_data.append('type', "Blog");

            if (image) {
                form_data.append('image', image);
            }

            const response = await fetch('/api/forum/new', {
                method: 'POST',
                body: form_data 
            });
            const data = await response.json();
            
            if (response.status === 401) {
                goto('/login/signin');
                return;
            }

            if (response.status !== 200) {
                alert(data.error);
            }

            // Reset
            heading_text = "";
            content_text = "";
            topic_chosen = "";
            image = undefined;

            const url = `/main/posts/${data.topic}/${data.post_id}`;
            window.location.href = url;

        } catch (e) {
            console.error("[KITES | ERROR] Failed to create new blog post", e);
        } finally {
            is_creating = false;
        }
    }
</script>

<svelte:head>
    <title>Create a Blog Post</title>
</svelte:head>

<div class="content">
    <header class="page-header">
        <h1>Create a blog post</h1>
    </header>
    <div class="form-group title-group">
        <label for="heading">Post title</label>
        <input type="text" id="heading" name="heading" placeholder="Give your post a title" bind:value={heading_text} required>
        {#if heading_too_large}
            <span class="field-error">Title is too long.</span>
        {/if}
    </div>
    
    <div class="form-group editor-group">
        <div class="editor-heading">
            <label for="content">Your story</label>
            <span class="editor-hint">Markdown supported</span>
        </div>
        <div class="editor-toolbar" aria-label="Markdown formatting">
            <div class="format-tools" aria-label="Markdown formatting tools">
                <button class="tool-button heading-tool" type="button" onclick={() => insert_markdown('## ', '', 'Heading')} aria-label="Heading" title="Heading">H2</button>
                <button class="tool-button bold-tool" type="button" onclick={() => insert_markdown('**', '**', 'bold text')} aria-label="Bold" title="Bold">B</button>
                <button class="tool-button italic-tool" type="button" onclick={() => insert_markdown('*', '*', 'italic text')} aria-label="Italic" title="Italic">I</button>
                <button class="tool-button link-tool" type="button" onclick={() => insert_markdown('[', '](url)')} aria-label="Link" title="Link">Link</button>
                <button class="tool-button quote-tool" type="button" onclick={() => insert_block('> ', 'Quote')} aria-label="Blockquote" title="Blockquote">&quot;</button>
                <button class="tool-button code-tool" type="button" onclick={() => insert_markdown('`')} aria-label="Inline code" title="Inline code">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" /></svg>
                </button>
                <button class="tool-button list-tool" type="button" onclick={() => insert_block('- ', 'List item')} aria-label="Bulleted list" title="Bulleted list">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/><path d="M10 6h10M10 12h10M10 18h10" /></svg>
                </button>
                <button class="tool-button ordered-list-tool" type="button" onclick={() => insert_block('1. ', 'List item')} aria-label="Numbered list" title="Numbered list">1.</button>
            </div>
            <div class="view-modes" role="group" aria-label="Editor view mode">
                <button type="button" class:active={editor_mode === 'write'} aria-pressed={editor_mode === 'write'} onclick={() => editor_mode = 'write'}>Write</button>
                <button type="button" class:active={editor_mode === 'preview'} aria-pressed={editor_mode === 'preview'} onclick={() => editor_mode = 'preview'}>Preview</button>
                <button type="button" class:active={editor_mode === 'split'} aria-pressed={editor_mode === 'split'} onclick={() => editor_mode = 'split'}>Split</button>
            </div>
        </div>
        <div class="editor-panes" class:single-pane={editor_mode !== 'split'}>
            {#if editor_mode !== 'preview'}
            <section class="editor-pane" aria-label="Write Markdown">
                <div class="pane-label">Write</div>
                <textarea bind:this={editor} id="content" name="content" placeholder="Start writing here..." rows="12" bind:value={content_text} required></textarea>
            </section>
            {/if}
            {#if editor_mode !== 'write'}
            <section class="editor-pane" aria-label="Rendered preview">
                <div class="pane-label">Preview</div>
                <div class="markdown-preview" aria-live="polite">
                    {#if safe_preview}
                        {@html safe_preview}
                    {:else}
                        <p class="preview-empty">Your formatted post will appear here.</p>
                    {/if}
                </div>
            </section>
            {/if}
        </div>
        <div class="character-count-container">
            <span class={is_over_limit ? "character-count over-limit" : "character-count"}>
                {character_count} / {character_limit} characters
                {#if is_over_limit}
                <span class="limit-warning">(exceeds {rank} user limit)</span>
                {/if}
            </span>
        </div>
    </div>

    <div class="form-group topic-group">
        <label for="topic">Topic</label>
        <select id="topic" name="topic" bind:value={topic_chosen} required>
            <option value="" disabled selected>Select a topic</option>
            <option value="Art">Art</option>
            <option value="Philosophy">Philosophy</option>
            <option value="Nature">Nature</option>
            <option value="Science">Science</option>
        </select>
    </div>
    
    <div class="form-group">
        <label for="image">Cover image <span class="optional-label">Optional</span></label>
        <div class="image-upload-container">
            <div 
                class="image-upload-area {is_drag_over ? 'drag-over' : ''} {image ? 'has-image' : ''}"
                ondrop={handle_file_drop}
                ondragover={handle_drag_over}
                ondragleave={handle_drag_leave}
                role="button"
                tabindex="0"
                aria-label="Drop your image here or click to browse files"
            >
                {#if image}
                    <div class="image-preview">
                        <img class="selected-image" src={image_preview_url} alt={image.name} />
                        <div class="image-info">
                            <div class="image-details">
                                <span class="image-name">{image.name}</span>
                                <span class="image-size">{(image.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        </div>
                        <button type="button" class="remove-image" onclick={remove_image} aria-label="Remove image">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                {:else}
                    <div class="upload-prompt">
                        <svg class="upload-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <div class="upload-text">
                            <span class="upload-primary">Drop your image here</span>
                            <span class="upload-secondary">or click to browse images</span>
                        </div>
                    </div>
                    <input type="file" id="image" name="image" onchange={handle_file_upload} accept="image/*" class="file-input">
                {/if}
            </div>
            {#if image}
                <div class="image-actions">
                    <label class="replace-image" for="replace-image">Choose a different image</label>
                    <input type="file" id="replace-image" onchange={handle_file_upload} accept="image/*" class="visually-hidden">
                    <button type="button" class="remove-image" onclick={remove_image} aria-label="Remove image">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            {/if}
        </div>
    </div>
    

    <div class="form-actions">
        <button type="button" class="confirm" onclick={create_blogpost}
            disabled={!heading_text.trim() || !topic_chosen.trim() || !content_text.trim() || is_creating || is_over_limit || heading_too_large}>
            {is_creating ? 'Publishing...' : 'Publish post'}
        </button>
    </div>
</div>


<style>
    .content {
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
        max-width: 1080px;
        height: fit-content;
        margin: 2.5rem auto;
        padding: 0 2rem 3rem;
    }

    .page-header {
        position: relative;
        padding: 0 0 1.25rem 1.25rem;
        border-bottom: 1px solid var(--color-navigation-border);
    }

    .page-header::before {
        position: absolute;
        top: 0.15rem;
        bottom: 1.25rem;
        left: 0;
        width: 3px;
        background: var(--color-blue-primary);
        content: '';
    }

    .page-header h1 {
        margin: 0;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 2.35rem;
        font-weight: 500;
        line-height: 1.15;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .form-group > label {
        color: var(--color-text-primary);
        font-size: 0.9rem;
        font-weight: 600;
    }

    .title-group {
        width: 100%;
    }

    .title-group input,
    .topic-group select {
        min-height: 3.25rem;
        border: 1px solid var(--color-navigation-border);
        background: var(--color-background-secondary);
        box-shadow: none;
    }

    .title-group input {
        box-sizing: border-box;
        width: 100%;
        padding: 0.85rem 1rem;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 1.35rem;
    }

    .title-group input::placeholder {
        color: var(--color-text-secondary);
        opacity: 0.7;
    }

    .title-group input:focus,
    .topic-group select:focus {
        border-color: var(--color-blue-secondary);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-blue-secondary) 25%, transparent);
    }

    .field-error {
        color: var(--color-red-secondary);
        font-size: 0.8rem;
    }

    .optional-label {
        margin-left: 0.35rem;
        color: var(--color-text-secondary);
        font-size: 0.75rem;
        font-weight: 400;
    }

    .editor-heading,
    .editor-toolbar,
    .image-actions {
        display: flex;
        align-items: center;
    }

    .editor-heading {
        justify-content: space-between;
    }

    .editor-heading label {
        font-weight: 600;
    }

    .editor-hint,
    .preview-empty {
        color: var(--color-text-secondary);
        font-size: 0.85rem;
    }

    .editor-toolbar {
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.35rem;
        min-height: 3.5rem;
        padding: 0.4rem 0.55rem;
        background: var(--color-background-secondary);
        border: 1px solid var(--color-navigation-border);
        border-bottom: 0;
        border-radius: 0.4rem 0.4rem 0 0;
    }

    .format-tools,
    .view-modes {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .tool-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 2.2rem;
        height: 2.2rem;
        flex: 0 0 auto;
        padding: 0;
        border: 0;
        border-radius: 0.3rem;
        background: transparent;
        color: var(--color-text-primary);
        font-size: 0.85rem;
    }

    .tool-button:hover {
        background: var(--color-background-primary);
        color: var(--color-blue-primary);
    }

    .bold-tool {
        font-weight: 800;
    }

    .italic-tool {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 1rem;
        font-style: italic;
        font-weight: 700;
    }

    .code-tool {
        width: 2.65rem;
        font-size: 0.75rem;
    }

    .link-tool {
        width: 2.6rem;
        font-size: 0.75rem;
    }

    .tool-button svg {
        width: 1.1rem;
        height: 1.1rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    .list-tool svg circle {
        fill: currentColor;
        stroke: none;
    }

    .ordered-list-tool {
        font-size: 0.75rem;
        font-weight: 700;
    }

    .quote-tool {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 1.35rem;
        font-weight: 700;
    }

    .view-modes {
        padding: 0.2rem;
        border: 1px solid var(--color-navigation-border);
        border-radius: 0.35rem;
        background: var(--color-background-primary);
    }

    .view-modes button {
        min-height: 1.9rem;
        padding: 0 0.6rem;
        border: 0;
        border-radius: 0.25rem;
        background: transparent;
        color: var(--color-text-secondary);
        font-size: 0.75rem;
    }

    .view-modes button.active {
        background: var(--color-background-secondary);
        color: var(--color-text-primary);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
    }

    .editor-panes {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .editor-panes.single-pane {
        grid-template-columns: minmax(0, 1fr);
    }

    .editor-pane {
        display: flex;
        min-width: 0;
        flex-direction: column;
    }

    .pane-label {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--color-navigation-border);
        border-bottom: 0;
        background: var(--color-background-secondary);
        color: var(--color-text-secondary);
        font-size: 0.8rem;
        font-weight: 600;
    }

    .editor-pane:first-child .pane-label {
        border-radius: 0.35rem 0 0 0;
    }

    .editor-pane:last-child .pane-label {
        border-left: 0;
        border-radius: 0 0.35rem 0 0;
    }

    .editor-panes.single-pane .pane-label {
        border-left: 1px solid var(--color-navigation-border);
        border-radius: 0.25rem 0.25rem 0 0;
    }

    #content,
    .markdown-preview {
        box-sizing: border-box;
        width: 100%;
        min-height: 18rem;
        flex: 1;
        padding: 1rem;
        border: 1px solid var(--color-navigation-border);
        box-shadow: none;
        line-height: 1.7;
    }

    #content {
        resize: vertical;
        border-radius: 0 0 0 0.5rem;
    }

    .markdown-preview {
        overflow-wrap: anywhere;
        border-left: 0;
        border-radius: 0 0 0.5rem 0;
    }

    .editor-panes.single-pane #content,
    .editor-panes.single-pane .markdown-preview {
        border-left: 1px solid var(--color-navigation-border);
        border-radius: 0 0 0.4rem 0.4rem;
    }

    .markdown-preview :global(:first-child) {
        margin-top: 0;
    }

    .markdown-preview :global(pre) {
        overflow-x: auto;
        padding: 0.85rem;
        border-radius: 0.35rem;
        background: var(--color-background-secondary);
    }

    .markdown-preview :global(a) {
        color: var(--color-blue-secondary);
    }

    input[type="text"],
    select,
    textarea {
        padding: 0.75rem;
        background-color: var(--color-background-primary);
        font-family: inherit;
        font-weight: 500;
        
        border: none;
        border-radius: 0.5rem;
        
        font-size: 1rem;
        
        color: var(--color-text-primary);

        box-shadow: 0 0 0 3px rgba(var(--color-blue-primary-rgb, 0, 120, 212), 0.25);
        transition: all 0.3s ease;
    }

    input[type="text"]:focus,
    select:focus,
    textarea:focus {
        outline: none;
        border-color: var(--color-blue-secondary);
        background-color: var(--color-background-primary);
        box-shadow: 0 0 0 3px rgba(var(--color-blue-primary-rgb, 0, 120, 212), 0.45);
    }

    option {
        color: var(--color-text-primary)
    }

    option:disabled {
        color: var(--color-text-secondary);
    }

    .form-group input[type="file"] {
        width: 100%;
        padding: 0.5rem;
        border: 1.5px dashed var(--color-blue-secondary);
        background-color: rgba(0, 0, 0, 0.03);
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s;
    }

    .form-group input[type="file"]:hover {
        background-color: rgba(0, 0, 0, 0.05);
        border-color: var(--color-blue-primary);
    }

    .form-group input[type="file"]:focus {
        outline: none;
        border-color: var(--color-blue-primary);
        box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
    }

    .image-upload-container {
        width: 100%;
    }

    .image-upload-area {
        position: relative;
        width: 100%;
        min-height: 120px;
        border: 2px dashed rgba(var(--color-blue-primary-rgb, 0, 120, 212), 0.4);
        border-radius: 0.4rem;
        background-color: var(--color-background-secondary);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .image-upload-area:hover {
        border-color: rgba(var(--color-blue-primary-rgb, 0, 120, 212), 0.6);
        background-color: rgba(var(--color-blue-primary-rgb, 0, 120, 212), 0.05);
    }

    .image-upload-area.drag-over {
        border-color: var(--color-blue-primary);
        background-color: rgba(var(--color-blue-primary-rgb, 0, 120, 212), 0.1);
        transform: scale(1.02);
    }

    .image-upload-area.has-image {
        border-style: solid;
        border-color: rgba(var(--color-blue-primary-rgb, 0, 120, 212), 0.3);
        background-color: rgba(var(--color-blue-primary-rgb, 0, 120, 212), 0.05);
    }

    .file-input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }

    .upload-prompt {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        text-align: center;
    }

    .upload-icon {
        color: var(--color-blue-primary);
        opacity: 0.7;
    }

    .upload-text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .upload-primary {
        font-weight: 600;
        color: var(--color-text-primary);
        font-size: 1rem;
    }

    .upload-secondary {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
    }

    .image-preview {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 1rem;
        gap: 1rem;
        justify-content: flex-start;
    }

    .selected-image {
        width: 8rem;
        height: 6rem;
        flex: 0 0 auto;
        object-fit: cover;
        border-radius: 0.4rem;
    }

    .image-actions {
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 0 1rem 0.75rem;
    }

    .replace-image {
        color: var(--color-blue-secondary);
        cursor: pointer;
        font-size: 0.85rem;
    }

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        border: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        clip-path: inset(50%);
    }

    .form-group input[type="file"].visually-hidden {
        width: 1px;
        padding: 0;
        border: 0;
    }

    .image-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .image-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .image-name {
        font-weight: 600;
        color: var(--color-text-primary);
        font-size: 0.95rem;
    }

    .image-size {
        font-size: 0.8rem;
        color: var(--color-text-secondary);
    }

    .remove-image {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background-color: rgba(var(--color-red-primary), 0.1);
        border: none;
        border-radius: 50%;
        color: var(--color-red-primary);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .remove-image:hover {
        background-color: rgba(var(--color-red-primary), 0.15);
        transform: scale(1.1);
    }

    textarea {
        min-height: 150px;
        resize: none;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.25rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-navigation-border);
    }

    button {
        padding: 0.65rem 1.2rem;
        border-radius: 0.35rem;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.3s ease;
        border: none;
    }

    button.confirm {
        background-color: var(--color-blue-primary);
        color: var(--color-text-button);
        min-width: 10rem;
        font-weight: 650;
    }

    button.confirm:hover {
        background-color: var(--color-blue-secondary);
    }
    
    button.confirm:active {
        transform: translateY(1px);
    }
    
    button.confirm:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .character-count-container {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
    }
      
    .character-count {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
    }
      
    .over-limit {
        color: var(--color-red-primary);
        font-weight: 500;
    }
      
    .limit-warning {
        font-style: italic;
        margin-left: 0.5rem;
    }

    @media screen and (max-width: 768px) {
        .content {
            margin: 1.5rem auto;
            padding: 0 1rem 2rem;
            gap: 1.35rem;
        }

        .editor-toolbar {
            align-items: flex-start;
        }

        .format-tools {
            flex-wrap: wrap;
        }

        .selected-image {
            width: 6rem;
            height: 5rem;
        }

        .editor-panes {
            grid-template-columns: minmax(0, 1fr);
        }

        .editor-pane:first-child .pane-label,
        .editor-pane:last-child .pane-label {
            border-left: 1px solid var(--color-navigation-border);
            border-radius: 0;
        }

        #content,
        .markdown-preview {
            min-height: 14rem;
            border-radius: 0;
        }

        .markdown-preview {
            border-left: 1px solid var(--color-navigation-border);
        }
        
        .form-actions {
            flex-direction: column;
        }
        
        button {
            width: 100%;
        }

        .tool-button,
        .view-modes button {
            width: auto;
        }

        .view-modes {
            width: 100%;
        }

        .view-modes button {
            flex: 1;
        }
    }

    @media screen and (max-width: 480px) {
        .page-header h1 {
            font-size: 1.9rem;
        }

        .editor-toolbar {
            gap: 0.65rem;
        }

        .format-tools {
            width: 100%;
        }

        .view-modes {
            box-sizing: border-box;
        }

        .title-group input {
            font-size: 1.15rem;
        }
    }

</style>
