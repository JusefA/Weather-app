const OPENWEATHER_KEY = '6e2a507db124564dda6c027a0a212020';

const currentWeatherAPI = 'https://api.openweathermap.org/data/2.5/weather';
const hourlyForecastAPI = 'https://pro.openweathermap.org/data/2.5/forecast/hourly';
const dailyForecastAPI = 'https://api.openweathermap.org/data/2.5/forecast/daily';
const geocodingAPI = 'http://api.openweathermap.org/geo/1.0/direct';

let currentUnit = 'C';
let currentTemps = { C: null, K: null, F: null };

let currentLocation = {
    name: '',
    lat: null,
    lon: null
};
let isUserLocationRequest = false; // Requestia varten. Tarkistaa jos get my location nappulaa on painettu

const weatherBackgrounds = {
    'Clear': 'url("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLOhOYUulcUPKNh_4OOa8EYRO3IC9ysvsdNg&s")',
    'Clouds': 'url("https://images.unsplash.com/photo-1500740516770-92bd004b996e?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZGFyayUyMGNsb3VkeSUyMHNreXxlbnwwfHwwfHx8MA%3D%3D")',
    'Rain': 'url("https://wallpapers.com/images/hd/rain-desktop-dhwnq7l5y8etw008.jpg")',
    'Drizzle': 'url("https://www.rmets.org/sites/default/files/Rain.jpg")',
    'Thunderstorm': 'url("https://living.geico.com/wp-content/uploads/geico-more-Thunderstorms-post-2016.jpg")',
    'Snow': 'url("https://live.staticflickr.com/4576/24936496188_34626d3395_b.jpg")',
    'Mist': 'url("https://cff2.earth.com/uploads/2018/11/13053559/what-is-mist-960x640.jpg")',
    'Fog': 'url("https://c02.purpledshub.com/uploads/sites/77/2024/07/1ef43b4e-42f5-6ea4-a30b-b928118ab4d5.jpeg")',
};

const getCurrentWeatherURL = (lat, lon) => {
    return `${currentWeatherAPI}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`;
};

const getHourlyForecastURL = (lat, lon) => {
    return `${hourlyForecastAPI}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`;
};

const getDailyForecastURL = (lat, lon, cnt = 7) => {
    return `${dailyForecastAPI}?lat=${lat}&lon=${lon}&cnt=${cnt}&units=metric&appid=${OPENWEATHER_KEY}`;
};

