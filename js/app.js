/**
 * Fuizlet - Unified Data Store
 * 
 * This store works in two modes:
 * 1. LOCAL MODE: Uses localStorage (for development/offline)
 * 2. CLOUD MODE: Uses Supabase (when configured)
 * 
 * The app automatically uses Supabase when credentials are configured.
 */

// ========================================
// UTILITY FUNCTIONS
// ========================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ========================================
// CHECK IF SUPABASE IS AVAILABLE
// ========================================
function getSupabase() {
    if (window.SupabaseConfig && window.SupabaseConfig.isConfigured() && window.SupabaseConfig.getClient) {
        return window.SupabaseConfig.getClient();
    }
    return null;
}

// ========================================
// LOCAL STORAGE FALLBACK
// ========================================
const LocalStore = {
    // Sets
    getSets: () => JSON.parse(localStorage.getItem('fuizlet_sets') || '[]'),
    saveSets: (sets) => localStorage.setItem('fuizlet_sets', JSON.stringify(sets)),
    getSetById: function (id) { return this.getSets().find(s => s.id === id); },
    addSet: function (set) { const sets = this.getSets(); sets.push(set); this.saveSets(sets); },
    updateSet: function (id, updates) {
        const sets = this.getSets().map(s => s.id === id ? { ...s, ...updates } : s);
        this.saveSets(sets);
    },
    deleteSet: function (id) { this.saveSets(this.getSets().filter(s => s.id !== id)); },

    // Folders
    getFolders: () => JSON.parse(localStorage.getItem('fuizlet_folders') || '[]'),
    saveFolders: (folders) => localStorage.setItem('fuizlet_folders', JSON.stringify(folders)),
    getFolderById: function (id) { return this.getFolders().find(f => f.id === id); },
    addFolder: function (folder) { const folders = this.getFolders(); folders.push(folder); this.saveFolders(folders); },
    deleteFolder: function (id) { this.saveFolders(this.getFolders().filter(f => f.id !== id)); },
    addSetToFolder: function (folderId, setId) {
        const folders = this.getFolders().map(f => {
            if (f.id === folderId && !f.setIds.includes(setId)) f.setIds.push(setId);
            return f;
        });
        this.saveFolders(folders);
    },
    removeSetFromFolder: function (folderId, setId) {
        const folders = this.getFolders().map(f => {
            if (f.id === folderId) f.setIds = f.setIds.filter(id => id !== setId);
            return f;
        });
        this.saveFolders(folders);
    },

    // Groups
    getGroups: () => JSON.parse(localStorage.getItem('fuizlet_groups') || '[]'),
    saveGroups: (groups) => localStorage.setItem('fuizlet_groups', JSON.stringify(groups)),
    getGroupById: function (id) { return this.getGroups().find(g => g.id === id); },
    addGroup: function (group) { const groups = this.getGroups(); groups.push(group); this.saveGroups(groups); },
    deleteGroup: function (id) { this.saveGroups(this.getGroups().filter(g => g.id !== id)); },
    addSetToGroup: function (groupId, setId) {
        const groups = this.getGroups().map(g => {
            if (g.id === groupId && !g.setIds.includes(setId)) g.setIds.push(setId);
            return g;
        });
        this.saveGroups(groups);
    },
    addMemberToGroup: function (groupId, username) {
        const groups = this.getGroups().map(g => {
            if (g.id === groupId && !g.members.includes(username)) g.members.push(username);
            return g;
        });
        this.saveGroups(groups);
    },

    // Auth (local simulation)
    getCurrentUser: () => JSON.parse(localStorage.getItem('fuizlet_current_user') || 'null'),
    logout: () => localStorage.removeItem('fuizlet_current_user'),
    setCurrentUser: (user) => localStorage.setItem('fuizlet_current_user', JSON.stringify(user))
};

