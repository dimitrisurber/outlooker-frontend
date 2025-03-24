import BaseButton from '@/components/shared/BaseButton.vue';
import BaseInput from '@/components/shared/BaseInput.vue';
import BaseSelect from '@/components/shared/BaseSelect.vue';
import BaseModal from '@/components/shared/BaseModal.vue';

export default {
  install: (app) => {
    // Register components globally
    app.component('base-button', BaseButton);
    app.component('BaseInput', BaseInput);
    app.component('BaseSelect', BaseSelect);
    app.component('BaseModal', BaseModal);
  }
}; 