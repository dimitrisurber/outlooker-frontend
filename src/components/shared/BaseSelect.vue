<template>
  <div class="select-container" :class="{ 'has-error': error }">
    <label v-if="label" :for="id" class="select-label">
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </label>
    
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      class="form-select"
      @change="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur', $event)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="hint" class="hint-text">{{ hint }}</div>
  </div>
</template>

<script>
export default {
  name: 'BaseSelect',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array,
      required: true,
      validator: options => options.every(option => 'value' in option && 'label' in option)
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Select an option'
    },
    id: {
      type: String,
      default: () => `select-${Math.random().toString(36).substring(2, 9)}`
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    hint: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'blur']
}
</script>

<style scoped>
.select-container {
  margin-bottom: 16px;
}

.select-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  color: #374151;
}

.required-mark {
  color: #ef4444;
  margin-left: 3px;
}

.form-select {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-color: white;
}

.form-select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.form-select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.has-error .form-select {
  border-color: #ef4444;
}

.has-error .form-select:focus {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.error-message {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 4px;
}

.hint-text {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 4px;
}
</style> 