// ========================================
// SUPABASE CLOUD STORE
// ========================================
const CloudStore = {
    // Auth
    getCurrentUser: async function () {
        const sb = getSupabase();
        if (!sb) return null;
        const { data: { user } } = await sb.auth.getUser();
        return user;
    },

    signUp: async function (email, password, username) {
        const sb = getSupabase();
        if (!sb) return { error: 'Supabase not configured' };
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });
        return { data, error };
    },

    signIn: async function (email, password) {
        const sb = getSupabase();
        if (!sb) return { error: 'Supabase not configured' };
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        return { data, error };
    },

    signOut: async function () {
        const sb = getSupabase();
        if (!sb) return;
        await sb.auth.signOut();
    },

    // Sets
    getSets: async function () {
        const sb = getSupabase();
        if (!sb) return [];
        const { data, error } = await sb.from('study_sets').select('*').order('created_at', { ascending: false });
        if (error) { console.error(error); return []; }
        return data.map(s => ({ ...s, terms: s.terms || [] }));
    },

    getSetById: async function (id) {
        const sb = getSupabase();
        if (!sb) return null;
        const { data, error } = await sb.from('study_sets').select('*').eq('id', id).single();
        if (error) return null;
        return { ...data, terms: data.terms || [] };
    },

    addSet: async function (set) {
        const sb = getSupabase();
        if (!sb) return null;
        const user = await this.getCurrentUser();
        const { data, error } = await sb.from('study_sets').insert({
            user_id: user.id,
            title: set.title,
            description: set.description || '',
            terms: set.terms || []
        }).select().single();
        if (error) { console.error(error); return null; }
        return data;
    },

    updateSet: async function (id, updates) {
        const sb = getSupabase();
        if (!sb) return;
        await sb.from('study_sets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    },

    deleteSet: async function (id) {
        const sb = getSupabase();
        if (!sb) return;
        await sb.from('study_sets').delete().eq('id', id);
    },

    // Folders
    getFolders: async function () {
        const sb = getSupabase();
        if (!sb) return [];
        const { data, error } = await sb.from('folders').select('*').order('created_at', { ascending: false });
        if (error) { console.error(error); return []; }
        return data.map(f => ({ ...f, setIds: f.set_ids || [] }));
    },

    getFolderById: async function (id) {
        const sb = getSupabase();
        if (!sb) return null;
        const { data, error } = await sb.from('folders').select('*').eq('id', id).single();
        if (error) return null;
        return { ...data, setIds: data.set_ids || [] };
    },

    addFolder: async function (folder) {
        const sb = getSupabase();
        if (!sb) return null;
        const user = await this.getCurrentUser();
        const { data, error } = await sb.from('folders').insert({
            user_id: user.id,
            name: folder.name,
            description: folder.description || '',
            set_ids: []
        }).select().single();
        if (error) { console.error(error); return null; }
        return data;
    },

    deleteFolder: async function (id) {
        const sb = getSupabase();
        if (!sb) return;
        await sb.from('folders').delete().eq('id', id);
    },

    addSetToFolder: async function (folderId, setId) {
        const sb = getSupabase();
        if (!sb) return;
        const folder = await this.getFolderById(folderId);
        if (!folder) return;
        const setIds = [...(folder.setIds || [])];
        if (!setIds.includes(setId)) {
            setIds.push(setId);
            await sb.from('folders').update({ set_ids: setIds }).eq('id', folderId);
        }
    },

    removeSetFromFolder: async function (folderId, setId) {
        const sb = getSupabase();
        if (!sb) return;
        const folder = await this.getFolderById(folderId);
        if (!folder) return;
        const setIds = (folder.setIds || []).filter(id => id !== setId);
        await sb.from('folders').update({ set_ids: setIds }).eq('id', folderId);
    },

    // Groups
    getGroups: async function () {
        const sb = getSupabase();
        if (!sb) return [];
        const { data, error } = await sb.from('groups').select('*, group_members(username)').order('created_at', { ascending: false });
        if (error) { console.error(error); return []; }
        return data.map(g => ({
            ...g,
            setIds: g.set_ids || [],
            members: (g.group_members || []).map(m => m.username)
        }));
    },

    getGroupById: async function (id) {
        const sb = getSupabase();
        if (!sb) return null;
        const { data, error } = await sb.from('groups').select('*, group_members(username, user_id)').eq('id', id).single();
        if (error) return null;
        return {
            ...data,
            setIds: data.set_ids || [],
            members: (data.group_members || []).map(m => m.username)
        };
    },

    addGroup: async function (group) {
        const sb = getSupabase();
        if (!sb) return null;
        const user = await this.getCurrentUser();
        const { data, error } = await sb.from('groups').insert({
            name: group.name,
            description: group.description || '',
            school: group.school || '',
            created_by: user.id,
            set_ids: []
        }).select().single();
        if (error) { console.error(error); return null; }

        // Add creator as first member
        await sb.from('group_members').insert({
            group_id: data.id,
            user_id: user.id,
            username: user.user_metadata?.username || user.email
        });

        return data;
    },

    deleteGroup: async function (id) {
        const sb = getSupabase();
        if (!sb) return;
        await sb.from('groups').delete().eq('id', id);
    },

    addSetToGroup: async function (groupId, setId) {
        const sb = getSupabase();
        if (!sb) return;
        const group = await this.getGroupById(groupId);
        if (!group) return;
        const setIds = [...(group.setIds || [])];
        if (!setIds.includes(setId)) {
            setIds.push(setId);
            await sb.from('groups').update({ set_ids: setIds }).eq('id', groupId);
        }
    },

    addMemberToGroup: async function (groupId, username, userId = null) {
        const sb = getSupabase();
        if (!sb) return;
        await sb.from('group_members').insert({
            group_id: groupId,
            user_id: userId || (await this.getCurrentUser())?.id,
            username: username
        });
    }
};

// ========================================
// UNIFIED STORE (Auto-switches based on config)
// ========================================
const Store = {
    isCloud: () => getSupabase() !== null,

    // Sync wrapper that handles both sync (local) and async (cloud) operations
    _call: function (localMethod, cloudMethod, ...args) {
        if (this.isCloud()) {
            return cloudMethod.apply(CloudStore, args);
        } else {
            return Promise.resolve(localMethod.apply(LocalStore, args));
        }
    },

    // Auth
    getCurrentUser: function () { return this._call(LocalStore.getCurrentUser, CloudStore.getCurrentUser); },
    logout: function () { return this._call(LocalStore.logout, CloudStore.signOut); },
    signUp: function (email, password, username) {
        if (this.isCloud()) {
            return CloudStore.signUp(email, password, username);
        } else {
            const user = { username, email, createdAt: new Date().toISOString() };
            LocalStore.setCurrentUser(user);
            return Promise.resolve({ data: { user }, error: null });
        }
    },
    signIn: function (email, password) {
        if (this.isCloud()) {
            return CloudStore.signIn(email, password);
        } else {
            // Local: just check if user exists (simplified)
            const users = JSON.parse(localStorage.getItem('fuizlet_users') || '[]');
            const user = users.find(u => u.username === email && u.password === password);
            if (user) {
                LocalStore.setCurrentUser(user);
                return Promise.resolve({ data: { user }, error: null });
            }
            return Promise.resolve({ data: null, error: { message: 'Invalid credentials' } });
        }
    },

    // Sets
    getSets: function () { return this._call(LocalStore.getSets, CloudStore.getSets); },
    getSetById: function (id) { return this._call(LocalStore.getSetById, CloudStore.getSetById, id); },
    addSet: function (set) { return this._call(LocalStore.addSet, CloudStore.addSet, set); },
    updateSet: function (id, updates) { return this._call(LocalStore.updateSet, CloudStore.updateSet, id, updates); },
    deleteSet: function (id) { return this._call(LocalStore.deleteSet, CloudStore.deleteSet, id); },

    // Folders
    getFolders: function () { return this._call(LocalStore.getFolders, CloudStore.getFolders); },
    getFolderById: function (id) { return this._call(LocalStore.getFolderById, CloudStore.getFolderById, id); },
    addFolder: function (folder) { return this._call(LocalStore.addFolder, CloudStore.addFolder, folder); },
    deleteFolder: function (id) { return this._call(LocalStore.deleteFolder, CloudStore.deleteFolder, id); },
    addSetToFolder: function (fId, sId) { return this._call(LocalStore.addSetToFolder, CloudStore.addSetToFolder, fId, sId); },
    removeSetFromFolder: function (fId, sId) { return this._call(LocalStore.removeSetFromFolder, CloudStore.removeSetFromFolder, fId, sId); },

    // Groups
    getGroups: function () { return this._call(LocalStore.getGroups, CloudStore.getGroups); },
    getGroupById: function (id) { return this._call(LocalStore.getGroupById, CloudStore.getGroupById, id); },
    addGroup: function (group) { return this._call(LocalStore.addGroup, CloudStore.addGroup, group); },
    deleteGroup: function (id) { return this._call(LocalStore.deleteGroup, CloudStore.deleteGroup, id); },
    addSetToGroup: function (gId, sId) { return this._call(LocalStore.addSetToGroup, CloudStore.addSetToGroup, gId, sId); },
    addMemberToGroup: function (gId, username) { return this._call(LocalStore.addMemberToGroup, CloudStore.addMemberToGroup, gId, username); }
};

// ========================================
// NAVBAR & UI UTILITIES
// ========================================
function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(/[\s@]+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(name) {
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];
    const hash = (name || '').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

async function initNavbar(navLinksSelector = '.nav-links') {
    const navLinks = document.querySelector(navLinksSelector);
    if (!navLinks) return;

    const user = await Store.getCurrentUser();
    const isLoggedIn = !!user;

    // Determine base path (for pages in subdirectory)
    const isInPages = window.location.pathname.includes('/pages/');
    const basePath = isInPages ? '../' : '';
    const pagesPath = isInPages ? '' : 'pages/';

    if (isLoggedIn) {
        const username = user.user_metadata?.username || user.email || 'User';
        const initials = getInitials(username);
        const avatarColor = getAvatarColor(username);

        navLinks.innerHTML = `
            <a href="${pagesPath}sets.html">Sets</a>
            <a href="${pagesPath}folders.html">Folders</a>
            <a href="${pagesPath}groups.html">Groups</a>
            <a href="${pagesPath}create.html" class="btn btn-primary">+ Create</a>
            <div class="user-menu">
                <button class="avatar-btn" id="avatar-btn" style="background: ${avatarColor};">
                    ${initials}
                </button>
                <div class="dropdown-menu" id="dropdown-menu">
                    <div class="dropdown-header">
                        <div class="dropdown-avatar" style="background: ${avatarColor};">${initials}</div>
                        <div class="dropdown-info">
                            <strong>${username}</strong>
                            ${user.email ? `<small>${user.email}</small>` : ''}
                        </div>
                    </div>
                    <hr class="dropdown-divider">
                    <a href="${pagesPath}profile.html" class="dropdown-item">👤 Profile</a>
                    <a href="${pagesPath}sets.html" class="dropdown-item">📚 My Sets</a>
                    <a href="${pagesPath}folders.html" class="dropdown-item">📁 My Folders</a>
                    <hr class="dropdown-divider">
                    <button class="dropdown-item logout-btn" id="logout-btn">🚪 Log Out</button>
                </div>
            </div>
        `;

        // Add dropdown styles if not present
        if (!document.getElementById('navbar-styles')) {
            const style = document.createElement('style');
            style.id = 'navbar-styles';
            style.textContent = `
                .user-menu { position: relative; }
                .avatar-btn {
                    width: 40px; height: 40px; border-radius: 50%; border: none;
                    color: white; font-weight: 700; font-size: 0.9rem; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .avatar-btn:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                .dropdown-menu {
                    position: absolute; top: 50px; right: 0; background: white;
                    border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    min-width: 220px; padding: 0.5rem 0; display: none; z-index: 1000;
                    animation: dropdownFadeIn 0.2s ease;
                }
                .dropdown-menu.active { display: block; }
                @keyframes dropdownFadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .dropdown-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; }
                .dropdown-avatar { width: 45px; height: 45px; border-radius: 50%; font-weight: 700; color: white; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
                .dropdown-info { display: flex; flex-direction: column; }
                .dropdown-info strong { font-size: 0.95rem; }
                .dropdown-info small { color: #6b7280; font-size: 0.8rem; }
                .dropdown-divider { border: none; border-top: 1px solid #e5e7eb; margin: 0.25rem 0; }
                .dropdown-item { display: block; width: 100%; padding: 0.75rem 1rem; text-align: left; background: none; border: none; font-size: 0.9rem; color: #374151; cursor: pointer; text-decoration: none; transition: background 0.15s; }
                .dropdown-item:hover { background: #f3f4f6; }
                .logout-btn { color: #dc2626; }
                .logout-btn:hover { background: #fef2f2; }
            `;
            document.head.appendChild(style);
        }

        // Toggle dropdown
        document.getElementById('avatar-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('dropdown-menu').classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', () => {
            document.getElementById('dropdown-menu')?.classList.remove('active');
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await Store.logout();
            window.location.href = basePath + 'index.html';
        });

    } else {
        // Not logged in - show login/signup
        navLinks.innerHTML = `
            <a href="${pagesPath}sets.html">Sets</a>
            <a href="${pagesPath}folders.html">Folders</a>
            <a href="${pagesPath}groups.html">Groups</a>
            <a href="${pagesPath}login.html" class="btn btn-outline">Log In</a>
            <a href="${pagesPath}signup.html" class="btn btn-primary">Sign Up</a>
        `;
    }
}

// ========================================
// EXPORT
// ========================================
window.Fuizlet = {
    Store,
    LocalStore,
    CloudStore,
    generateId,
    shuffleArray,
    isCloudMode: () => getSupabase() !== null,
    initNavbar,
    getInitials,
    getAvatarColor
};

