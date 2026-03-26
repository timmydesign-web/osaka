function openModal(dayId) {
    const modal = document.getElementById('itineraryModal');
    const modalBody = document.getElementById('modalBody');
    const content = document.getElementById('content-' + dayId);
    
    if (modal && content) {
        modalBody.innerHTML = content.innerHTML;
        
        // 1. 先顯示結構
        modal.style.display = 'flex';
        
        // 2. 稍微延遲一點點再加 class，觸發 CSS transition 動畫
        setTimeout(() => {
            modal.classList.add('open');
        }, 10);
        
        document.body.style.overflow = 'hidden';
    } else {
        console.error("找不到對應的行程 ID: " + dayId);
    }
}

function closeModal() {
    const modal = document.getElementById('itineraryModal');
    if (modal) {
        modal.classList.remove('open');
        
        // 等動畫跑完 (0.4s) 再隱藏 display
        setTimeout(() => {
            if (!modal.classList.contains('open')) {
                modal.style.display = 'none';
            }
        }, 400);
        
        document.body.style.overflow = '';
    }
}

// 點擊背景關閉
window.onclick = function(event) {
    const modal = document.getElementById('itineraryModal');
    if (event.target === modal) {
        closeModal();
    }
}
