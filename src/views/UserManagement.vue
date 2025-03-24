<template>
  <div class="user-management">
    <!-- Access denied message for non-admin users -->
    <div v-if="!isAdmin" class="access-denied">
      <h1>Access Denied</h1>
      <p>You don't have permission to access this page. Administrator privileges are required.</p>
      <button @click="goToDashboard" class="go-back-btn">Go to Dashboard</button>
    </div>

    <!-- User management UI for admin users -->
    <div v-else>
      <h1>User Management</h1>
      
      <!-- User list -->
      <div class="user-list">
        <div class="table-header">
          <div class="loading-spinner" v-if="loading">Loading...</div>
          <button @click="fetchUsers" class="refresh-btn">Refresh</button>
          <button @click="showAddUserModal = true" class="add-btn">Add User</button>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td class="actions">
                <button @click="editUser(user)" class="edit-btn">Edit</button>
                <button @click="confirmDelete(user)" class="delete-btn">Delete</button>
              </td>
            </tr>
            <tr v-if="!loading && users.length === 0">
              <td colspan="4" class="no-users">No users found</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Add User Modal -->
      <div v-if="showAddUserModal" class="modal">
        <div class="modal-content">
          <h2>Add New User</h2>
          <form @submit.prevent="addUser">
            <div class="form-group">
              <label for="new-username">Username</label>
              <input 
                type="text" 
                id="new-username" 
                v-model="newUser.username" 
                required
              />
            </div>
            <div class="form-group">
              <label for="new-password">Password</label>
              <input 
                type="password" 
                id="new-password" 
                v-model="newUser.password" 
                required
              />
            </div>
            <div class="form-actions">
              <button type="button" @click="showAddUserModal = false" class="cancel-btn">Cancel</button>
              <button type="submit" class="save-btn">Add User</button>
            </div>
            <div v-if="addError" class="error-message">{{ addError }}</div>
          </form>
        </div>
      </div>
      
      <!-- Edit User Modal -->
      <div v-if="showEditUserModal" class="modal">
        <div class="modal-content">
          <h2>Edit User</h2>
          <form @submit.prevent="updateUser">
            <div class="form-group">
              <label for="edit-username">Username</label>
              <input 
                type="text" 
                id="edit-username" 
                v-model="editingUser.username" 
                required
              />
            </div>
            <div class="form-group">
              <label for="edit-password">New Password (leave blank to keep current)</label>
              <input 
                type="password" 
                id="edit-password" 
                v-model="editingUser.password"
              />
            </div>
            <div class="form-actions">
              <button type="button" @click="showEditUserModal = false" class="cancel-btn">Cancel</button>
              <button type="submit" class="save-btn">Update User</button>
            </div>
            <div v-if="editError" class="error-message">{{ editError }}</div>
          </form>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal">
        <div class="modal-content">
          <h2>Confirm Delete</h2>
          <p>Are you sure you want to delete the user <strong>{{ deletingUser.username }}</strong>?</p>
          <div class="form-actions">
            <button @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
            <button @click="deleteUser" class="delete-btn">Delete</button>
          </div>
          <div v-if="deleteError" class="error-message">{{ deleteError }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authAPI } from '@/services/api';

