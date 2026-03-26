function openModal(dayId) {
    const modal = document.getElementById('itineraryModal');
    const modalBody = document.getElementById('modalBody');
    const sourceContent = document.getElementById('content-' + dayId);
    
    if (modal && sourceContent) {
        modalBody.innerHTML = sourceContent.innerHTML;
        modal.style.display = 'flex';
        setTimeout(() => { modal.classList.add('open'); }, 15);
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

// 強化版：抓取 24 小時天氣 (加入超時保護機制)
async function fetchWeather() {
    const hourlyContainer = document.getElementById('hourly-forecast');
    const titleDesc = document.getElementById('current-weather-desc');
    if (!hourlyContainer) return;

    try {
        // 設定 5 秒超時，避免無限轉圈圈
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=34.6937&longitude=135.5022&current_weather=true&hourly=temperature_2m,weathercode&timezone=Asia%2FTokyo&forecast_days=2', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('API 狀態錯誤');
        
        const data = await response.json();
        const currentCode = data.current_weather.weathercode;
        const currentTemp = Math.round(data.current_weather.temperature);
        titleDesc.innerHTML = `${getWeatherEmoji(currentCode)} 目前 ${currentTemp}°C`;

        const currentHourStr = data.current_weather.time;
        const hourlyTimes = data.hourly.time;
        let startIndex = hourlyTimes.findIndex(t => t === currentHourStr);
        if (startIndex === -1) startIndex = 0;

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
