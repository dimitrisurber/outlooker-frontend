<template>
  <button 
    class="base-button"
    :class="[
      `variant-${variant}`,
      { 'loading': loading }
    ]"
    v-bind="$attrs"
  >
    <span v-if="loading" class="loader"></span>
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: 'base-button',
  inheritAttrs: true,
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'danger', 'success', 'warning'].includes(value)
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

/* Primary - Blue */
.variant-primary {
  background-color: #007bff;
  color: white;
}
.variant-primary:hover {
  background-color: #0056b3;
}

/* Secondary - Gray */
.variant-secondary {
  background-color: #ffc107;
  color: #000;
}
.variant-secondary:hover {
  background-color: #e0a800;
}

/* Danger - Red */
.variant-danger {
  background-color: #dc3545;
  color: white;
}
.variant-danger:hover {
  background-color: #c82333;
}

/* Success - Green */
.variant-success {
  background-color: #28a745;
  color: white;
}
.variant-success:hover {
  background-color: #218838;
}

/* Warning - Yellow */
.variant-warning {
  background-color: #ffc107;
  color: #000;
}
.variant-warning:hover {
  background-color: #e0a800;
}

.base-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 