let currentActiveButton = null;

// 計算精準的縮放吸附原點
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

function openModal(dayId, event) {
    const modal = document.getElementById('itineraryModal');
    const modalContent = document.querySelector('.modal-content');
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
    }
}

function closeModal() {
    const modal = document.getElementById('itineraryModal');
    if (modal) {
        setModalOrigin(); // 關閉前重新對準原按鈕位置
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
    const modal = document.getElementById('itineraryModal');
    if (event.target === modal) closeModal();
};

function getWeatherEmoji(code) {
    const table = { 0: "☀️", 1: "⛅", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️", 51: "🌧️", 61: "🌧️", 95: "⛈️" };
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
        
        titleDesc.innerHTML = `${getWeatherEmoji(data.current_weather.weathercode)} 目前 ${Math.round(data.current_weather.temperature)}°C`;

        const currentHourStr = data.current_weather.time; 
        const hourlyTimes = data.hourly.time;
        let startIndex = hourlyTimes.findIndex(t => t === currentHourStr);
        if (startIndex === -1) startIndex = 0; 

        let html = '';
        for (let i = startIndex; i < startIndex + 24; i++) {
            html += `
                <div class="hourly-item">
                    <span class="h-time">${hourlyTimes[i].substring(11, 16)}</span>
                    <span class="h-icon">${getWeatherEmoji(data.hourly.weathercode[i])}</span>
                    <span class="h-temp">${Math.round(data.hourly.temperature_2m[i])}°</span>
                </div>`;
        }
        hourlyContainer.innerHTML = html;
    } catch (e) {
        titleDesc.innerHTML = "天氣同步失敗";
    }
}

function initWeather() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            try {
                const geo = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`);
                const gData = await geo.json();
                fetchWeather(lat, lon, gData.city || "當地位置");
            } catch { fetchWeather(lat, lon, "目前位置"); }
        }, () => fetchWeather(34.69, 135.50, "大阪市 (預設)"), { timeout: 5000 });
    } else { fetchWeather(34.69, 135.50, "大阪市 (預設)"); }
}

document.addEventListener('DOMContentLoaded', initWeather);
