
export function showConfirmModal(message, title = 'Manga Box') {
    return showModal(message, title, true);
}

export function showAlertModal(message, title = 'Manga Box') {
    return showModal(message, title, false);
}

function showModal(message, title, isConfirm) {
    return new Promise((resolve) => {
        const backdrop = document.getElementById('custom-modal-backdrop');
        const titleEl = document.getElementById('custom-modal-title');
        const messageEl = document.getElementById('custom-modal-message');
        const confirmBtn = document.getElementById('custom-modal-confirm');
        const cancelBtn = document.getElementById('custom-modal-cancel');

        if (!backdrop || !titleEl || !messageEl || !confirmBtn || !cancelBtn) {
            console.error('Modal elements not found in DOM');
            resolve(isConfirm ? confirm(message) : alert(message));
            return;
        }

        titleEl.textContent = title;
        messageEl.textContent = message;

        // Configure buttons
        if (isConfirm) {
            cancelBtn.style.display = 'block';
            confirmBtn.textContent = 'OK';
        } else {
            cancelBtn.style.display = 'none';
            confirmBtn.textContent = 'OK';
        }

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
            }
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            window.removeEventListener('keydown', onKeyDown);
            backdrop.classList.remove('visible');
            setTimeout(() => {
                backdrop.style.display = 'none';
            }, 300);
        };

        const onConfirm = () => {
            cleanup();
            resolve(true);
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        window.addEventListener('keydown', onKeyDown);

        backdrop.style.display = 'flex';
        // Force reflow
        backdrop.offsetHeight;
        backdrop.classList.add('visible');

        // Focus confirm button by default so Enter works immediately if focused, 
        // but the window listener handles it regardless of focus.
        confirmBtn.focus();
    });
}
