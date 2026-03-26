/* =========================================
   🔧 全域變數與初始化
========================================= */
let currentActiveButton = null;
const CLOUD_API_URL = "https://script.google.com/macros/s/AKfycbx61FkjxrU5yKUmmvOw0kd_hvEUN73B8CfMZaTwFzyHfTPLN8n6L8rmkm4E6RgA2hUDRw/exec";
let expenses = JSON.parse(localStorage.getItem('travelExpenses')) || [];

// 視窗動畫定位點
function setModalOrigin() {
    if (!currentActiveButton) return;
    const modalContent = document.querySelector('.modal-content');
    const btnRect = currentActiveButton.getBoundingClientRect();
    const layoutLeft = (window.innerWidth - modalContent.offsetWidth) / 2;
    const layoutTop = (window.innerHeight - modalContent.offsetHeight) / 2;
    const originX = btnRect.left + (btnRect.width / 2) - layoutLeft;
    const originY = btnRect.top + (btnRect.height / 2) - layoutTop;
    modalContent.style.transformOrigin = `${originX}px ${originY}px`;
}

/* =========================================
   🗓️ 行程視窗控制
========================================= */
function openModal(dayId, event) {
    const modal = document.getElementById('itineraryModal');
    const modalBody = document.getElementById('modalBody');
    const sourceContent = document.getElementById('content-' + dayId);
    if (modal && sourceContent && event) {
        currentActiveButton = event.currentTarget;
        modalBody.innerHTML = sourceContent.innerHTML;
        modal.style.display = 'flex';
        setModalOrigin();
        void modal.offsetWidth; 
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        // 打開視窗後立刻觸發一次預覽更新，確保閃爍圓點正確
        updateItineraryPreview();
    }
}

function openCurrentDayPreview(event) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    let dayNum = 1;
    // 判定是否在 2026/8/10 ~ 8/17 區間
    if (year === 2026 && month === 8 && date >= 10 && date <= 17) {
        dayNum = date - 9; 
    }
    openModal('day' + dayNum, event);
}

function closeModal() {
    const modal = document.getElementById('itineraryModal');
    if (modal) {
        setModalOrigin();
        modal.classList.remove('open');
        setTimeout(() => {
            if (!modal.classList.contains('open')) {
                modal.style.display = 'none';
                currentActiveButton = null;
            }
        }, 400); 
        document.body.style.overflow = '';
    }
}

window.onclick = function(event) {
    const itModal = document.getElementById('itineraryModal');
    const expModal = document.getElementById('expenseModal');
    if (event.target === itModal) closeModal();
    if (event.target === expModal) closeExpenseModal();
};

/* =========================================
   🌤️ 天氣元件 (Open-Meteo API)
========================================= */
function getWeatherEmoji(code) {
    const table = { 0: "☀️", 1: "⛅", 2: "⛅", 3: "☁️", 45: "🌫️", 51: "🌧️", 61: "🌧️", 95: "⛈️" };
    return table[code] || "🌤️";
}

