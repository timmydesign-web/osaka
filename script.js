function openModal(dayId) {
    const modal = document.getElementById('itineraryModal');
    const modalBody = document.getElementById('modalBody');
    const sourceContent = document.getElementById('content-' + dayId);
    
    if (sourceContent) {
        modalBody.innerHTML = sourceContent.innerHTML;
        modal.style.display = "block";
        // 防止背景滾動
        document.body.style.overflow = "hidden";
    }
}

function closeModal() {
    const modal = document.getElementById('itineraryModal');
    modal.style.display = "none";
    // 恢復背景滾動
    document.body.style.overflow = "auto";
}

// 點擊視窗外部關閉
window.onclick = function(event) {
    const modal = document.getElementById('itineraryModal');
    if (event.target == modal) {
        closeModal();
    }
}

// 支援按下 Esc 鍵關閉
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        closeModal();
    }
});
