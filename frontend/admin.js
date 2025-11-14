// Admin Console JavaScript

class AdminConsole {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.editingUserId = null;
        this.deletingUserId = null;
        
        this.initializeAdmin();
    }
    
    async initializeAdmin() {
        // Check if user is logged in and is admin
        try {
            const response = await api.verifyToken();
            if (!response.success || !response.user) {
                window.location.href = 'index.html';
                return;
            }
            
            this.currentUser = response.user;
            
            // Check if user is admin
            if (!this.currentUser.isAdmin) {
                this.showToast('Access denied. Admin privileges required.', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            
            document.getElementById('admin-username').textContent = this.currentUser.username;
            
            this.initializeEventListeners();
            await this.loadUsers();
            this.updateStats();
            
        } catch (error) {
            console.error('Admin initialization error:', error);
            window.location.href = 'index.html';
        }
    }
    
    initializeEventListeners() {
        // Header actions
        document.getElementById('back-to-game').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        document.getElementById('admin-logout').addEventListener('click', () => {
            api.logout();
            window.location.href = 'index.html';
        });
        
        // Add user button
        document.getElementById('add-user-btn').addEventListener('click', () => {
            this.showUserModal();
        });
        
        // Search and filter
        document.getElementById('search-users').addEventListener('input', (e) => {
            this.filterUsers(e.target.value, document.getElementById('filter-admin').value);
        });
        
        document.getElementById('filter-admin').addEventListener('change', (e) => {
            this.filterUsers(document.getElementById('search-users').value, e.target.value);
        });
        
        // User modal
        document.getElementById('close-user-modal').addEventListener('click', () => {
            this.hideUserModal();
        });
        
        document.getElementById('cancel-user-form').addEventListener('click', () => {
            this.hideUserModal();
        });
        
        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserSubmit();
        });
        
        // Delete modal
        document.getElementById('close-delete-modal').addEventListener('click', () => {
            this.hideDeleteModal();
        });
        
        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.hideDeleteModal();
        });
        
        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.deleteUser();
        });
        
        // Stats modal
        document.getElementById('close-stats-modal').addEventListener('click', () => {
            this.hideStatsModal();
        });
        
        // Close modals on outside click
        document.getElementById('user-modal').addEventListener('click', (e) => {
            if (e.target.id === 'user-modal') this.hideUserModal();
        });
        
        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') this.hideDeleteModal();
        });
        
        document.getElementById('stats-modal').addEventListener('click', (e) => {
            if (e.target.id === 'stats-modal') this.hideStatsModal();
        });
    }
    
    async loadUsers() {
        try {
            const response = await fetch('http://localhost:3000/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.users = data.users;
                this.renderUsers(this.users);
            } else {
                this.showToast('Failed to load users', 'error');
            }
        } catch (error) {
            console.error('Load users error:', error);
            this.showToast('Error loading users', 'error');
        }
    }
    
    renderUsers(users) {
        const tbody = document.getElementById('users-table-body');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="loading">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => {
            const winRate = user.total_games > 0 
                ? Math.round((user.total_wins / user.total_games) * 100) 
                : 0;
            
            const createdDate = new Date(user.created_at).toLocaleDateString();
            
            return `
                <tr>
                    <td>${user.id}</td>
                    <td>${this.escapeHtml(user.username)}</td>
                    <td>${this.escapeHtml(user.email)}</td>
                    <td>
                        <span class="role-badge ${user.is_admin ? 'admin' : 'user'}">
                            ${user.is_admin ? '👑 Admin' : '👤 User'}
                        </span>
                    </td>
                    <td>${user.total_games || 0}</td>
                    <td>${user.total_wins || 0}</td>
                    <td>${winRate}%</td>
                    <td>${createdDate}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="adminConsole.viewUserStats(${user.id})">
                                📊 Stats
                            </button>
                            <button class="action-btn edit" onclick="adminConsole.editUser(${user.id})">
                                ✏️ Edit
                            </button>
                            <button class="action-btn delete" onclick="adminConsole.confirmDelete(${user.id}, '${this.escapeHtml(user.username)}')">
                                🗑️ Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    filterUsers(searchTerm, adminFilter) {
        let filtered = this.users;
        
        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user => 
                user.username.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term)
            );
        }
        
        // Filter by admin status
        if (adminFilter === 'admin') {
            filtered = filtered.filter(user => user.is_admin);
        } else if (adminFilter === 'regular') {
            filtered = filtered.filter(user => !user.is_admin);
        }
        
        this.renderUsers(filtered);
    }
    
    updateStats() {
        const totalUsers = this.users.length;
        const adminUsers = this.users.filter(u => u.is_admin).length;
        const totalGames = this.users.reduce((sum, u) => sum + (u.total_games || 0), 0);
        
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('admin-users').textContent = adminUsers;
        document.getElementById('total-games-all').textContent = totalGames;
    }
    
    showUserModal(userId = null) {
        this.editingUserId = userId;
        const modal = document.getElementById('user-modal');
        const title = document.getElementById('modal-title');
        const passwordHint = document.getElementById('password-hint');
        const form = document.getElementById('user-form');
        
        form.reset();
        
        if (userId) {
            title.textContent = 'Edit User';
            passwordHint.style.display = 'block';
            
            const user = this.users.find(u => u.id === userId);
            if (user) {
                document.getElementById('user-username').value = user.username;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-is-admin').checked = user.is_admin;
                document.getElementById('user-password').required = false;
            }
        } else {
            title.textContent = 'Add New User';
            passwordHint.style.display = 'none';
            document.getElementById('user-password').required = true;
        }
        
        modal.classList.add('active');
    }
    
    hideUserModal() {
        document.getElementById('user-modal').classList.remove('active');
        this.editingUserId = null;
    }
    
    async handleUserSubmit() {
        const username = document.getElementById('user-username').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const password = document.getElementById('user-password').value;
        const is_admin = document.getElementById('user-is-admin').checked;
        
        const userData = { username, email, is_admin };
        
        if (password) {
            userData.password = password;
        }
        
        try {
            let response;
            
            if (this.editingUserId) {
                // Update user
                response = await fetch(`http://localhost:3000/api/admin/users/${this.editingUserId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(userData)
                });
            } else {
                // Create user
                response = await fetch('http://localhost:3000/api/admin/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(userData)
                });
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(data.message, 'success');
                this.hideUserModal();
                await this.loadUsers();
                this.updateStats();
            } else {
                this.showToast(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('User operation error:', error);
            this.showToast('Error saving user', 'error');
        }
    }
    
    editUser(userId) {
        this.showUserModal(userId);
    }
    
    confirmDelete(userId, username) {
        this.deletingUserId = userId;
        document.getElementById('delete-username').textContent = username;
        document.getElementById('delete-modal').classList.add('active');
    }
    
    hideDeleteModal() {
        document.getElementById('delete-modal').classList.remove('active');
        this.deletingUserId = null;
    }
    
    async deleteUser() {
        if (!this.deletingUserId) return;
        
        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${this.deletingUserId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(data.message, 'success');
                this.hideDeleteModal();
                await this.loadUsers();
                this.updateStats();
            } else {
                this.showToast(data.message || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            this.showToast('Error deleting user', 'error');
        }
    }
    
    async viewUserStats(userId) {
        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const stats = data.stats;
                const winRate = stats.total_games > 0 
                    ? Math.round((stats.total_wins / stats.total_games) * 100) 
                    : 0;
                
                document.getElementById('stats-username').textContent = stats.username;
                document.getElementById('user-total-games').textContent = stats.total_games || 0;
                document.getElementById('user-total-wins').textContent = stats.total_wins || 0;
                document.getElementById('user-total-losses').textContent = stats.total_losses || 0;
                document.getElementById('user-total-draws').textContent = stats.total_draws || 0;
                document.getElementById('user-win-rate').textContent = winRate + '%';
                document.getElementById('user-best-streak').textContent = stats.best_streak || 0;
                document.getElementById('user-easy-stats').textContent = 
                    `${stats.easy_wins || 0}/${stats.easy_games || 0}`;
                document.getElementById('user-medium-stats').textContent = 
                    `${stats.medium_wins || 0}/${stats.medium_games || 0}`;
                document.getElementById('user-hard-stats').textContent = 
                    `${stats.hard_wins || 0}/${stats.hard_games || 0}`;
                document.getElementById('user-playtime').textContent = 
                    this.formatPlaytime(stats.total_playtime || 0);
                
                document.getElementById('stats-modal').classList.add('active');
            } else {
                this.showToast('Failed to load user stats', 'error');
            }
        } catch (error) {
            console.error('View stats error:', error);
            this.showToast('Error loading user statistics', 'error');
        }
    }
    
    hideStatsModal() {
        document.getElementById('stats-modal').classList.remove('active');
    }
    
    formatPlaytime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
    
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize admin console when page loads
let adminConsole;
document.addEventListener('DOMContentLoaded', () => {
    adminConsole = new AdminConsole();
});