let currentActiveButton = null;
let currentOpenDayNum = 1; 
let tourMap = null;
let customLayerGroup = null;
let isAddMarkerMode = false;
let editingMarkerId = null;
let tempLatLng = null;
let customMarkers = JSON.parse(localStorage.getItem('customMarkers')) || [];

// =========================================
// 🌙 深色模式與分頁切換
// =========================================
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('theme-toggle').innerText = newTheme === 'dark' ? '☀️' : '🌙';
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('view-' + tabId).classList.add('active');
    const activeBtn = document.getElementById('btn-' + tabId);
    if(activeBtn) activeBtn.classList.add('active');
    
    const indicator = document.getElementById('tab-indicator');
    if (indicator && activeBtn) {
        indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
        indicator.style.width = `${activeBtn.offsetWidth}px`;
    }

    if (tabId === 'map') {
        setTimeout(() => { if (tourMap) tourMap.invalidateSize(); }, 200);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================
// 🌍 智慧地圖系統 (編輯、刪除與自動 Emoji)
// =========================================
function autoEmoji(name) {
    const rules = [
        { key: ["肉", "牛", "燒", "排"], icon: "🥩" },
        { key: ["麵", "拉麵", "烏龍"], icon: "🍜" },
        { key: ["壽司", "魚", "刺身", "海鮮"], icon: "🍣" },
        { key: ["酒", "居酒屋", "吧"], icon: "🍺" },
        { key: ["咖啡", "甜", "奶茶", "冰", "蛋糕"], icon: "🍰" },
        { key: ["買", "逛", "商店", "百貨", "藥"], icon: "🛍️" },
        { key: ["站", "鐵", "捷運"], icon: "🚆" },
        { key: ["寺", "社", "神"], icon: "⛩️" },
        { key: ["景", "美", "拍"], icon: "📸" }
    ];
    for (let rule of rules) {
        if (rule.key.some(k => name.includes(k))) return rule.icon;
    }
    return "📍";
}

function initMap() {
    if (tourMap) return;
    tourMap = L.map('tour-map').setView([34.7, 135.5], 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(tourMap);
    
    customLayerGroup = L.layerGroup().addTo(tourMap);

    // 固定行程地點
    const fixedLocs = [
        { name: "艾思利德飯店", lat: 34.6601, lng: 135.5036, icon: "🏨" },
        { name: "大喜 (Taiki)", lat: 34.6675, lng: 135.5020, icon: "🥢" },
        { name: "生駒山上遊園地", lat: 34.6800, lng: 135.6800, icon: "🎡" },
        { name: "有馬溫泉", lat: 34.7975, lng: 135.2475, icon: "♨️" },
        { name: "大阪城", lat: 34.6873, lng: 135.5262, icon: "🏯" },
        { name: "京瓷巨蛋", lat: 34.6693, lng: 135.4761, icon: "⚾" },
        { name: "Kichi Kichi", lat: 35.0064, lng: 135.7706, icon: "🍳" },
        { name: "伊根舟屋", lat: 35.6738, lng: 135.2816, icon: "⛴️" },
        { name: "天橋立", lat: 35.5683, lng: 135.1916, icon: "🚠" },
        { name: "保津川乘船場", lat: 35.0163, lng: 135.5762, icon: "🛶" },
        { name: "伏見稻荷大社", lat: 34.9671, lng: 135.7726, icon: "⛩️" },
        { name: "臨空城 Outlets", lat: 34.4115, lng: 135.2945, icon: "🛍️" },
        { name: "關西機場 (KIX)", lat: 34.4320, lng: 135.2304, icon: "✈️" }
    ];
    
    fixedLocs.forEach(loc => {
        const html = `<div style="font-size: 20px; background: white; border-radius: 50%; width: 34px; height: 34px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 2px solid #0071e3;">${loc.icon}</div>`;
        L.marker([loc.lat, loc.lng], { icon: L.divIcon({ className: 'custom-map-marker', html, iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -34] }) })
         .addTo(tourMap)
         .bindPopup(`<b style="font-size: 13px;">${loc.name}</b>`);
    });

    renderCustomMarkers();

    // 點擊地圖觸發新增
    tourMap.on('click', function(e) {
        if (!isAddMarkerMode) return;
        tempLatLng = e.latlng;
        openMarkerModal('add');
    });
}

function renderCustomMarkers() {
    if(!customLayerGroup) return;
    customLayerGroup.clearLayers();
    
    customMarkers.forEach(loc => {
        const dayTag = loc.day && loc.day !== "無" ? `[Day ${loc.day}] ` : "";
        const linkHtml = loc.url ? `<br><a href="${loc.url}" target="_blank" style="display:inline-block; margin-top:8px; padding:6px 12px; background:var(--ios-blue); color:#fff; border-radius:8px; text-decoration:none; font-size:12px; font-weight:bold;">📍 開啟導航</a>` : "";
        const html = `<div style="font-size: 20px; background: white; border-radius: 50%; width: 34px; height: 34px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #ff3b30;">${loc.icon}</div>`;
        
        const popupContent = `
            <div style="text-align: center; min-width: 120px;">
                <b style="font-size: 14px;">${dayTag}${loc.name}</b>
                ${linkHtml}
                <div style="margin-top:8px; border-top: 1px solid #eee; padding-top: 8px;">
                    <button onclick="openEditMarker(${loc.id})" style="padding:6px 10px; background:#e5e5ea; border:none; border-radius:8px; font-size:12px; cursor:pointer; font-weight:700; color:#1d1d1f; width: 100%;">✏️ 編輯 / 刪除</button>
                </div>
            </div>
        `;

        L.marker([loc.lat, loc.lng], { icon: L.divIcon({ className: 'custom-map-marker', html, iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -34] }) })
         .addTo(customLayerGroup)
         .bindPopup(popupContent);
    });
}