export default {
  name: 'UserManagement',
  setup() {
    const router = useRouter();
    const users = ref([]);
    const loading = ref(false);
    
    // Check admin status
    const isAdmin = ref(false);
    
    // Add user state
    const showAddUserModal = ref(false);
    const newUser = ref({ username: '', password: '' });
    const addError = ref('');
    
    // Edit user state
    const showEditUserModal = ref(false);
    const editingUser = ref({ id: null, username: '', password: '' });
    const editError = ref('');
    
    // Delete user state
    const showDeleteModal = ref(false);
    const deletingUser = ref({ id: null, username: '' });
    const deleteError = ref('');
    
    // Fetch all users
    const fetchUsers = async () => {
      loading.value = true;
      try {
        const response = await authAPI.getUsers();
        users.value = response.users;
      } catch (error) {
        console.error('Failed to fetch users:', error);
        alert('Failed to load users. Please try again.');
      } finally {
        loading.value = false;
      }
    };
    
    // Add a new user
    const addUser = async () => {
      addError.value = '';
      try {
        await authAPI.registerUser({
          username: newUser.value.username,
          password: newUser.value.password
        });
        showAddUserModal.value = false;
        newUser.value = { username: '', password: '' };
        fetchUsers();
      } catch (error) {
        console.error('Failed to add user:', error);
        addError.value = error.response?.data?.error || 'Failed to add user';
      }
    };
    
    // Edit user preparation
    const editUser = (user) => {
      editingUser.value = { 
        id: user.id, 
        username: user.username,
        password: '' // Don't send the password to the client
      };
      showEditUserModal.value = true;
      editError.value = '';
    };
    
    // Update an existing user
    const updateUser = async () => {
      editError.value = '';
      try {
        const userData = { username: editingUser.value.username };
        if (editingUser.value.password) {
          userData.password = editingUser.value.password;
        }
        await authAPI.updateUser(editingUser.value.id, userData);
        showEditUserModal.value = false;
        fetchUsers();
      } catch (error) {
        console.error('Failed to update user:', error);
        editError.value = error.response?.data?.error || 'Failed to update user';
      }
    };
    
    // Confirm user deletion
    const confirmDelete = (user) => {
      deletingUser.value = { id: user.id, username: user.username };
      showDeleteModal.value = true;
      deleteError.value = '';
    };
    
    // Delete a user
    const deleteUser = async () => {
      deleteError.value = '';
      try {
        await authAPI.deleteUser(deletingUser.value.id);
        showDeleteModal.value = false;
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        deleteError.value = error.response?.data?.error || 'Failed to delete user';
      }
    };
    
    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString();
    };
    
    // Add function to go back to dashboard
    const goToDashboard = () => {
      router.push('/dashboard');
    };
    
    // Load users when component is mounted
    onMounted(() => {
      // Check if user is admin
      const user = JSON.parse(localStorage.getItem('user'));
      isAdmin.value = user && user.role === 'admin';
      
      // Only fetch users if admin
      if (isAdmin.value) {
        fetchUsers();
      }
    });
    
    return {
      isAdmin,
      goToDashboard,
      users,
      loading,
      showAddUserModal,
      newUser,
      addError,
      showEditUserModal,
      editingUser,
      editError,
      showDeleteModal,
      deletingUser,
      deleteError,
      fetchUsers,
      addUser,
      editUser,
      updateUser,
      confirmDelete,
      deleteUser,
      formatDate
    };
  }
};
</script>

<style scoped>
.user-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  color: #333;
}

.user-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

button {
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.refresh-btn {
  background-color: #f0f0f0;
  color: #333;
}

.add-btn {
  background-color: #4caf50;
  color: white;
}

.edit-btn {
  background-color: #2196f3;
  color: white;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.cancel-btn {
  background-color: #f0f0f0;
  color: #333;
}

.save-btn {
  background-color: #4caf50;
  color: white;
}

button:hover {
  opacity: 0.9;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #666;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.no-users {
  text-align: center;
  padding: 20px;
  color: #666;
}

.loading-spinner {
  color: #666;
}

.error-message {
  color: #f44336;
  margin-top: 10px;
  font-size: 14px;
}

/* Add styles for access denied message */
.access-denied {
  text-align: center;
  padding: 40px;
  max-width: 600px;
  margin: 50px auto;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.access-denied h1 {
  color: #dc3545;
  margin-bottom: 20px;
}

.access-denied p {
  margin-bottom: 30px;
  color: #666;
}

.go-back-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.go-back-btn:hover {
  background-color: #0056b3;
}
</style> 