async function fetchWeather(lat, lon, cityName) {
    const hourlyContainer = document.getElementById('hourly-forecast');
    const titleDesc = document.getElementById('current-weather-desc');
    const locationName = document.getElementById('location-name');
    try {
        locationName.innerHTML = `📍 ${cityName}`;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto&forecast_days=2`);
        const data = await res.json();
        titleDesc.innerHTML = `${getWeatherEmoji(data.current_weather.weathercode)} ${Math.round(data.current_weather.temperature)}°C`;

        const nowHour = new Date().getHours();
        let startIndex = data.hourly.time.findIndex(t => parseInt(t.substring(11, 13)) === nowHour);
        if (startIndex === -1) startIndex = 0;

        let html = '';
        for (let i = startIndex; i < startIndex + 24; i++) {
            if (!data.hourly.time[i]) break;
            const label = (i === startIndex) ? "現在" : data.hourly.time[i].substring(11, 16);
            html += `<div class="hourly-item"><span class="h-time serif">${label}</span><span class="h-icon">${getWeatherEmoji(data.hourly.weathercode[i])}</span><span class="h-temp serif">${Math.round(data.hourly.temperature_2m[i])}°</span></div>`;
        }
        hourlyContainer.innerHTML = html;
    } catch (e) { titleDesc.innerHTML = "同步中"; }
}

/* =========================================
   🧭 行程追蹤與 2026 日期偵測邏輯
========================================= */
function updateItineraryPreview() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();

    const heroNowTime = document.getElementById('preview-now-time');
    const heroNowTitle = document.getElementById('preview-now-title');
    const heroNextTitle = document.getElementById('preview-next-title');
    const heroNextTime = document.getElementById('preview-next-time');

    const isTripTime = (year === 2026 && month === 8 && date >= 10 && date <= 17);
    
    // 清除所有閃爍點
    document.querySelectorAll('.time-item').forEach(el => el.classList.remove('active'));

    if (!isTripTime) {
        // 尚未出發
        if (year < 2026 || (year === 2026 && (month < 8 || (month === 8 && date < 10)))) {
            if(heroNowTime) heroNowTime.innerText = "8/10";
            if(heroNowTitle) heroNowTitle.innerText = "期待出發";
            if(heroNextTitle) heroNextTitle.innerText = "大阪京都行";
            if(heroNextTime) heroNextTime.innerText = "Day 1";
        } else { // 旅程結束
            if(heroNowTime) heroNowTime.innerText = "🏠";
            if(heroNowTitle) heroNowTitle.innerText = "旅途結束";
            if(heroNextTitle) heroNextTitle.innerText = "回憶滿滿";
            if(heroNextTime) heroNextTime.innerText = "Done";
        }
        return; 
    }

    // 旅行中：執行追蹤與圓點閃爍
    const currentScore = now.getHours() * 60 + now.getMinutes();
    const currentDayNum = date - 9; 
    const dayDataId = `content-day${currentDayNum}`;
    const daySection = document.getElementById(dayDataId);

    if (!daySection) return;

    const items = Array.from(daySection.querySelectorAll('.time-item'));
    const itinerary = items.map(el => {
        const [h, m] = el.getAttribute('data-time').split(':').map(Number);
        const titleEl = el.querySelector('.item-title');
        const itemTitle = titleEl ? titleEl.innerText : "未命名行程";
        return { time: el.getAttribute('data-time'), score: h * 60 + m, title: itemTitle };
    });

    let currentIdx = itinerary.findLastIndex(item => currentScore >= item.score);
    
    if (currentIdx === -1) {
        heroNowTime.innerText = "晨間";
        heroNowTitle.innerText = "準備出門";
        heroNextTitle.innerText = itinerary[0].title;
        heroNextTime.innerText = itinerary[0].time;
    } else {
        const currentItem = itinerary[currentIdx];
        const nextItem = itinerary[currentIdx + 1] || { time: "--:--", title: "行程結束" };
        heroNowTime.innerText = currentItem.time;
        heroNowTitle.innerText = currentItem.title;
        heroNextTitle.innerText = nextItem.title;
        heroNextTime.innerText = nextItem.time;

        // 首頁圓點與視窗內圓點同步亮起
        const modal = document.getElementById('itineraryModal');
        const modalHeader = document.querySelector('#modalBody h2');
        if (modal.classList.contains('open') && modalHeader && modalHeader.innerText.includes(`Day ${currentDayNum}`)) {
            const modalItems = document.querySelectorAll('#modalBody .time-item');
            if (modalItems[currentIdx]) modalItems[currentIdx].classList.add('active');
        }
    }
}

/* =========================================
   💰 記帳本「100% 黏手滑動」與「雲端同步」
========================================= */

// ☁️ 雲端：同步資料
async function syncFromCloud() {
    try {
        const response = await fetch(CLOUD_API_URL + "?t=" + new Date().getTime());
        const data = await response.json();
        if (Array.isArray(data)) {
            expenses = data;
            localStorage.setItem('travelExpenses', JSON.stringify(expenses));
            renderExpenses();
        }
    } catch (e) { console.error("同步失敗", e); }
}

// ☁️ 雲端：新增
async function addExpense() {
    const payer = document.querySelector('input[name="payer"]:checked').value;
    const amount = parseInt(document.getElementById('expense-amount').value);
    const desc = document.getElementById('expense-desc').value.trim();
    if (!amount || amount <= 0 || !desc) { alert("資訊不完整"); return; }

    const newExp = { action: "add", id: Date.now().toString(), payer, amount, desc, date: new Date().toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) };

    // 畫面先行
    expenses.push(newExp);
    localStorage.setItem('travelExpenses', JSON.stringify(expenses));
    renderExpenses();
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-desc').value = '';

    // 背景傳送 (iOS CORS 繞過寫法)
    fetch(CLOUD_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(newExp) }).catch(e => console.error(e));
}

// ☁️ 雲端：刪除
async function deleteExpense(id) {
    if(!confirm("確定刪除？")) return;
    expenses = expenses.filter(exp => exp.id != id);
    localStorage.setItem('travelExpenses', JSON.stringify(expenses));
    renderExpenses();

    fetch(CLOUD_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "delete", id: id }) }).catch(e => console.error(e));
}

// UI：開啟與渲染
function openExpenseModal() {
    const modal = document.getElementById('expenseModal');
    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.add('open'); }, 10);
    document.body.style.overflow = 'hidden';
    renderExpenses(expenses.length === 0);
    syncFromCloud();
}

function closeExpenseModal() {
    const modal = document.getElementById('expenseModal');
    modal.classList.remove('open');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
    document.body.style.overflow = '';
}

function renderExpenses(isLoading = false) {
    const listContainer = document.getElementById('expense-list');
    listContainer.innerHTML = isLoading ? '<p style="text-align:center; color:#86868b; font-size:12px; margin-top:20px;">☁️ 同步中...</p>' : '';
    let tTotal = 0; let jTotal = 0;
    
    [...expenses].reverse().forEach(exp => {
        const amt = parseInt(exp.amount);
        if (exp.payer === 'Timmy') tTotal += amt; else jTotal += amt;
        const icon = exp.payer === 'Timmy' ? '👦🏻' : '👧🏻';
        const color = exp.payer === 'Timmy' ? 'color-timmy' : 'color-jj';
        listContainer.innerHTML += `<div class="exp-item"><div class="exp-item-left"><div class="exp-avatar ${color}">${icon}</div><div class="exp-info"><span class="exp-desc">${exp.desc}</span><span class="exp-date">${exp.date}</span></div></div><div class="exp-item-right"><span class="exp-price">¥${amt.toLocaleString()}</span><div class="exp-delete" onclick="deleteExpense('${exp.id}')">🗑️</div></div></div>`;
    });

    const total = tTotal + jTotal;
    document.getElementById('total-amount').innerText = total.toLocaleString();
    document.getElementById('timmy-paid').innerText = tTotal.toLocaleString();
    document.getElementById('jj-paid').innerText = jTotal.toLocaleString();
    const sett = document.getElementById('settlement-text');
    const diff = tTotal - jTotal;
    if (diff > 0) { sett.innerHTML = `⚠️ <b>ㄐㄐ</b> 需給 Timmy： <b>¥${(diff/2).toLocaleString()}</b>`; sett.className="settlement owe-timmy"; }
    else if (diff < 0) { sett.innerHTML = `⚠️ <b>Timmy</b> 需給 ㄐㄐ： <b>¥${(Math.abs(diff)/2).toLocaleString()}</b>`; sett.className="settlement owe-jj"; }
    else { sett.innerHTML = `✅ 帳目平衡`; sett.className="settlement balanced"; }
}

/* =========================================
   ✨ 核心啟動 (含 100% 黏手滑動邏輯)
========================================= */
function init() {
    // 1. 天氣與位置
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            fetchWeather(lat, lon, "目前位置");
        }, () => fetchWeather(34.69, 135.50, "大阪市"));
    } else { fetchWeather(34.69, 135.50, "大阪市"); }

    // 2. 啟動計時器與預覽
    updateItineraryPreview();
    setInterval(updateItineraryPreview, 30000);

    // 3. 🚀 100% 黏手滑動算法 (針對 Payer Toggle)
    const toggleArea = document.querySelector('.payer-toggle');
    const slider = document.querySelector('.toggle-slider');
    if (toggleArea && slider) {
        let isDragging = false; let startX = 0; let currentTranslate = 0; let maxT = 0;
        toggleArea.addEventListener('touchstart', e => {
            isDragging = true; startX = e.touches[0].clientX;
            maxT = slider.offsetWidth;
            currentTranslate = document.getElementById('payer-jj').checked ? maxT : 0;
            slider.style.transition = 'none';
        }, { passive: true });

        toggleArea.addEventListener('touchmove', e => {
            if (!isDragging) return;
            let moveX = e.touches[0].clientX;
            let diff = moveX - startX;
            let finalX = currentTranslate + diff;
            if (finalX < 0) finalX = 0; if (finalX > maxT) finalX = maxT;
            slider.style.transform = `translateX(${finalX}px)`;
            if (Math.abs(diff) > 5) e.preventDefault();
        }, { passive: false });

        toggleArea.addEventListener('touchend', e => {
            isDragging = false;
            let endX = e.changedTouches[0].clientX;
            slider.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
            slider.style.transform = '';
            if (Math.abs(endX - startX) > 10) {
                let finalPos = currentTranslate + (endX - startX);
                if (finalPos > maxT / 2) document.getElementById('payer-jj').checked = true;
                else document.getElementById('payer-timmy').checked = true;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