function toggleAddMarkerMode() {
    isAddMarkerMode = !isAddMarkerMode;
    const btn = document.getElementById('add-marker-toggle');
    const hint = document.getElementById('map-hint');
    if (isAddMarkerMode) {
        btn.innerText = "取消新增";
        btn.classList.add('active');
        hint.style.display = 'block';
    } else {
        btn.innerText = "📍 點擊新增";
        btn.classList.remove('active');
        hint.style.display = 'none';
    }
}

// =========================================
// ✏️ 地標編輯彈出視窗 (Modal)
// =========================================
window.openEditMarker = function(id) {
    openMarkerModal('edit', id);
};

function openMarkerModal(mode, id = null) {
    const modal = document.getElementById('markerModal');
    const title = document.getElementById('markerModalTitle');
    const delBtn = document.getElementById('marker-delete-btn');
    
    if (mode === 'add') {
        editingMarkerId = null;
        title.innerText = "📍 新增地點";
        document.getElementById('marker-name').value = '';
        document.getElementById('marker-day').value = '無';
        document.getElementById('marker-url').value = '';
        delBtn.style.display = 'none';
    } else if (mode === 'edit') {
        editingMarkerId = id;
        const loc = customMarkers.find(m => m.id === id);
        if(!loc) return;
        title.innerText = "✏️ 編輯地點";
        document.getElementById('marker-name').value = loc.name;
        document.getElementById('marker-day').value = loc.day || '無';
        document.getElementById('marker-url').value = loc.url || '';
        delBtn.style.display = 'block';
        if(tourMap) tourMap.closePopup();
    }
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
    document.body.style.overflow = 'hidden';
    
    if (isAddMarkerMode) toggleAddMarkerMode();
}

function closeMarkerModal() {
    const modal = document.getElementById('markerModal');
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
    document.body.style.overflow = '';
}

function saveMarker() {
    const name = document.getElementById('marker-name').value.trim();
    const day = document.getElementById('marker-day').value;
    const url = document.getElementById('marker-url').value.trim();
    
    if(!name) { alert("請輸入地點名稱！"); return; }
    
    if (editingMarkerId) {
        const idx = customMarkers.findIndex(m => m.id === editingMarkerId);
        if(idx !== -1) {
            customMarkers[idx].name = name;
            customMarkers[idx].day = day;
            customMarkers[idx].url = url;
            customMarkers[idx].icon = autoEmoji(name); 
        }
    } else {
        const newLoc = { id: Date.now(), name: name, lat: tempLatLng.lat, lng: tempLatLng.lng, icon: autoEmoji(name), day: day, url: url };
        customMarkers.push(newLoc);
    }
    
    localStorage.setItem('customMarkers', JSON.stringify(customMarkers));
    renderCustomMarkers();
    closeMarkerModal();
}

