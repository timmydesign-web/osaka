// 新增：用來記憶使用者點擊的是哪一顆按鈕
let currentActiveButton = null;

// 新增：獨立計算變形原點的函數，確保座標不受縮放動畫干擾
function setModalOrigin() {
    if (!currentActiveButton) return;
    const modalContent = document.querySelector('.modal-content');
    const btnRect = currentActiveButton.getBoundingClientRect();
    
    // 使用螢幕寬高與卡片「原始物理尺寸」(offsetWidth) 來推算卡片的左上角位置
    const layoutLeft = (window.innerWidth - modalContent.offsetWidth) / 2;
    const layoutTop = (window.innerHeight - modalContent.offsetHeight) / 2;
    
    // 算出相對於卡片本身的 X, Y 座標
    const originX = btnRect.left + (btnRect.width / 2) - layoutLeft;
    const originY = btnRect.top + (btnRect.height / 2) - layoutTop;
    
    // 設定吸附點
    modalContent.style.transformOrigin = `${originX}px ${originY}px`;
}

function openModal(dayId, event) {
    const modal = document.getElementById('itineraryModal');
    const modalContent = document.querySelector('.modal-content');
    const modalBody = document.getElementById('modalBody');
    const sourceContent = document.getElementById('content-' + dayId);
    
    if (modal && sourceContent && event) {
        // 記憶這次點擊的按鈕
        currentActiveButton = event.currentTarget;
        
        modalBody.innerHTML = sourceContent.innerHTML;
        modal.style.display = 'flex';
        
        // 開啟時：計算從哪裡放大出來
        setModalOrigin();
        
        void modal.offsetWidth; // 強制瀏覽器重繪
        
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('itineraryModal');
    if (modal) {
        // 關閉時：重新對準按鈕位置 (防止使用者滑動螢幕後位置跑掉)
        setModalOrigin();
        
        modal.classList.remove('open');
        setTimeout(() => {
            if (!modal.classList.contains('open')) {
                modal.style.display = 'none';
                currentActiveButton = null; // 清除記憶
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

// 根據傳入的座標與城市名稱抓取天氣
async function fetchWeather(lat, lon, cityName) {
    const hourlyContainer = document.getElementById('hourly-forecast');
    const titleDesc = document.getElementById('current-weather-desc');
    const locationName = document.getElementById('location-name');
    
    if (!hourlyContainer) return;

    try {
        locationName.innerHTML = `📍 ${cityName}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto&forecast_days=2`, { signal: controller.signal });
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
        hourlyContainer.innerHTML = "<p style='font-size:13px; color:#d93025; width: 100%; text-align: center;'>無法連線氣象伺服器，請確認網路或稍後再試。</p>";
    }
}

// 啟動定位功能
function initWeather() {
    const locationName = document.getElementById('location-name');
    
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                let cityName = "當地位置";
                
                try {
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`);
                    const geoData = await res.json();
                    cityName = geoData.city || geoData.locality || "當地位置";
                } catch (e) {
                    console.error("無法解析城市名稱", e);
                }
                
                fetchWeather(lat, lon, cityName);
            }, 
            (error) => {
                console.warn("定位失敗或被拒絕，使用預設大阪市座標");
                fetchWeather(34.6937, 135.5022, "大阪市 (預設)");
            },
            { timeout: 10000, maximumAge: 60000 }
        );
    } else {
        fetchWeather(34.6937, 135.5022, "大阪市 (預設)");
    }
}

document.addEventListener('DOMContentLoaded', initWeather);
