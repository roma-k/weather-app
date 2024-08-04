// API ключ OpenWeatherMap
const apiKey = 'b08d83c6670eea5d93dbc0857e365a8f';

// DOM элементы
const citySearch = document.getElementById('city-search');
const searchButton = document.getElementById('search-button');
const searchResults = document.getElementById('search-results');
const currentCity = document.getElementById('current-city');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temperature');
const pressure = document.getElementById('pressure');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');

// Получить данные о погоде для города
async function fetchWeatherData(city) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === 200) {
            updateWeatherUI(data);
        } else {
            displayErrorMessage(data.message || 'Город не найден');
        }
    } catch (error) {
        displayErrorMessage('Ошибка при получении данных. Попробуйте позже.');
    }
}

// Обновить интерфейс пользователя с данными о погоде
function updateWeatherUI(data) {
    currentCity.textContent = data.name;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    pressure.textContent = `${data.main.pressure} hPa`;
    windSpeed.textContent = `${data.wind.speed} м/с`;
    humidity.textContent = `${data.main.humidity}%`;
    weatherIcon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    storeRecentSearch(data.name);
    displayRecentSearches();
}

// Получить список релевантных результатов для введенного города
async function fetchCitySuggestions(city) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/find?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === '200' && data.count > 0) {
            displaySearchResults(data.list);
        } else {
            displayErrorMessage('Город не найден');
        }
    } catch (error) {
        displayErrorMessage('Ошибка при получении данных. Попробуйте позже.');
    }
}

// Отобразить результаты поиска
function displaySearchResults(results) {
    searchResults.innerHTML = ''; // Очистить предыдущие результаты
    results.forEach(city => {
        const item = document.createElement('div');
        item.classList.add('result-item');
        item.textContent = `${city.name}, ${city.sys.country}`;
        item.addEventListener('click', () => {
            fetchWeatherData(city.name);
            searchResults.classList.add('hidden');
        });
        searchResults.appendChild(item);
    });
    searchResults.classList.remove('hidden'); // Показать список результатов
}

// Отобразить сообщение об ошибке
function displayErrorMessage(message) {
    alert(message);
    currentCity.textContent = "Город не найден";
    temperature.textContent = "--°C";
    pressure.textContent = "-- hPa";
    windSpeed.textContent = "-- м/с";
    humidity.textContent = "--%";
    weatherIcon.src = "";
}

// Сохранить недавние поиски
function storeRecentSearch(city) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    if (!recentSearches.includes(city)) {
        recentSearches.push(city);
        if (recentSearches.length > 5) recentSearches.shift(); // Храним только 5 последних поисков
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }
}

// Получить недавние поиски
function getRecentSearches() {
    return JSON.parse(localStorage.getItem('recentSearches')) || [];
}

// Отобразить недавние поиски
function displayRecentSearches() {
    const recentSearches = getRecentSearches();
    const datalist = document.getElementById('recent-searches');
    datalist.innerHTML = '';
    recentSearches.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        datalist.appendChild(option);
    });
}

// Получить погоду по геолокации
async function getWeatherByGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.cod === 200) {
                updateWeatherUI(data);
            } else {
                displayErrorMessage('Не удалось получить погоду по геолокации');
            }
        }, () => {
            fetchWeatherData('Москва').then(updateWeatherUI); // Если не удалось, используем город по умолчанию
        });
    } else {
        fetchWeatherData('Москва').then(updateWeatherUI); // Если не удалось, используем город по умолчанию
    }
}

// Обработка нажатия кнопки поиска
searchButton.addEventListener('click', () => {
    const city = citySearch.value.trim();
    if (city.length > 0) {
        fetchCitySuggestions(city);
    }
});

// Обработка нажатия клавиши Enter в поле поиска
citySearch.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const city = citySearch.value.trim();
        if (city.length > 0) {
            fetchCitySuggestions(city);
        }
    }
});

// Начальная загрузка - Получить погоду по геолокации
getWeatherByGeolocation();
