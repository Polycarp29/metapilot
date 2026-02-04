import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
    const toasts = ref([]);

    const add = (type, message, title = '') => {
        const id = Date.now();
        const duration = 5000;
        const startTime = Date.now();

        const toast = {
            id,
            type,
            message,
            title: title || (type.charAt(0).toUpperCase() + type.slice(1)),
            progress: 100,
        };

        toasts.value.push(toast);

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            toast.progress = (remaining / duration) * 100;

            if (remaining <= 0) {
                clearInterval(interval);
                remove(id);
            }
        }, 10);

        return id;
    };

    const remove = (id) => {
        const index = toasts.value.findIndex(t => t.id === id);
        if (index !== -1) toasts.value.splice(index, 1);
    };

    const success = (message, title = 'Success') => add('success', message, title);
    const error = (message, title = 'Error') => add('error', message, title);
    const warning = (message, title = 'Warning') => add('warning', message, title);

    return {
        toasts,
        add,
        remove,
        success,
        error,
        warning
    };
});