function deleteMarker() {
    if (!editingMarkerId) return;
    if (confirm("確定要刪除這個地點嗎？")) {
        customMarkers = customMarkers.filter(m => m.id !== editingMarkerId);
        localStorage.setItem('customMarkers', JSON.stringify(customMarkers));
        renderCustomMarkers();
        closeMarkerModal();
    }
}

// =========================================
// 🍳 航班動態與行程切換
// =========================================
function updateFlightStatus() {
    const badge = document.querySelector('#modalBody .flight-tracker-card .flight-status');
    if(!badge) return;
    badge.innerText = "🔄 同步中...";
    setTimeout(() => {
        const isOnTime = Math.random() > 0.15; 
        const dest = currentOpenDayNum === 8 ? "TPE T1" : "KIX T1";
        if (isOnTime) {
            badge.innerText = `✅ 準點 (抵達 ${dest})`;
            badge.style.color = "#34c759";
        } else {
            badge.innerText = `⚠️ 延遲 15 分 (抵達 ${dest})`;
            badge.style.color = "#ff3b30";
        }
    }, 1200);
}

function slideModalDay(direction) {
    let newDayNum = currentOpenDayNum + direction;
    if (newDayNum < 1 || newDayNum > 8) return;

    const modalBody = document.getElementById('modalBody');
    const sourceContent = document.getElementById('content-day' + newDayNum);

    modalBody.style.transform = `translateX(${direction * -30}px)`;
    modalBody.style.opacity = '0';

    setTimeout(() => {
        currentOpenDayNum = newDayNum;
        modalBody.innerHTML = sourceContent.innerHTML;
        
        document.getElementById('modal-prev-btn').disabled = currentOpenDayNum <= 1;
        document.getElementById('modal-next-btn').disabled = currentOpenDayNum >= 8;
        
        modalBody.style.transition = 'none';
        modalBody.style.transform = `translateX(${direction * 30}px)`;
        void modalBody.offsetWidth; 

        modalBody.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.25s ease';
        modalBody.style.transform = 'translateX(0)';
        modalBody.style.opacity = '1';

        document.querySelector('.modal-content').scrollTop = 0;
        if(newDayNum === 1 || newDayNum === 8) setTimeout(updateFlightStatus, 600);
    }, 200); 
}

function openModal(dayId, event) {
    currentOpenDayNum = parseInt(dayId.replace('day', ''));
    const modal = document.getElementById('itineraryModal');
    const modalBody = document.getElementById('modalBody');
    
    document.getElementById('modal-prev-btn').disabled = currentOpenDayNum <= 1;
    document.getElementById('modal-next-btn').disabled = currentOpenDayNum >= 8;
        
    modalBody.style.transition = 'none';
    modalBody.style.transform = 'translateX(0)';
    modalBody.style.opacity = '1';
    modalBody.innerHTML = document.getElementById('content-' + dayId).innerHTML;
    
    modal.style.display = 'flex'; 
    setTimeout(() => modal.classList.add('open'), 10);
    document.body.style.overflow = 'hidden';

    setTimeout(() => document.querySelector('.modal-content').scrollTop = 0, 10);
    if(dayId === 'day1' || dayId === 'day8') setTimeout(updateFlightStatus, 600);
}

function closeModal() {
    document.getElementById('itineraryModal').classList.remove('open');
    setTimeout(() => document.getElementById('itineraryModal').style.display = 'none', 300); 
    document.body.style.overflow = '';
}

