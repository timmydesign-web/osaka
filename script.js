// 動態獲取按鈕位置，創造精準的吸附與彈跳特效
function openModal(dayId, event) {
    const modal = document.getElementById('itineraryModal');
    const modalContent = document.querySelector('.modal-content');
    const modalBody = document.getElementById('modalBody');
    const sourceContent = document.getElementById('content-' + dayId);
    
    if (modal && sourceContent && event) {
        modalBody.innerHTML = sourceContent.innerHTML;
        
        // 先顯示彈出視窗 (此時 opacity 為 0)，這樣才能抓到視窗的真實尺寸
        modal.style.display = 'flex';
        
        // 抓取按鈕與白色視窗在螢幕上的位置
        const btnRect = event.currentTarget.getBoundingClientRect();
        const contentRect = modalContent.getBoundingClientRect();
        
        // 計算原點 (必須是相對於白色視窗本身的內部座標)
        const originX = btnRect.left + (btnRect.width / 2) - contentRect.left;
        const originY = btnRect.top + (btnRect.height / 2) - contentRect.top;
        
        // 設定彈跳變形的起點為那顆按鈕的中心
        modalContent.style.transformOrigin = `${originX}px ${originY}px`;
        
        // 強制瀏覽器重繪以觸發流暢動畫
        void modal.offsetWidth; 
        
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('itineraryModal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => {
            if (!modal.classList.contains('open')) {
                modal.style.display = 'none';
            }
        }, 400); // 等待吸附動畫完成再隱藏
        document.body.style.overflow = '';
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('itineraryModal');
    if (event.target === modal) closeModal();
};

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeModal();
});

// 天氣 Emoji 轉換器
function getWeatherEmoji(code) {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "⛅";
    if (code === 3) return "☁️";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 82) return "❄️";
    if (code >= 95) return "⛈️";
    return "🌤️";
}

// 抓取 24 小時天氣 (修復 iOS 時間格式報錯問題)
async function fetchWeather() {
    const hourlyContainer = document.getElementById('hourly-forecast');
    const titleDesc = document.getElementById('current-weather-desc');
    if (!hourlyContainer) return;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=34.6937&longitude=135.5022&current_weather=true&hourly=temperature_2m,weathercode&timezone=Asia%2FTokyo&forecast_days=2', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('API 狀態錯誤');
        
        const data = await response.json();
        const currentCode = data.current_weather.weathercode;
        const currentTemp = Math.round(data.current_weather.temperature);
        titleDesc.innerHTML = `${getWeatherEmoji(currentCode)} 目前 ${currentTemp}°C`;

        // 完美解法：直接拿 API 的現在時間字串去陣列裡面找，完全避開 iOS 的時區轉換地雷
        const currentHourStr = data.current_weather.time; // 例如 "2026-03-26T17:00"
        const hourlyTimes = data.hourly.time;
        
        let startIndex = hourlyTimes.findIndex(t => t === currentHourStr);
        if (startIndex === -1) startIndex = 0; // 防呆

        let hourlyHTML = '';
        // 從當下時間開始往後排 24 個小時
        for (let i = startIndex; i < startIndex + 24; i++) {
            const timeStr = hourlyTimes[i].substring(11, 16); 
            const temp = Math.round(data.hourly.temperature_2m[i]);
            const code = data.hourly.weathercode[i];
            const icon = getWeatherEmoji(code);
            
            hourlyHTML += `
                <div class="hourly-item">
                    <span class="h-time">${timeStr}</span>
                    <span class="h-icon">${icon}</span>
                    <span class="h-temp">${temp}°</span>
                </div>
            `;
        }
        hourlyContainer.innerHTML = hourlyHTML;

    } catch (error) {
        console.error("天氣獲取失敗", error);
        titleDesc.innerHTML = "天氣資訊暫停";
        hourlyContainer.innerHTML = "<p style='font-size:13px; color:#d93025; width: 100%; text-align: center;'>無法連線氣象伺服器，請重新整理網頁。</p>";
    }
}

document.addEventListener('DOMContentLoaded', fetchWeather);
