// --- COMPREHENSIVE VISUAL EDITOR LOGIC ---
const ADMIN_API = '/api/content';

async function initVisualEditor() {
    if (window.self === window.top) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
        const verifyRes = await fetch('/api/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!verifyRes.ok) {
            localStorage.removeItem('adminToken');
            console.error("Visual Editor: Invalid token, rendering blocked.");
            return;
        }
    } catch(e) {
        console.error("Visual Editor: Could not verify token. Network error?", e);
        return;
    }

    console.log("Comprehensive Visual Editor Initialized");

    // 1. Fetch Current Colors to populate the live palette
    let currentPrimary = '#c1aa85';
    let currentDark = '#0f100d';
    try {
        const res = await fetch('/api/content');
        if (res.ok) {
            const content = await res.json();
            if (content['primary-color']) currentPrimary = content['primary-color'];
            if (content['dark-color']) currentDark = content['dark-color'];
        }
    } catch(e) {}

    // 2. Inject Premium Editor CSS
    const style = document.createElement('style');
    style.innerHTML = `
        [data-cms-key] { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
        [data-cms-key]:hover {
            outline: 2px dashed #c1aa85 !important;
            outline-offset: 4px; cursor: text; border-radius: 2px;
            background: rgba(193, 170, 133, 0.05);
        }
        [data-cms-key][data-cms-type="image"]:hover { cursor: pointer; }
        [data-cms-key][contenteditable="true"] {
            max-width: 100%; overflow: hidden; text-overflow: clip;
        }
        [data-cms-key][contenteditable="true"]:focus {
            outline: 2px solid #c1aa85 !important;
            outline-offset: 4px; background: rgba(193, 170, 133, 0.1);
        }
        .cms-editable-region {
            transition: outline 0.2s, outline-offset 0.2s, background 0.2s;
            outline: 1px dashed transparent;
        }
        .cms-editable-region:hover {
            outline: 1px dashed rgba(193, 170, 133, 0.6);
            outline-offset: 2px;
            cursor: text;
        }
        [data-cms-type="image"].cms-editable-region:hover {
            cursor: pointer;
        }

        #admin-toolbar {
            position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
            background: rgba(10, 10, 10, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            padding: 12px 24px; border-radius: 100px; display: flex; align-items: center; gap: 16px;
            z-index: 999999; box-shadow: 0 16px 32px rgba(0,0,0,0.5);
            border: 1px solid rgba(255, 255, 255, 0.1); font-family: -apple-system, sans-serif;
            overflow: visible;
        }
        
        .color-toggle-group { position: relative; }
        .toolbar-btn {
            background: transparent; color: #fffaf1; border: 1px solid rgba(255,255,255,0.2);
            padding: 10px 20px; border-radius: 100px; cursor: pointer; display: flex; align-items: center; gap: 8px;
            font-size: 13px; font-weight: 500; transition: all 0.3s; height: 38px; box-sizing: border-box;
        }
        .toolbar-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(193, 170, 133, 0.4); }
        .toolbar-btn.active { background: rgba(193, 170, 133, 0.15); border-color: #c1aa85; color: #c1aa85; }
        .toolbar-btn.icon-btn { padding: 10px; border-radius: 50%; }
        .toolbar-btn:disabled { opacity: 0.3; cursor: not-allowed; border-color: transparent; }

        #color-panel {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: rgba(12, 13, 10, 0.95); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
            padding: 40px 32px calc(env(safe-area-inset-bottom) + 110px); 
            border-top: 1px solid rgba(193, 170, 133, 0.15); border-radius: 24px 24px 0 0;
            box-shadow: 0 -24px 64px rgba(0,0,0,0.6); 
            transform: translateY(100%); opacity: 0; pointer-events: none; transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        }
        #color-panel.active { transform: translateY(0); opacity: 1; pointer-events: auto; }
        
        #cms-palette-control { max-width: 960px; margin: 0 auto; display: flex; gap: 64px; align-items: flex-start; justify-content: space-between; }
        .colors-col { display: flex; flex-wrap: wrap; gap: 32px; flex: 2; align-content: flex-start; justify-content: center; }
        .palette-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; margin-bottom: 0;}
        .palette-item label { color: rgba(255,255,255,0.6); font-size: 11px; white-space: nowrap; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
        .palette-item input[type="color"] {
            width: 56px; height: 56px; border: none; border-radius: 50%; cursor: pointer; flex-shrink: 0;
            background: transparent; padding: 0; outline: none; border: 2px solid rgba(255,255,255,0.1);
            transition: transform 0.2s, border-color 0.2s; box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .palette-item input[type="color"]:hover { transform: scale(1.1); border-color: rgba(193, 170, 133, 0.5); }
        .palette-item input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        .palette-item input[type="color"]::-webkit-color-swatch { border: none; border-radius: 50%; }

        .presets-section { padding-left: 64px; border-left: 1px solid rgba(255,255,255,0.08); flex: 1; min-width: 320px; }
        .preset-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; margin-bottom: 20px; display: block; color: #fff; }
        .preset-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 16px; }
        .preset-load { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #fff; padding: 14px 20px; border-radius: 12px; font-size: 14px; cursor: pointer; transition: 0.2s; text-align: left; white-space: nowrap; font-weight: 500; }
        .preset-load:hover { background: rgba(255,255,255,0.08); border-color: rgba(193, 170, 133, 0.3); }
        .preset-save { width: 48px; height: 48px; flex-shrink: 0; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 18px; }
        .preset-save:hover { background: rgba(255,255,255,0.08); border-color: rgba(193, 170, 133, 0.3); }
        .preset-save:active { transform: scale(0.95); }

        @media (max-width: 800px) {
            #color-panel { padding: 32px 24px calc(env(safe-area-inset-bottom) + 110px); }
            #cms-palette-control { flex-direction: column; gap: 40px; align-items: stretch; }
            .colors-col { display: grid; grid-template-columns: repeat(auto-fit, minmax(64px, 1fr)); gap: 16px; justify-items: center; }
            .palette-item input[type="color"] { width: 48px; height: 48px; }
            .presets-section { border-left: none; padding-left: 0; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 32px; min-width: 100%; }
        }

        #save-visual-btn {
            background: #c1aa85; color: #000; border: none; padding: 0 24px; height: 38px; box-sizing: border-box;
            border-radius: 100px; font-weight: 600; font-size: 13px; cursor: pointer;
            transition: all 0.3s; box-shadow: 0 4px 12px rgba(193, 170, 133, 0.2);
            white-space: nowrap; display: flex; align-items: center; justify-content: center;
        }
        #save-visual-btn:hover { background: #d4bea0; transform: translateY(-1px); }
        #save-visual-btn.success { background: #4ade80; color: #000; box-shadow: 0 4px 16px rgba(74, 222, 128, 0.4); }

        /* Custom Image Editor Modal */
        #img-edit-modal {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(12px); z-index: 9999999;
            display: none; justify-content: center; align-items: center; opacity: 0;
            transition: opacity 0.3s; font-family: -apple-system, sans-serif;
        }
        .modal-glass {
            background: rgba(25, 28, 23, 0.9); border: 1px solid rgba(193, 170, 133, 0.2);
            border-radius: 16px; padding: 32px; width: 100%; max-width: 440px;
            box-shadow: 0 32px 64px rgba(0,0,0,0.6); transform: translateY(20px); transition: transform 0.3s;
        }
        .modal-glass h3 { margin: 0 0 16px 0; color: #fffaf1; font-size: 18px; font-weight: 500; }
        .modal-thumb { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.1); }
        .modal-glass input {
            width: 100%; padding: 14px; background: rgba(0,0,0,0.5); border: 1px solid rgba(193, 170, 133, 0.3); color: #fff;
            border-radius: 8px; margin-bottom: 24px; box-sizing: border-box; outline: none; font-size: 14px;
        }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
        .modal-btn { padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; border: none; }
        .btn-cancel { background: transparent; color: #fff; opacity: 0.7; }
        .btn-apply { background: #c1aa85; color: #000; }

        /* Image Overlays */
        #cms-image-overlays { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999997; }
        .cms-img-edit-overlay {
            position: absolute; pointer-events: auto;
            background: rgba(193, 170, 133, 0.95); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            color: #000; border: none; padding: 8px 16px; width: auto; justify-content: center;
            border-radius: 100px; font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 600;
            display: flex; align-items: center; gap: 8px; cursor: pointer;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5); transition: transform 0.2s, background 0.2s;
        }
        .cms-img-edit-overlay:hover {
            background: #fff; transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);

    // 3. Inject DOM Components
    const toolbar = document.createElement('div');
    toolbar.id = 'admin-toolbar';
    toolbar.innerHTML = `
        <button id="undo-btn" class="toolbar-btn icon-btn" title="Undo" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path></svg>
        </button>
        <button id="redo-btn" class="toolbar-btn icon-btn" title="Redo" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path></svg>
        </button>
        <div class="color-toggle-group">
            <button id="toggle-colors-btn" class="toolbar-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                Colors
            </button>
        </div>
        <button id="revert-btn" class="toolbar-btn icon-btn" title="Discard Changes" style="border-color: rgba(255, 59, 48, 0.3); color: #ff3b30;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path></svg>
        </button>
        <button id="save-visual-btn">Publish Live</button>
    `;
    document.body.appendChild(toolbar);

    const colorPanel = document.createElement('div');
    colorPanel.id = 'color-panel';
    colorPanel.innerHTML = `
        <div id="cms-palette-control">
            <div class="colors-col">
                <div class="palette-item">
                    <input type="color" id="live-accent-1" value="#c1aa85">
                    <label>Accent 1</label>
                </div>
                <div class="palette-item">
                    <input type="color" id="live-accent-2" value="#929a80">
                    <label>Accent 2</label>
                </div>
                <div class="palette-item">
                    <input type="color" id="live-dark" value="#0f100d">
                    <label>Dark Base</label>
                </div>
                <div class="palette-item">
                    <input type="color" id="live-light" value="#f4efe5">
                    <label>Light Base</label>
                </div>
                <div class="palette-item">
                    <input type="color" id="live-white" value="#fffaf1">
                    <label>Pure Base</label>
                </div>
            </div>
            <div class="presets-section">
                <label class="preset-label">Theme Presets</label>
                <div class="preset-row">
                    <button class="preset-load" data-preset="1">Original</button>
                    <button class="preset-save" data-preset="1" title="Save Current to Original">💾</button>
                </div>
                <div class="preset-row">
                    <button class="preset-load" data-preset="2">High Upscale</button>
                    <button class="preset-save" data-preset="2" title="Save Current to Upscale">💾</button>
                </div>
                <div class="preset-row">
                    <button class="preset-load" data-preset="3">Homie</button>
                    <button class="preset-save" data-preset="3" title="Save Current to Homie">💾</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(colorPanel);


    const modal = document.createElement('div');
    modal.id = 'img-edit-modal';
    modal.innerHTML = `
        <div class="modal-glass" id="img-modal-glass" style="max-width: 800px; width: 90vw; padding: 0; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <h3 style="margin:0; font-size: 18px; color: #c1aa85;">Media Manager</h3>
                <div class="media-tabs" style="display: flex; gap: 8px; background: rgba(0,0,0,0.5); padding: 4px; border-radius: 8px;">
                    <button class="tab-btn active" data-tab="upload" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;">Upload & Crop</button>
                    <button class="tab-btn" data-tab="library" style="background: transparent; border: none; color: #aaa; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;">Library</button>
                </div>
            </div>
            
            <div id="tab-content-upload" style="padding: 24px;">
                <div id="media-drop-zone" style="border: 2px dashed rgba(255,255,255,0.2); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(0,0,0,0.2);">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c1aa85" stroke-width="2" style="margin-bottom: 12px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <div style="font-size: 16px; font-weight: 500;">Drag & Drop image to upload</div>
                    <div style="font-size: 13px; color: #888; margin-top: 4px;">or click to browse</div>
                    <input type="file" id="media-file-input" accept="image/*" style="display: none;">
                </div>
                
                <div id="media-crop-zone" style="display: none; flex-direction: column; gap: 16px;">
                    <div style="width: 100%; height: 400px; background: #000; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <img id="media-crop-img" src="" style="max-width: 100%; max-height: 100%; display: block;">
                    </div>
                </div>
            </div>
            
            <div id="tab-content-library" style="padding: 24px; display: none; height: 448px; overflow-y: auto;">
                <div id="media-library-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px;">
                    <!-- Thumbs go here -->
                </div>
            </div>
            
            <div style="padding: 20px 24px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: flex-end; gap: 12px; background: rgba(0,0,0,0.3);">
                <button class="modal-btn btn-cancel" id="modal-cancel">Cancel</button>
                <button class="modal-btn btn-apply" id="modal-apply" disabled>Upload & Apply</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const cropperCss = document.createElement('link');
    cropperCss.rel = 'stylesheet';
    cropperCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
    document.head.appendChild(cropperCss);

    const cropperJs = document.createElement('script');
    cropperJs.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
    document.head.appendChild(cropperJs);


    // Color Panel Toggle Logic
    const toggleBtn = document.getElementById('toggle-colors-btn');
    toggleBtn.addEventListener('click', () => {
        const isActive = colorPanel.classList.toggle('active');
        toggleBtn.classList.toggle('active', isActive);
    });

    // Close color panel if clicking outside
    document.addEventListener('click', (e) => {
        if (!toolbar.contains(e.target) && !colorPanel.contains(e.target)) {
            colorPanel.classList.remove('active');
            toggleBtn.classList.remove('active');
        }
    });

    // Color Listeners
    document.getElementById('live-accent-1').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--champagne', e.target.value);
    });
    document.getElementById('live-accent-2').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--sage', e.target.value);
    });
    document.getElementById('live-dark').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--ink', e.target.value);
    });
    document.getElementById('live-light').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--ivory', e.target.value);
    });
    document.getElementById('live-white').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--white', e.target.value);
    });

    
    document.getElementById('live-accent-1').addEventListener('change', pushState);
    document.getElementById('live-accent-2').addEventListener('change', pushState);
    document.getElementById('live-dark').addEventListener('change', pushState);
    document.getElementById('live-light').addEventListener('change', pushState);
    document.getElementById('live-white').addEventListener('change', pushState);

    // Media Manager Logic
    let currentEditingImage = null;
    let cropperInstance = null;
    let currentAspectRatio = 1;

    document.getElementById('modal-cancel').addEventListener('click', closeImageModal);
    
    function cleanUrl(url) {
        if (!url) return '';
        if (url.startsWith('http')) {
            try {
                const u = new URL(url);
                if (u.origin === window.location.origin) { url = u.pathname + u.search + u.hash; }
            } catch(e) {}
        }
        if (url.startsWith('/preview/')) url = url.substring(9);
        if (url.startsWith('/')) url = url.substring(1);
        return url;
    }

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = '#aaa';
            });
            e.target.classList.add('active');
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.color = '#fff';
            
            const tab = e.target.getAttribute('data-tab');
            document.getElementById('tab-content-upload').style.display = tab === 'upload' ? 'block' : 'none';
            document.getElementById('tab-content-library').style.display = tab === 'library' ? 'block' : 'none';
            
            if (tab === 'library') loadMediaLibrary();
        });
    });

    // Upload & Crop Zone
    const dropZone = document.getElementById('media-drop-zone');
    const fileInput = document.getElementById('media-file-input');
    const cropZone = document.getElementById('media-crop-zone');
    const cropImg = document.getElementById('media-crop-img');
    const applyBtn = document.getElementById('modal-apply');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.background = 'rgba(255,255,255,0.05)'; });
    dropZone.addEventListener('dragleave', () => dropZone.style.background = 'rgba(0,0,0,0.2)');
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.style.background = 'rgba(0,0,0,0.2)';
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', e => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            dropZone.style.display = 'none';
            cropZone.style.display = 'flex';
            cropImg.src = e.target.result;
            
            if (cropperInstance) cropperInstance.destroy();
            // Wait for Cropper to be loaded (we injected the script)
            const initCropper = () => {
                if (typeof Cropper !== 'undefined') {
                    cropperInstance = new Cropper(cropImg, {
                        aspectRatio: currentAspectRatio,
                        viewMode: 1,
                        autoCropArea: 1,
                        background: false
                    });
                    applyBtn.disabled = false;
                } else { setTimeout(initCropper, 100); }
            };
            initCropper();
        };
        reader.readAsDataURL(file);
    }

    applyBtn.addEventListener('click', async () => {
        if (!cropperInstance) return;
        applyBtn.textContent = 'Uploading...';
        applyBtn.disabled = true;
        
        cropperInstance.getCroppedCanvas().toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('media', blob, 'cropped.jpg');
            
            try {
                const token = localStorage.getItem('adminToken');
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    applyImageToDom(data.url);
                } else { alert("Upload failed"); }
            } catch(e) { console.error(e); }
            
            applyBtn.textContent = 'Upload & Apply';
            closeImageModal();
            pushState();
        }, 'image/jpeg', 0.9);
    });

    function applyImageToDom(url) {
        if (!currentEditingImage) return;
        const clean = cleanUrl(url);
        if (currentEditingImage.tagName === 'IMG') {
            currentEditingImage.src = clean;
        } else {
            currentEditingImage.style.backgroundImage = `url('${clean}')`;
        }
    }

    async function loadMediaLibrary() {
        const grid = document.getElementById('media-library-grid');
        grid.innerHTML = '<div style="color:#888;">Loading...</div>';
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/media', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const urls = await res.json();
                grid.innerHTML = '';
                if (urls.length === 0) grid.innerHTML = '<div style="color:#888;">No uploaded media yet.</div>';
                urls.forEach(url => {
                    const thumb = document.createElement('div');
                    thumb.style.cssText = `aspect-ratio: 1; background-image: url('${url}'); background-size: cover; background-position: center; border-radius: 8px; cursor: pointer; border: 2px solid transparent;`;
                    thumb.onclick = () => {
                        applyImageToDom(url);
                        closeImageModal();
                        pushState();
                    };
                    grid.appendChild(thumb);
                });
            }
        } catch(e) { grid.innerHTML = '<div style="color:red;">Failed to load library</div>'; }
    }

    function openImageModal(imgElement) {
        currentEditingImage = imgElement;
        
        // Calculate Aspect Ratio
        const rect = imgElement.getBoundingClientRect();
        currentAspectRatio = rect.width / rect.height;
        if (!currentAspectRatio || !isFinite(currentAspectRatio)) currentAspectRatio = 1;
        
        // Reset Modal
        dropZone.style.display = 'block';
        cropZone.style.display = 'none';
        applyBtn.disabled = true;
        if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
        document.getElementById('media-file-input').value = '';
        
        // Switch to upload tab
        document.querySelector('.tab-btn[data-tab="upload"]').click();
        
        const modalEl = document.getElementById('img-edit-modal');
        const glassEl = document.getElementById('img-modal-glass');
        modalEl.style.display = 'flex'; void modalEl.offsetWidth;
        modalEl.style.opacity = '1'; glassEl.style.transform = 'translateY(0)';
    }

    function closeImageModal() {
        const modalEl = document.getElementById('img-edit-modal');
        const glassEl = document.getElementById('img-modal-glass');
        modalEl.style.opacity = '0'; glassEl.style.transform = 'translateY(20px)';
        setTimeout(() => { modalEl.style.display = 'none'; currentEditingImage = null; }, 300);
    }
    const overlayContainer = document.createElement('div');
    overlayContainer.id = 'cms-image-overlays';
    document.body.appendChild(overlayContainer);
    let imageOverlays = [];

    function updateOverlayPositions() {
        imageOverlays.forEach(({img, btn}) => {
            const rect = img.getBoundingClientRect();
            // Check visibility (including opacity for hero slides)
            const style = window.getComputedStyle(img);
            if (rect.width === 0 || rect.height === 0 || style.opacity === '0' || style.display === 'none') {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'flex';
                btn.style.top = (window.scrollY + rect.top + 16) + 'px';
                btn.style.left = (window.scrollX + rect.left + 16) + 'px'; // Top-left corner
            }
        });
    }

    window.addEventListener('resize', updateOverlayPositions);
    setInterval(updateOverlayPositions, 1000); // Catch slider changes

    
    // --- HISTORY STACK ---
    const historyStack = [];
    let historyIndex = -1;
    let isApplyingHistory = false;

    function captureState() {
        if (isApplyingHistory) return null;
        const state = {};
        document.querySelectorAll('[data-cms-key]').forEach(el => {
            const key = el.getAttribute('data-cms-key');
            const type = el.getAttribute('data-cms-type');
            if (type === 'text') {
                state[key] = el.innerText;
            } else if (type === 'image') {
                state[key] = el.tagName === 'IMG' ? el.getAttribute('src') : (el.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') || '');
                state[key] = cleanUrl(state[key]);
            }
        });
        state['accent-1-color'] = document.getElementById('live-accent-1').value;
        state['accent-2-color'] = document.getElementById('live-accent-2').value;
        state['dark-color'] = document.getElementById('live-dark').value;
        state['light-color'] = document.getElementById('live-light').value;
        state['white-color'] = document.getElementById('live-white').value;
        return state;
    }

    function pushState() {
        if (isApplyingHistory) return;
        const newState = captureState();
        if (!newState) return;
        if (historyIndex >= 0) {
            const prev = historyStack[historyIndex];
            let changed = false;
            for (let k in newState) { if (newState[k] !== prev[k]) { changed = true; break; } }
            if (!changed) return;
        }
        
        if (historyIndex < historyStack.length - 1) {
            historyStack.length = historyIndex + 1;
        }
        historyStack.push(newState);
        historyIndex++;
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        if (undoBtn) undoBtn.disabled = historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1;
    }

    function applyHistoryState(state) {
        if (!state) return;
        isApplyingHistory = true;
        document.querySelectorAll('[data-cms-key]').forEach(el => {
            const key = el.getAttribute('data-cms-key');
            const type = el.getAttribute('data-cms-type');
            if (state[key] !== undefined) {
                if (type === 'text') {
                    if (el.innerText !== state[key]) el.innerText = state[key];
                } else if (type === 'image') {
                    const clean = cleanUrl(state[key]);
                    if (el.tagName === 'IMG') {
                        if (!el.src.endsWith(clean)) el.src = clean;
                    } else {
                        const bg = `url('${clean}')`;
                        if (el.style.backgroundImage !== bg && el.style.backgroundImage !== `url("${clean}")`) {
                            el.style.backgroundImage = bg;
                        }
                    }
                }
            }
        });
        
        document.getElementById('live-accent-1').value = state['accent-1-color']; document.documentElement.style.setProperty('--champagne', state['accent-1-color']);
        document.getElementById('live-accent-2').value = state['accent-2-color']; document.documentElement.style.setProperty('--sage', state['accent-2-color']);
        document.getElementById('live-dark').value = state['dark-color']; document.documentElement.style.setProperty('--ink', state['dark-color']);
        document.getElementById('live-light').value = state['light-color']; document.documentElement.style.setProperty('--ivory', state['light-color']);
        document.getElementById('live-white').value = state['white-color']; document.documentElement.style.setProperty('--white', state['white-color']);
        
        setTimeout(() => { isApplyingHistory = false; }, 100);
    }

    document.getElementById('undo-btn').addEventListener('click', () => {
        if (historyIndex > 0) {
            historyIndex--;
            applyHistoryState(historyStack[historyIndex]);
            updateHistoryButtons();
        }
    });
    
    document.getElementById('redo-btn').addEventListener('click', () => {
        if (historyIndex < historyStack.length - 1) {
            historyIndex++;
            applyHistoryState(historyStack[historyIndex]);
            updateHistoryButtons();
        }
    });
    // --- END HISTORY STACK ---

    // 4. Comprehensive Component Mapping
    const editableMap = [
        // Hero
        { key: 'hero-eyebrow', selector: '.hero-copy .eyebrow', type: 'text' },
        { key: 'hero-headline', selector: '#hero-title', type: 'text' },
        { key: 'hero-subtext', selector: '.hero-copy p:not(.eyebrow)', type: 'text' },
        { key: 'hero-btn-primary', selector: '.hero-actions .button-primary', type: 'text' },
        { key: 'hero-btn-ghost', selector: '.hero-actions .button-ghost', type: 'text' },
        { key: 'years-in-business', selector: '.card-number', type: 'text' },
        { key: 'director-card-sub', selector: '.director-card p', type: 'text' },
        { key: 'director-card-strong', selector: '.director-card strong', type: 'text' },
        { key: 'arrival-ribbon-1', selector: '.arrival-ribbon span:nth-child(1)', type: 'text' },
        { key: 'arrival-ribbon-2', selector: '.arrival-ribbon span:nth-child(2)', type: 'text' },
        { key: 'arrival-ribbon-3', selector: '.arrival-ribbon span:nth-child(3)', type: 'text' },
        { key: 'arrival-ribbon-4', selector: '.arrival-ribbon span:nth-child(4)', type: 'text' },
        { key: 'arrival-ribbon-5', selector: '.arrival-ribbon span:nth-child(5)', type: 'text' },
        
        // Experience
        { key: 'experience-eyebrow', selector: '.experience-copy .eyebrow', type: 'text' },
        { key: 'experience-headline', selector: '#experience-title', type: 'text' },
        { key: 'experience-subtext', selector: '.experience-copy p:not(.eyebrow)', type: 'text' },
        { key: 'experience-card-1-title', selector: '.experience-stack article:nth-child(1) h3', type: 'text' },
        { key: 'experience-card-1-sub', selector: '.experience-stack article:nth-child(1) p', type: 'text' },
        { key: 'experience-card-2-title', selector: '.experience-stack article:nth-child(2) h3', type: 'text' },
        { key: 'experience-card-2-sub', selector: '.experience-stack article:nth-child(2) p', type: 'text' },
        { key: 'experience-card-3-title', selector: '.experience-stack article:nth-child(3) h3', type: 'text' },
        { key: 'experience-card-3-sub', selector: '.experience-stack article:nth-child(3) p', type: 'text' },
        
        // Packages
        { key: 'packages-eyebrow', selector: '.packages .eyebrow', type: 'text' },
        { key: 'packages-title', selector: '#packages-title', type: 'text' },
        { key: 'package-btn-1-title', selector: '.package-stage button:nth-child(1) strong', type: 'text' },
        { key: 'package-btn-1-sub', selector: '.package-stage button:nth-child(1) small', type: 'text' },
        { key: 'package-btn-2-title', selector: '.package-stage button:nth-child(2) strong', type: 'text' },
        { key: 'package-btn-2-sub', selector: '.package-stage button:nth-child(2) small', type: 'text' },
        { key: 'package-btn-3-title', selector: '.package-stage button:nth-child(3) strong', type: 'text' },
        { key: 'package-btn-3-sub', selector: '.package-stage button:nth-child(3) small', type: 'text' },
        
        // Fleet
        { key: 'fleet-eyebrow', selector: '.fleet-copy .eyebrow', type: 'text' },
        { key: 'fleet-headline', selector: '#fleet-title', type: 'text' },
        { key: 'fleet-subtext', selector: '.fleet-copy p:not(.eyebrow)', type: 'text' },
        { key: 'fleet-caption-1-sub', selector: '.fleet-frame:nth-child(1) span', type: 'text' },
        { key: 'fleet-caption-1-strong', selector: '.fleet-frame:nth-child(1) strong', type: 'text' },
        { key: 'fleet-caption-2', selector: '.fleet-frame:nth-child(2) figcaption', type: 'text' },
        { key: 'fleet-caption-3', selector: '.fleet-frame:nth-child(3) figcaption', type: 'text' },
        { key: 'fleet-caption-4', selector: '.fleet-frame:nth-child(4) figcaption', type: 'text' },
        
        // Venue
        { key: 'venue-eyebrow', selector: '.venue-scene .eyebrow', type: 'text' },
        { key: 'venue-headline', selector: '#venues-title', type: 'text' },
        { key: 'venue-subtext', selector: '.venue-scene-content p:not(.eyebrow)', type: 'text' },
        
        // Quote
        { key: 'quote-eyebrow', selector: '.quote-copy .eyebrow', type: 'text' },
        { key: 'quote-headline', selector: '#reserve-title', type: 'text' },
        { key: 'quote-subtext', selector: '.quote-copy p:not(.eyebrow)', type: 'text' },
        { key: 'contact-phone', selector: '.contact-line a[href^="tel"]', type: 'text' },
        { key: 'contact-email', selector: '.contact-line a[href^="mailto"]', type: 'text' },

        // Images
        { key: 'hero-slide-1', selector: '.hero-slides img:nth-child(1)', type: 'image' },
        { key: 'hero-slide-2', selector: '.hero-slides img:nth-child(2)', type: 'image' },
        { key: 'hero-slide-3', selector: '.hero-slides img:nth-child(3)', type: 'image' },
        { key: 'package-img-1', selector: '.package-stage button:nth-child(1) img', type: 'image' },
        { key: 'package-img-2', selector: '.package-stage button:nth-child(2) img', type: 'image' },
        { key: 'package-img-3', selector: '.package-stage button:nth-child(3) img', type: 'image' },
        { key: 'fleet-image-1', selector: '.fleet-frame:nth-child(1) img', type: 'image' },
        { key: 'fleet-image-2', selector: '.fleet-frame:nth-child(2) img', type: 'image' },
        { key: 'fleet-image-3', selector: '.fleet-frame:nth-child(3) img', type: 'image' },
        { key: 'fleet-image-4', selector: '.fleet-frame:nth-child(4) img', type: 'image' }
,
        // --- MASS EXHAUSTIVE MAPPING ---
        // Header
        { key: 'header-mark-main', selector: '.site-header .wordmark span', type: 'text' },
        { key: 'header-mark-sub', selector: '.site-header .wordmark small', type: 'text' },
        { key: 'nav-link-1', selector: '.site-nav a:nth-child(1)', type: 'text' },
        { key: 'nav-link-2', selector: '.site-nav a:nth-child(2)', type: 'text' },
        { key: 'nav-link-3', selector: '.site-nav a:nth-child(3)', type: 'text' },
        { key: 'nav-link-4', selector: '.site-nav a:nth-child(4)', type: 'text' },
        { key: 'nav-cta', selector: '.site-nav .nav-cta', type: 'text' },

        // Hero Additional
        { key: 'hero-scene-label', selector: '.scene-label', type: 'text' },
        { key: 'arrival-ribbon-4', selector: '.arrival-ribbon span:nth-child(4)', type: 'text' },
        { key: 'arrival-ribbon-5', selector: '.arrival-ribbon span:nth-child(5)', type: 'text' },

        // Cinema Strip (first 9)
        { key: 'cinema-strip-1', selector: '.strip-track span:nth-child(1)', type: 'text' },
        { key: 'cinema-strip-2', selector: '.strip-track span:nth-child(2)', type: 'text' },
        { key: 'cinema-strip-3', selector: '.strip-track span:nth-child(3)', type: 'text' },
        { key: 'cinema-strip-4', selector: '.strip-track span:nth-child(4)', type: 'text' },
        { key: 'cinema-strip-5', selector: '.strip-track span:nth-child(5)', type: 'text' },
        { key: 'cinema-strip-6', selector: '.strip-track span:nth-child(6)', type: 'text' },
        { key: 'cinema-strip-7', selector: '.strip-track span:nth-child(7)', type: 'text' },
        { key: 'cinema-strip-8', selector: '.strip-track span:nth-child(8)', type: 'text' },
        { key: 'cinema-strip-9', selector: '.strip-track span:nth-child(9)', type: 'text' },

        // Experience Numbers
        { key: 'experience-num-1', selector: '.experience-stack article:nth-child(1) span', type: 'text' },
        { key: 'experience-num-2', selector: '.experience-stack article:nth-child(2) span', type: 'text' },
        { key: 'experience-num-3', selector: '.experience-stack article:nth-child(3) span', type: 'text' },

        // Package Additions
        { key: 'package-num-1', selector: '.package-stage button:nth-child(1) .package-index', type: 'text' },
        { key: 'package-num-2', selector: '.package-stage button:nth-child(2) .package-index', type: 'text' },
        { key: 'package-num-3', selector: '.package-stage button:nth-child(3) .package-index', type: 'text' },
        { key: 'planner-kicker', selector: '.planner-board .panel-kicker', type: 'text' },
        { key: 'planner-title', selector: '.planner-board [data-summary-title]', type: 'text' },
        { key: 'planner-copy', selector: '.planner-board [data-summary-copy]', type: 'text' },
        { key: 'planner-list-1', selector: '.planner-board ol li:nth-child(1)', type: 'text' },
        { key: 'planner-list-2', selector: '.planner-board ol li:nth-child(2)', type: 'text' },
        { key: 'planner-list-3', selector: '.planner-board ol li:nth-child(3)', type: 'text' },

        // Venue Additions
        { key: 'venue-image', selector: '.venue-scene-image', type: 'image' },
        { key: 'venue-cloud-1', selector: '.venue-cloud span:nth-child(1)', type: 'text' },
        { key: 'venue-cloud-2', selector: '.venue-cloud span:nth-child(2)', type: 'text' },
        { key: 'venue-cloud-3', selector: '.venue-cloud span:nth-child(3)', type: 'text' },
        { key: 'venue-cloud-4', selector: '.venue-cloud span:nth-child(4)', type: 'text' },
        { key: 'venue-cloud-5', selector: '.venue-cloud span:nth-child(5)', type: 'text' },
        { key: 'venue-cloud-6', selector: '.venue-cloud span:nth-child(6)', type: 'text' },
        { key: 'venue-cloud-7', selector: '.venue-cloud span:nth-child(7)', type: 'text' },
        { key: 'venue-cloud-8', selector: '.venue-cloud span:nth-child(8)', type: 'text' },
        { key: 'venue-cloud-9', selector: '.venue-cloud span:nth-child(9)', type: 'text' },
        { key: 'venue-cloud-10', selector: '.venue-cloud span:nth-child(10)', type: 'text' },
        { key: 'venue-cloud-11', selector: '.venue-cloud span:nth-child(11)', type: 'text' },
        { key: 'venue-cloud-12', selector: '.venue-cloud span:nth-child(12)', type: 'text' },
        { key: 'venue-cloud-13', selector: '.venue-cloud span:nth-child(13)', type: 'text' },
        { key: 'venue-cloud-14', selector: '.venue-cloud span:nth-child(14)', type: 'text' },
        { key: 'venue-cloud-15', selector: '.venue-cloud span:nth-child(15)', type: 'text' },

        // Timeline
        { key: 'timeline-eyebrow', selector: '.timeline .eyebrow', type: 'text' },
        { key: 'timeline-title', selector: '#timeline-title', type: 'text' },
        { key: 'timeline-num-1', selector: '.timeline-grid article:nth-child(1) span', type: 'text' },
        { key: 'timeline-title-1', selector: '.timeline-grid article:nth-child(1) h3', type: 'text' },
        { key: 'timeline-copy-1', selector: '.timeline-grid article:nth-child(1) p', type: 'text' },
        { key: 'timeline-num-2', selector: '.timeline-grid article:nth-child(2) span', type: 'text' },
        { key: 'timeline-title-2', selector: '.timeline-grid article:nth-child(2) h3', type: 'text' },
        { key: 'timeline-copy-2', selector: '.timeline-grid article:nth-child(2) p', type: 'text' },
        { key: 'timeline-num-3', selector: '.timeline-grid article:nth-child(3) span', type: 'text' },
        { key: 'timeline-title-3', selector: '.timeline-grid article:nth-child(3) h3', type: 'text' },
        { key: 'timeline-copy-3', selector: '.timeline-grid article:nth-child(3) p', type: 'text' },

        // Quote & Footer
        { key: 'quote-phone', selector: '.contact-line a:nth-child(1)', type: 'text' },
        { key: 'quote-email', selector: '.contact-line a:nth-child(2)', type: 'text' },
        { key: 'quote-btn', selector: '.quote-form button[type="submit"]', type: 'text' },
        { key: 'footer-mark-main', selector: '.site-footer .wordmark span', type: 'text' },
        { key: 'footer-mark-sub', selector: '.site-footer .wordmark small', type: 'text' },
        { key: 'footer-copy', selector: '.site-footer p', type: 'text' },
        { key: 'footer-nav-1', selector: '.site-footer nav a:nth-child(1)', type: 'text' },
        { key: 'footer-nav-2', selector: '.site-footer nav a:nth-child(2)', type: 'text' },
        { key: 'footer-nav-3', selector: '.site-footer nav a:nth-child(3)', type: 'text' },
        { key: 'footer-nav-4', selector: '.site-footer nav a:nth-child(4)', type: 'text' }
    ];

    editableMap.forEach(map => {
        const elements = document.querySelectorAll(map.selector);
        // Bind the first match
        if (elements.length > 0) {
            const el = elements[0];
            el.setAttribute('data-cms-key', map.key);
            el.setAttribute('data-cms-type', map.type);
            el.classList.add('cms-editable-region');
            
            if (map.type === 'text') {
                el.setAttribute('contenteditable', 'true');
                el.addEventListener('click', e => {
                    e.preventDefault(); e.stopPropagation();
                });
                el.addEventListener('input', () => {
                    if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
                        el.style.outline = '2px solid red';
                        el.style.outlineOffset = '-2px';
                    } else {
                        el.style.outline = '';
                        el.style.outlineOffset = '';
                    }
                });
                el.addEventListener('blur', () => {
                    el.style.outline = '';
                    pushState();
                });
            } else if (map.type === 'image') {
                el.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    openImageModal(el);
                });
                
                const btn = document.createElement('button');
                btn.className = 'cms-img-edit-overlay';
                btn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Edit Picture
                `;
                btn.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    openImageModal(el);
                });
                overlayContainer.appendChild(btn);
                imageOverlays.push({ img: el, btn: btn });
            }
        }
    });

    updateOverlayPositions();
    setTimeout(pushState, 800);

    // 5. Publish Logic
    document.getElementById('revert-btn').addEventListener('click', async () => {
        if (!confirm('Discard all local changes and revert to the live production state?')) return;
        try {
            const res = await fetch(ADMIN_API);
            if (res.ok) {
                const freshState = await res.json();
                historyStack = [];
                historyIndex = -1;
                applyHistoryState(freshState);
                pushState(); // Save as new base
            }
        } catch(e) { console.error('Failed to revert', e); }
    });

    document.getElementById('save-visual-btn').addEventListener('click', async () => {
        const btn = document.getElementById('save-visual-btn');
        btn.textContent = "Publishing...";
        
        const updates = [];
        document.querySelectorAll('[data-cms-key]').forEach(el => {
            const key = el.getAttribute('data-cms-key');
            const type = el.getAttribute('data-cms-type');
            let val = '';
            if (type === 'text') {
                val = el.innerText;
            } else if (type === 'image') {
                val = el.tagName === 'IMG' ? el.getAttribute('src') : (el.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') || '');
                val = cleanUrl(val);
            }
            updates.push({
                key: key,
                type: type,
                value: val
            });
        });

        // Add colors to updates
        updates.push({ key: 'accent-1-color', type: 'color', value: document.getElementById('live-accent-1').value });
        updates.push({ key: 'accent-2-color', type: 'color', value: document.getElementById('live-accent-2').value });
        updates.push({ key: 'dark-color', type: 'color', value: document.getElementById('live-dark').value });
        updates.push({ key: 'light-color', type: 'color', value: document.getElementById('live-light').value });
        updates.push({ key: 'white-color', type: 'color', value: document.getElementById('live-white').value });
        
        updates.push({ key: '_updated_at', type: 'meta', value: new Date().toISOString() });

        try {
            const res = await fetch(ADMIN_API, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                btn.textContent = "✓ Published!";
                btn.classList.add('success');
                setTimeout(() => { btn.textContent = "Publish Live"; btn.classList.remove('success'); }, 3000);
            } else {
                alert("Failed to save changes. Session may have expired.");
                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem('adminToken');
                    window.location.reload();
                }
            }
        } catch (error) {
            alert("Could not connect to the backend.");
            btn.textContent = "Publish Live";
        }
    });
    // --- PRESET LOGIC ---
    const DEFAULT_PRESETS = {
        '1': { 'accent-1-color': '#c1aa85', 'accent-2-color': '#929a80', 'dark-color': '#0f100d', 'light-color': '#f4efe5', 'white-color': '#fffaf1' },
        '2': { 'accent-1-color': '#e5c158', 'accent-2-color': '#2c2c2c', 'dark-color': '#ffffff', 'light-color': '#0a0a0a', 'white-color': '#141414' },
        '3': { 'accent-1-color': '#d48a60', 'accent-2-color': '#6b705c', 'dark-color': '#3f3e3a', 'light-color': '#fdfbf7', 'white-color': '#ffffff' }
    };

    let savedPresets = {};

    async function loadPresets() {
        try {
            const res = await fetch(ADMIN_API);
            const data = await res.json();
            if (data['preset-1']) savedPresets['1'] = JSON.parse(data['preset-1']);
            if (data['preset-2']) savedPresets['2'] = JSON.parse(data['preset-2']);
            if (data['preset-3']) savedPresets['3'] = JSON.parse(data['preset-3']);
        } catch(e) {}
    }

    function applyColors(colors) {
        if (!colors) return;
        if (colors['accent-1-color']) { document.getElementById('live-accent-1').value = colors['accent-1-color']; document.documentElement.style.setProperty('--champagne', colors['accent-1-color']); }
        if (colors['accent-2-color']) { document.getElementById('live-accent-2').value = colors['accent-2-color']; document.documentElement.style.setProperty('--sage', colors['accent-2-color']); }
        if (colors['dark-color']) { document.getElementById('live-dark').value = colors['dark-color']; document.documentElement.style.setProperty('--ink', colors['dark-color']); }
        if (colors['light-color']) { document.getElementById('live-light').value = colors['light-color']; document.documentElement.style.setProperty('--ivory', colors['light-color']); }
        if (colors['white-color']) { document.getElementById('live-white').value = colors['white-color']; document.documentElement.style.setProperty('--white', colors['white-color']); }
    }

    document.querySelectorAll('.preset-load').forEach(btn => {
        btn.addEventListener('click', () => {
            const pid = btn.getAttribute('data-preset');
            const pColors = savedPresets[pid] || DEFAULT_PRESETS[pid];
            applyColors(pColors);
            pushState();
        });
    });

    document.querySelectorAll('.preset-save').forEach(btn => {
        btn.addEventListener('click', async () => {
            const pid = btn.getAttribute('data-preset');
            const currentColors = {
                'accent-1-color': document.getElementById('live-accent-1').value,
                'accent-2-color': document.getElementById('live-accent-2').value,
                'dark-color': document.getElementById('live-dark').value,
                'light-color': document.getElementById('live-light').value,
                'white-color': document.getElementById('live-white').value
            };
            
            const originalText = btn.textContent;
            btn.textContent = '⏳';
            
            savedPresets[pid] = currentColors;
            
            try {
                // We use the token from visual-editor.js
                await fetch(ADMIN_API, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify([{ key: 'preset-' + pid, type: 'text', value: JSON.stringify(currentColors) }])
                });
                btn.textContent = '✅';
                setTimeout(() => btn.textContent = originalText, 2000);
            } catch(e) {
                btn.textContent = '❌';
                setTimeout(() => btn.textContent = originalText, 2000);
            }
        });
    });

    loadPresets();
    // --- END PRESET LOGIC ---

}

setTimeout(initVisualEditor, 500);
