// 動態獲取按鈕位置，創造吸附特效
function openModal(dayId, event) {
    const modal = document.getElementById('itineraryModal');
    const modalContent = document.querySelector('.modal-content');
    const modalBody = document.getElementById('modalBody');
    const sourceContent = document.getElementById('content-' + dayId);
    
    if (modal && sourceContent && event) {
        // 抓取按鈕在畫面上的中心座標
        const btnRect = event.currentTarget.getBoundingClientRect();
        const originX = btnRect.left + (btnRect.width / 2);
        const originY = btnRect.top + (btnRect.height / 2);
        
        // 設定彈出視窗的變形起點為按鈕中心
        modalContent.style.transformOrigin = `${originX}px ${originY}px`;
        
        modalBody.innerHTML = sourceContent.innerHTML;
        modal.style.display = 'flex';
        
        // 強制瀏覽器重繪以觸發動畫
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
        }, 400);
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

// 抓取 24 小時天氣 (精準對齊現在時刻)
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

        // 取得現在時間的 Epoch 毫秒數
        const currentEpoch = new Date().getTime();
        const hourlyTimes = data.hourly.time;
        
        // 尋找陣列中最接近「現在時刻」的小時索引
        let startIndex = 0;
        let minDiff = Infinity;
        for (let i = 0; i < hourlyTimes.length; i++) {
            // 強制加上 +09:00 確保轉換為日本時區進行比對
            const tEpoch = new Date(hourlyTimes[i] + "+09:00").getTime();
            const diff = Math.abs(tEpoch - currentEpoch);
            if (diff < minDiff) {
                minDiff = diff;
                startIndex = i;
            }
        }

        // 防呆機制：確保剩下的資料夠 24 小時
        if (startIndex + 24 > hourlyTimes.length) {
            startIndex = Math.max(0, hourlyTimes.length - 24);
        }

        let hourlyHTML = '';
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