// =========================================
// 🚀 初始化與手勢監聽
// =========================================
function init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    initMap(); 
    syncFromCloud();
    renderExpenses(expenses.length === 0);
    setTimeout(() => switchTab('home'), 100);

    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        const dayNav = document.getElementById('day-nav-wrapper');
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
            dayNav.classList.add('scrolled');
            dayNav.style.top = (header.offsetHeight - 1) + 'px'; 
        } else {
            header.classList.remove('scrolled');
            dayNav.classList.remove('scrolled');
        }
    });

    const toggleArea = document.querySelector('.payer-toggle');
    const slider = document.querySelector('.toggle-slider');
    if (toggleArea && slider) {
        let isDragging = false; let startX = 0; let currentTranslate = 0; let maxTranslate = 0;
        toggleArea.addEventListener('touchstart', e => {
            isDragging = true; startX = e.changedTouches[0].clientX; maxTranslate = slider.offsetWidth;
            currentTranslate = document.getElementById('payer-jj').checked ? maxTranslate : 0;
            slider.style.transition = 'none';
        }, { passive: true });
        toggleArea.addEventListener('touchmove', e => {
            if (!isDragging) return;
            let diff = e.changedTouches[0].clientX - startX;
            let newTranslate = Math.max(0, Math.min(maxTranslate, currentTranslate + diff));
            slider.style.transform = `translateX(${newTranslate}px)`;
            if (Math.abs(diff) > 5 && e.cancelable) e.preventDefault();
        }, { passive: false });
        toggleArea.addEventListener('touchend', e => {
            if (!isDragging) return;
            isDragging = false; let diff = e.changedTouches[0].clientX - startX;
            slider.style.transition = ''; slider.style.transform = '';
            if (Math.abs(diff) > 5) {
                if (currentTranslate + diff > maxTranslate / 2) document.getElementById('payer-jj').checked = true; 
                else document.getElementById('payer-timmy').checked = true; 
            }
        });
    }

    const tabBar = document.querySelector('.bottom-tab-bar');
    const tabIndicator = document.getElementById('tab-indicator');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabsList = ['home', 'map', 'expense', 'exchange']; 

    if (tabBar && tabIndicator) {
        let isTabDragging = false; let tabStartX = 0; let initialIndicatorX = 0;
        tabBar.addEventListener('touchstart', e => {
            if (document.querySelector('.modal.open')) return;
            isTabDragging = true; tabStartX = e.changedTouches[0].clientX;
            const activeBtn = document.querySelector('.tab-btn.active');
            initialIndicatorX = activeBtn ? activeBtn.offsetLeft : 0;
            tabIndicator.style.transition = 'none';
        }, { passive: true });
        tabBar.addEventListener('touchmove', e => {
            if (!isTabDragging) return;
            let diff = e.changedTouches[0].clientX - tabStartX;
            let newTranslate = Math.max(0, Math.min(tabBar.offsetWidth - tabIndicator.offsetWidth, initialIndicatorX + diff));
            tabIndicator.style.transform = `translateX(${newTranslate}px)`;
            if (Math.abs(diff) > 5 && e.cancelable) e.preventDefault();
        }, { passive: false });
        tabBar.addEventListener('touchend', e => {
            if (!isTabDragging) return;
            isTabDragging = false; let diff = e.changedTouches[0].clientX - tabStartX;
            tabIndicator.style.transition = ''; 
            if (Math.abs(diff) > 10) {
                let indicatorCenter = initialIndicatorX + diff + (tabIndicator.offsetWidth / 2);
                let closestTab = tabsList[0]; let minDistance = Infinity;
                tabBtns.forEach((btn, index) => {
                    let distance = Math.abs(indicatorCenter - (btn.offsetLeft + (btn.offsetWidth / 2)));
                    if (distance < minDistance) { minDistance = distance; closestTab = tabsList[index]; }
                });
                switchTab(closestTab);
            } else {
                const activeBtn = document.querySelector('.tab-btn.active');
                if (activeBtn) tabIndicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
            }
        });
    }

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                if (this.id === 'itineraryModal') closeModal();
                else if (this.id === 'expenseModal') closeExpenseModal();
                else if (this.id === 'photoDiaryModal') closePhotoDiaryModal();
                else if (this.id === 'photoViewerModal') closePhotoViewer();
                else if (this.id === 'markerModal') closeMarkerModal();
            }
        });
    });
}
document.addEventListener('DOMContentLoaded', init);