async function getCoordinates(locationName, stateCode = '', countryCode = 'FI') {
    let query = encodeURIComponent(locationName);
    if (stateCode) {
        query += `,${encodeURIComponent(stateCode)}`;
    }
    if (countryCode) {
        query += `,${encodeURIComponent(countryCode)}`;
    }
    const url = `${geocodingAPI}?q=${query}&limit=1&appid=${OPENWEATHER_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.length > 0) {
            return {
                lat: data[0].lat,
                lon: data[0].lon,
                name: data[0].name,
                country: data[0].country
            };
        } else {
            throw new Error('Location not found');
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        throw error;
    }
}

async function fetchCurrentWeather(lat, lon) {
    const url = getCurrentWeatherURL(lat, lon);

    try {
        const response = await fetch(url);
        const data = await response.json();

        const locationName = isUserLocationRequest ? data.name : document.getElementById('locationInput').value;

        currentLocation.name = locationName;
        currentLocation.lat = lat;
        currentLocation.lon = lon;

        document.getElementById('location').textContent = locationName;
        document.getElementById('temperature').textContent = `Temperature: ${data.main.temp.toFixed(1)}°C`;
        document.getElementById('description').textContent = `Weather: ${data.weather[0].description}`;

        document.getElementById('addFavoriteButton').style.display = 'block';

        const iconCode = data.weather[0].icon;
        const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const weatherIconEl = document.getElementById('weatherIcon');
        weatherIconEl.src = iconUrl;
        weatherIconEl.style.display = 'block';

        isUserLocationRequest = false;

        currentTemps.C = parseFloat(data.main.temp.toFixed(1));
        currentTemps.K = parseFloat((currentTemps.C + 273.15).toFixed(1));
        currentTemps.F = parseFloat((currentTemps.C * 9/5 + 32).toFixed(1));

        const weatherCondition = data.weather[0].main;
        const backgroundImage = weatherBackgrounds[weatherCondition] || 'url("https://static.vecteezy.com/system/resources/previews/027/231/618/non_2x/illustration-graphic-of-aesthetic-background-template-with-subtle-pastel-colors-and-nature-motifs-vector.jpg")'; //perus, ei toimi rn
        document.querySelector('.container').style.backgroundImage = backgroundImage;
    } catch (error) {
        console.error('Error fetching current weather:', error);
        alert('Error fetching weather data. Please try again later.');
    }
}

function fetchWeatherForUserLocation() {
    if (navigator.geolocation) {
        isUserLocationRequest = true;
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                await fetchCurrentWeather(lat, lon);
                await fetchHourlyForecast(lat, lon);
                await fetchDailyForecast(lat, lon);
            },
            (error) => {
                console.error('Error fetching geolocation:', error);
                alert('Unable to retrieve your location. Please ensure location services are enabled.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

async function fetchHourlyForecast(lat, lon) {
    const url = getHourlyForecastURL(lat, lon);

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Hourly forecast data:', data);
        window.hourlyData = data;
    } catch (error) {
        console.error('Error fetching hourly forecast:', error);
        alert('Unable to fetch hourly forecast data. Please try again later.');
    }
}

function displayHourlyForecast(data) {
    const hourlyForecastEl = document.getElementById('hourlyForecast');
    hourlyForecastEl.innerHTML = '';

    const forecasts = data.list;
    const currentTime = Math.floor(Date.now() / 1000);
    const timezoneOffset = data.city.timezone;

    const forecastsForNext24Hours = forecasts.filter(forecast => {
        return forecast.dt >= currentTime && forecast.dt < currentTime + 24 * 3600;
    });

    forecastsForNext24Hours.forEach(forecast => {
        const timestamp = (forecast.dt + timezoneOffset) * 1000;
        const date = new Date(timestamp);

        const options = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        };
        const dateTimeString = date.toUTCString().slice(0, 22);

        const tempCelsius = forecast.main.temp;
        const temp = convertTemp(tempCelsius);

        const description = forecast.weather[0].description;
        const iconCode = forecast.weather[0].icon;
        const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

        const hourlyItem = document.createElement('div');
        hourlyItem.classList.add('hourly-item');

        hourlyItem.innerHTML = `
            <p>${dateTimeString}</p>
            <img src="${iconUrl}" alt="${description}">
            <p>${temp}</p>
            <p>${description}</p>
        `;

        hourlyForecastEl.appendChild(hourlyItem);
    });
}

async function fetchDailyForecast(lat, lon) {
    const url = getDailyForecastURL(lat, lon, 7);

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Daily forecast data:', data);
        window.dailyData = data;
    } catch (error) {
        console.error('Error fetching daily forecast:', error);
        alert('Unable to fetch daily forecast data. Please try again later.');
    }
}

function displayDailyForecast(data) {
    const dailyForecastEl = document.getElementById('dailyForecast');
    dailyForecastEl.innerHTML = '';

    const forecasts = data.list;

    forecasts.forEach(forecast => {
        const timestamp = forecast.dt * 1000;
        const date = new Date(timestamp);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const tempDayCelsius = forecast.temp.day;
        const tempNightCelsius = forecast.temp.night;
        const tempDay = convertTemp(tempDayCelsius);
        const tempNight = convertTemp(tempNightCelsius);

        const description = forecast.weather[0].description;
        const iconCode = forecast.weather[0].icon;
        const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

        const dailyItem = document.createElement('div');
        dailyItem.classList.add('daily-item');

        dailyItem.innerHTML = `
            <p>${dayName}</p>
            <img src="${iconUrl}" alt="${description}">
            <p>Day: ${tempDay}</p>
            <p>Night: ${tempNight}</p>
            <p>${description}</p>
        `;

        dailyForecastEl.appendChild(dailyItem);
    });
}

// unit conv main koodi tänne
function updateTemperatureDisplay() {
    const temperatureEl = document.getElementById('temperature');
    let tempText = '';
    let nextUnit = '';

    if (currentUnit === 'C') {
        tempText = `Temperature: ${currentTemps.C.toFixed(1)}°C`;
        nextUnit = 'Show in Kelvin';
    } else if (currentUnit === 'K') {
        tempText = `Temperature: ${currentTemps.K.toFixed(1)}K`;
        nextUnit = 'Show in Fahrenheit';
    } else if (currentUnit === 'F') {
        tempText = `Temperature: ${currentTemps.F.toFixed(1)}°F`;
        nextUnit = 'Show in Celsius';
    }

    temperatureEl.textContent = tempText;
    document.getElementById('toggleUnitButton').textContent = nextUnit;
}

function toggleTemperatureUnit() {
    if (currentUnit === 'C') {
        currentUnit = 'K';
    } else if (currentUnit === 'K') {
        currentUnit = 'F';
    } else if (currentUnit === 'F') {
        currentUnit = 'C';
    }
    updateTemperatureDisplay();

    if (document.getElementById('hourlyForecast').style.display !== 'none') {
        displayHourlyForecast(window.hourlyData);
    }
    if (document.getElementById('dailyForecast').style.display !== 'none') {
        displayDailyForecast(window.dailyData);
    }
}

function convertTemp(tempCelsius) {
    let temp = '';
    if (currentUnit === 'C') {
        temp = `${tempCelsius.toFixed(1)}°C`;
    } else if (currentUnit === 'K') {
        temp = `${(tempCelsius + 273.15).toFixed(1)}K`;
    } else if (currentUnit === 'F') {
        temp = `${(tempCelsius * 9/5 + 32).toFixed(1)}°F`;
    }
    return temp;
}

// Favs main koodi tänne
function getFavorites() {
    const favorites = localStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function addLocationToFavorites(location) {
    const favorites = getFavorites();

    let exists = false;
    for (const fav of favorites) {
        if (fav.name === location.name) {
            exists = true;
            break;
        }
    }

    if (!exists) {
        favorites.push(location);
        saveFavorites(favorites);
        displayFavorites();
    }
}

function displayFavorites() {
    const favorites = getFavorites();
    const favoritesList = document.getElementById('favoritesList');
    favoritesList.innerHTML = '';

    if (favorites.length > 0) {
        document.getElementById('favoritesContainer').style.display = 'block';

        favorites.forEach((fav, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = fav.name;

            const viewButton = document.createElement('button');
            viewButton.textContent = 'View Weather';
            viewButton.style.marginLeft = '10px';
            viewButton.addEventListener('click', async () => {
                await fetchCurrentWeather(fav.lat, fav.lon);
                await fetchHourlyForecast(fav.lat, fav.lon);
                await fetchDailyForecast(fav.lat, fav.lon);
            });


            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.style.marginLeft = '10px';
            removeButton.addEventListener('click', () => {
                removeFavorite(index);
            });

            listItem.appendChild(viewButton);
            listItem.appendChild(removeButton);
            favoritesList.appendChild(listItem);
        });
    } else {
        document.getElementById('favoritesContainer').style.display = 'none';
    }
}

function removeFavorite(index) {
    const favorites = getFavorites();
    favorites.splice(index, 1);
    saveFavorites(favorites);
    displayFavorites();
}

// Event listrns
document.getElementById('addFavoriteButton').addEventListener('click', () => {
    addLocationToFavorites(currentLocation);
});

document.getElementById('toggleUnitButton').addEventListener('click', toggleTemperatureUnit);

document.getElementById('locationButton').addEventListener('click', fetchWeatherForUserLocation);

document.getElementById('searchButton').addEventListener('click', async () => {
    const locationName = document.getElementById('locationInput').value.trim();
    const countryCode = 'FI';
    isUserLocationRequest = false;

    if (locationName === '') {
        alert('Please enter a location.');
        return;
    }

    try {
        const coords = await getCoordinates(locationName, '', countryCode);
        await fetchCurrentWeather(coords.lat, coords.lon);
        await fetchHourlyForecast(coords.lat, coords.lon);
        await fetchDailyForecast(coords.lat, coords.lon);

        document.getElementById('temperature').style.display = 'block';
        document.getElementById('description').style.display = 'block';
        document.getElementById('showHourlyButton').style.display = 'block';
        document.getElementById('showDailyButton').style.display = 'block';
        document.getElementById('backToCurrentButton').style.display = 'none';
        document.getElementById('hourlyForecastTitle').style.display = 'none';
        document.getElementById('hourlyForecast').style.display = 'none';
        document.getElementById('dailyForecastTitle').style.display = 'none';
        document.getElementById('dailyForecast').style.display = 'none';
    } catch (error) {
        console.error('Error in search:', error);
        alert('Location not found. Please try again.');
    }
});

document.getElementById('showHourlyButton').addEventListener('click', () => {

    document.getElementById('temperature').style.display = 'none';
    document.getElementById('description').style.display = 'none';
    document.getElementById('weatherIcon').style.display = 'none';
    document.getElementById('showDailyButton').style.display = 'block';
    document.getElementById('showHourlyButton').style.display = 'none';

    document.getElementById('hourlyForecastTitle').style.display = 'block';
    document.getElementById('hourlyForecast').style.display = 'flex';
    document.getElementById('backToCurrentButton').style.display = 'block';
    displayHourlyForecast(window.hourlyData);
});

document.getElementById('showDailyButton').addEventListener('click', () => {
    document.getElementById('temperature').style.display = 'none';
    document.getElementById('description').style.display = 'none';
    document.getElementById('weatherIcon').style.display = 'none';
    document.getElementById('showHourlyButton').style.display = 'block';
    document.getElementById('showDailyButton').style.display = 'none';

    document.getElementById('dailyForecastTitle').style.display = 'block';
    document.getElementById('dailyForecast').style.display = 'flex';
    document.getElementById('backToCurrentButton').style.display = 'block';
    displayDailyForecast(window.dailyData);
});

document.getElementById('backToCurrentButton').addEventListener('click', () => {

    document.getElementById('hourlyForecastTitle').style.display = 'none';
    document.getElementById('hourlyForecast').style.display = 'none';
    document.getElementById('dailyForecastTitle').style.display = 'none';
    document.getElementById('dailyForecast').style.display = 'none';

    document.getElementById('backToCurrentButton').style.display = 'none';

    document.getElementById('temperature').style.display = 'block';
    document.getElementById('description').style.display = 'block';
    document.getElementById('weatherIcon').style.display = 'block';
    document.getElementById('showHourlyButton').style.display = 'block';
    document.getElementById('showDailyButton').style.display = 'block';
});

// Viikko 5 tehtävän implemointi, turhia osia otettu pois. openstreetview ei toimi sillä sen takia ohjelma lagaa liian paljon.
let map;
let weatherCache = {};

async function fetchData() {
    const geoUrl = 'https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326';

    try {
        const response = await fetch(geoUrl);
        const geoData = await response.json();
        initMap(geoData);
    } catch (error) {
        console.error('Error fetching geographical data:', error);
        alert('Unable to fetch map data. Please try again later.');
    }
}

function initMap(geoData) {
    if (!map) {
        map = L.map('map').fitWorld();

        const geoJsonLayer = L.geoJSON(geoData, {
            onEachFeature: (feature, layer) => {
                const municipalityName = feature.properties.nimi;
                const centroid = layer.getBounds().getCenter();

                layer.on('mouseover', (e) => {
                    fetchCurrentWeatherForMap(centroid.lat, centroid.lng, municipalityName, e);
                });

                layer.on('mouseout', () => {
                    map.closePopup();
                });

                layer.bindTooltip(municipalityName, {
                    permanent: false,
                    direction: 'auto'
                });
            },
            style: {
                color: '#ff7800',
                weight: 2
            }
        }).addTo(map);

        map.fitBounds(geoJsonLayer.getBounds());
    }
}

async function fetchCurrentWeatherForMap(lat, lon, municipalityName, e) {
    const url = getCurrentWeatherURL(lat, lon);

    try {
        const response = await fetch(url);
        const data = await response.json();
        weatherCache[municipalityName] = data;
        showWeatherPopup(e, data, municipalityName);
    } catch (error) {
        console.error('Error fetching weather data for map:', error);
    }
}

function showWeatherPopup(e, data, municipalityName) {
    const temp = data.main.temp.toFixed(1);
    const description = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

    const popupContent = `
        <div class="weather-popup">
            <h4>${municipalityName}</h4>
            <p><img src="${iconUrl}" alt="${description}" width="50" height="50"> ${temp}°C, ${description}</p>
        </div>
    `;

    L.popup({ offset: L.point(0, -20) })
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);
}

document.getElementById('showMapButton').addEventListener('click', () => {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('mapContainer').style.display = 'block';
    fetchData();
});

document.getElementById('menuBACK').addEventListener('click', () => {
    document.getElementById('mapContainer').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'block';
});

displayFavorites();
