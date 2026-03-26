/**
 * 開啟行程模態視窗
 * @param {string} dayId - 對應資料庫的 ID (例如 'day1')
 */
function openModal(dayId) {
    const modal = document.getElementById('itineraryModal');
    const modalBody = document.getElementById('modalBody');
    const sourceContent = document.getElementById('content-' + dayId);
    
    if (modal && sourceContent) {
        // 複製內容到 Modal
        modalBody.innerHTML = sourceContent.innerHTML;
        
        // 顯示結構並觸發動畫
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('open');
        }, 15);
        
        // 禁止背景滾動
        document.body.style.overflow = 'hidden';
    } else {
        console.error("找不到 ID: content-" + dayId);
    }
}

/**
 * 關閉行程模態視窗
 */
function closeModal() {
    const modal = document.getElementById('itineraryModal');
    if (modal) {
        modal.classList.remove('open');
        
        // 等待 CSS 動畫結束後隱藏結構
        setTimeout(() => {
            if (!modal.classList.contains('open')) {
                modal.style.display = 'none';
            }
        }, 400);
        
        // 恢復背景滾動
        document.body.style.overflow = '';
    }
}

// 點擊 Modal 背景區域自動關閉
window.onclick = function(event) {
    const modal = document.getElementById('itineraryModal');
    if (event.target === modal) {
        closeModal();
    }
};

// 支援 ESC 鍵快速關閉
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeModal();
});