// =========================================
// 📷 旅程回憶錄邏輯
// =========================================
let travelPhotos = JSON.parse(localStorage.getItem('travelPhotos')) || {};
let currentUploadDay = 1; let currentViewDay = null; 
function openPhotoDiaryModal(event) {
    const modal = document.getElementById('photoDiaryModal');
    modal.style.display = 'flex'; setTimeout(() => modal.classList.add('open'), 10);
    document.body.style.overflow = 'hidden'; renderPhotoDiary();
}
function closePhotoDiaryModal() {
    const modal = document.getElementById('photoDiaryModal');
    modal.classList.remove('open'); setTimeout(() => modal.style.display = 'none', 300);
    document.body.style.overflow = '';
}
function renderPhotoDiary() {
    const grid = document.getElementById('photo-grid'); grid.innerHTML = '';
    for (let i = 1; i <= 8; i++) {
        if (!!travelPhotos[`day${i}`]) {
            grid.innerHTML += `<div class="photo-card" onclick="viewPhoto(${i})"><div class="photo-card-inner"><img src="${travelPhotos[`day${i}`]}"><div class="photo-overlay-label">Day ${i}</div></div></div>`;
        } else {
            grid.innerHTML += `<div class="photo-card" onclick="triggerUpload(${i})"><div class="photo-card-inner empty"><span class="photo-add-icon">➕</span><span class="photo-day-label">Day ${i}</span></div></div>`;
        }
    }
}
function triggerUpload(day) { currentUploadDay = day; document.getElementById('photo-upload-input').click(); }
function handlePhotoUpload(event) {
    const file = event.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas'); const scaleSize = 500 / img.width;
            canvas.width = 500; canvas.height = img.height * scaleSize;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            travelPhotos[`day${currentUploadDay}`] = canvas.toDataURL('image/jpeg', 0.6); 
            localStorage.setItem('travelPhotos', JSON.stringify(travelPhotos)); renderPhotoDiary();
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
}
function viewPhoto(day) { 
    currentViewDay = day; document.getElementById('viewer-img').src = travelPhotos[`day${day}`]; 
    const modal = document.getElementById('photoViewerModal'); modal.style.display = 'flex'; setTimeout(() => modal.classList.add('open'), 10); 
}
function closePhotoViewer() { 
    document.getElementById('photoViewerModal').classList.remove('open'); setTimeout(() => document.getElementById('photoViewerModal').style.display = 'none', 300); 
}
function deletePhoto() { 
    if(confirm("確定要刪除照片嗎？")) { delete travelPhotos[`day${currentViewDay}`]; localStorage.setItem('travelPhotos', JSON.stringify(travelPhotos)); renderPhotoDiary(); closePhotoViewer(); } 
}

