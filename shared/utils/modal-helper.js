// js/utils/modal-helper.js
export function showConfirmationModal(title, message) {
  return new Promise(resolve => {
    const modalOverlay = document.getElementById("confirmation-modal-overlay");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalCancelBtn = document.getElementById("modal-cancel-btn");
    const modalConfirmBtn = document.getElementById("modal-confirm-btn");

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalOverlay.style.display = "flex";

    const cleanup = () => {
      modalConfirmBtn.removeEventListener("click", confirmHandler);
      modalCancelBtn.removeEventListener("click", cancelHandler);
      modalOverlay.style.display = "none";
    };

    const confirmHandler = () => { cleanup(); resolve(true); };
    const cancelHandler = () => { cleanup(); resolve(false); };

    modalConfirmBtn.addEventListener("click", confirmHandler);
    modalCancelBtn.addEventListener("click", cancelHandler);
  });
}
