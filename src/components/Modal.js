import { h } from 'preact';
import { html } from 'htm/preact';
import { useEffect } from 'preact/hooks';

const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = 'info', scrollable = false }) => {
  if (!isOpen) return null;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      } else if (e.key === 'Enter' && type === 'confirm') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      } else if (e.key === 'Enter' && type === 'info') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm(); // For info modals, OK is the confirm action
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Capture phase to prevent other listeners
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onConfirm, onCancel, type]);

  return html`
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2000; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);" onClick=${onCancel}></div>
      <div class="animate-scale-in" style="width: 90%; max-width: 400px; background: var(--surface-color); border-radius: 16px; padding: 24px; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid var(--border-color);">
        <h3 style="margin-top: 0; color: var(--text-color); font-size: 18px; margin-bottom: 12px;">${title}</h3>
        <p style="color: var(--secondary-text-color); font-size: 14px; line-height: 1.5; margin-bottom: 24px; white-space: pre-line; ${scrollable ? 'max-height: 400px; overflow-y: auto; padding-right: 8px;' : ''}">${message}</p>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          ${type === 'confirm' ? html`
            <button 
              onClick=${onCancel}
              style="padding: 8px 16px; background: transparent; color: var(--text-color); border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; font-weight: 600;"
            >
              Annulla
            </button>
          ` : null}
          <button 
            onClick=${onConfirm}
            style="padding: 8px 16px; background: var(--primary-color); color: #000; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;"
          >
            ${type === 'confirm' ? 'Conferma' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  `;
};

export default Modal;
