function openModal(dayId) {
    const modal = document.getElementById('itineraryModal');
    const modalBody = document.getElementById('modalBody');
    const content = document.getElementById('content-' + dayId);
    
    if (content) {
        modalBody.innerHTML = content.innerHTML;
        modal.style.display = "block";
    }
}

function closeModal() {
    document.getElementById('itineraryModal').style.display = "none";
}

// 點擊空白處關閉
window.onclick = function(event) {
    const modal = document.getElementById('itineraryModal');
    if (event.target == modal) {
        closeModal();
    }
}