// =========================================
// 💰 雙人記帳本 (Expense) 邏輯
// =========================================
const CLOUD_API_URL = "https://script.google.com/macros/s/AKfycbx61FkjxrU5yKUmmvOw0kd_hvEUN73B8CfMZaTwFzyHfTPLN8n6L8rmkm4E6RgA2hUDRw/exec";
let expenses = JSON.parse(localStorage.getItem('travelExpenses')) || [];
async function syncFromCloud() { 
    try { 
        const response = await fetch(CLOUD_API_URL + "?t=" + new Date().getTime()); 
        const data = await response.json(); 
        if (Array.isArray(data)) { expenses = data; localStorage.setItem('travelExpenses', JSON.stringify(expenses)); renderExpenses(); renderCategorySummary(); } 
    } catch (error) { console.error("雲端同步失敗", error); } 
}
async function addExpense() {
    const amount = parseInt(document.getElementById('expense-amount').value);
    const descInput = document.getElementById('expense-desc').value;
    if (!amount || amount <= 0 || !descInput.trim()) { alert("請輸入有效的金額與項目！"); return; }
    const newExpense = { action: "add", id: Date.now(), payer: document.querySelector('input[name="payer"]:checked').value, amount: amount, desc: descInput.trim(), cat: document.querySelector('input[name="exp-cat"]:checked').value, date: new Date().toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) };
    expenses.push(newExpense); localStorage.setItem('travelExpenses', JSON.stringify(expenses)); 
    renderExpenses(); renderCategorySummary();
    document.getElementById('expense-amount').value = ''; document.getElementById('expense-desc').value = '';
    fetch(CLOUD_API_URL, { method: 'POST', body: JSON.stringify(newExpense) }).catch(e=>e);
    const addBtn = document.querySelector('.add-btn'); const origTxt = addBtn.innerHTML; addBtn.innerHTML = '✅ 已記錄！'; setTimeout(() => addBtn.innerHTML = origTxt, 1200);
}
async function deleteExpense(id) { 
    if(confirm("確定要刪除這筆紀錄嗎？")) { expenses = expenses.filter(exp => exp.id != id); localStorage.setItem('travelExpenses', JSON.stringify(expenses)); renderExpenses(); renderCategorySummary(); fetch(CLOUD_API_URL, { method: 'POST', body: JSON.stringify({ action: "delete", id: id }) }).catch(e=>e); } 
}
function toggleCategorySummary() { 
    const view = document.getElementById('category-summary-view'); 
    if (view.style.display === 'none') { renderCategorySummary(); view.style.display = 'block'; } else { view.style.display = 'none'; } 
}
function renderCategorySummary() {
    const view = document.getElementById('category-summary-view');
    let totals = { "餐食": 0, "交通": 0, "購物": 0, "其他": 0 }; let grandTotal = 0;
    expenses.forEach(exp => { let cat = exp.cat || "其他"; if(totals[cat] !== undefined) totals[cat] += parseInt(exp.amount); grandTotal += parseInt(exp.amount); });
    const colors = { "餐食": "#ffcc00", "交通": "#34c759", "購物": "#af52de", "其他": "#8e8e93" }; let html = '';
    for (const [cat, amt] of Object.entries(totals)) { 
        let percentage = grandTotal === 0 ? 0 : Math.round((amt / grandTotal) * 100); 
        html += `<div class="cat-bar-container"><span class="cat-label">${cat}</span><div class="cat-track"><div class="cat-fill" style="width: ${percentage}%; background: ${colors[cat]};"></div></div><span class="cat-amount">¥${amt.toLocaleString()}</span></div>`; 
    }
    view.innerHTML = html;
}
function renderExpenses(isLoading = false) {
    const listContainer = document.getElementById('expense-list'); if (!listContainer) return; listContainer.innerHTML = '';
    if (isLoading) { listContainer.innerHTML = `<div class="skeleton-item"><div class="skeleton skeleton-avatar"></div><div class="skeleton-info"><div class="skeleton skeleton-text" style="width: 60%;"></div></div></div>`; return; }
    let timmyTotal = 0; let jjTotal = 0; let itemIndex = 0;
    [...expenses].reverse().forEach(exp => {
        if (exp.payer === 'Timmy') { timmyTotal += parseInt(exp.amount); } else { jjTotal += parseInt(exp.amount); }
        listContainer.innerHTML += `<div class="exp-item" style="animation-delay: ${itemIndex * 0.05}s;"><div class="exp-item-left"><div class="exp-avatar ${exp.payer === 'Timmy' ? 'color-timmy' : 'color-jj'}">${exp.payer === 'Timmy' ? '👦🏻' : '👧🏻'}</div><div class="exp-info"><span class="exp-desc">${exp.cat ? `<span class="exp-cat-tag">${exp.cat}</span>` : ""}${exp.desc}</span><span class="exp-date">${exp.date}</span></div></div><div class="exp-item-right"><span class="exp-price">¥${parseInt(exp.amount).toLocaleString()}</span><div class="exp-delete" onclick="deleteExpense('${exp.id}')">🗑️</div></div></div>`;
        itemIndex++;
    });
    document.getElementById('total-amount').innerText = (timmyTotal + jjTotal).toLocaleString();
    document.getElementById('timmy-paid').innerText = timmyTotal.toLocaleString();
    document.getElementById('jj-paid').innerText = jjTotal.toLocaleString();
    const settlementText = document.getElementById('settlement-text');
    const diff = timmyTotal - jjTotal; const halfDiff = Math.abs(diff) / 2;
    if (diff > 0) { settlementText.innerHTML = `⚠️ <b>ㄐㄐ</b> 需給 Timmy： <b>¥${halfDiff.toLocaleString()}</b>`; settlementText.className = "settlement owe-timmy"; } 
    else if (diff < 0) { settlementText.innerHTML = `⚠️ <b>Timmy</b> 需給 ㄐㄐ： <b>¥${halfDiff.toLocaleString()}</b>`; settlementText.className = "settlement owe-jj"; } 
    else { settlementText.innerHTML = `✅ 目前帳目完美平衡`; settlementText.className = "settlement balanced"; }
}
