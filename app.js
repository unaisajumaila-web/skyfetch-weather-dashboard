function WeatherApp(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = "https://api.openweathermap.org/data/2.5/weather";
    this.forecastUrl = "https://api.openweathermap.org/data/2.5/forecast";

    this.cityInput = document.getElementById("cityInput");
    this.searchBtn = document.getElementById("searchBtn");
    this.weatherContainer = document.getElementById("weather-container");

    this.recentSearchesSection = document.getElementById("recent-searches-section");
    this.recentSearchesContainer = document.getElementById("recent-searches-container");

    this.recentSearches = [];
    this.maxRecentSearches = 5;

    this.init();
}

/* 🔹 Initialize App */
WeatherApp.prototype.init = function () {
    this.searchBtn.addEventListener("click", this.handleSearch.bind(this));

    this.cityInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            this.handleSearch();
        }
    });

    const clearBtn = document.getElementById("clear-history-btn");
    if (clearBtn) {
        clearBtn.addEventListener("click", this.clearHistory.bind(this));
    }

    this.loadRecentSearches();
    this.loadLastCity();
};

/* 🔹 Welcome */
WeatherApp.prototype.showWelcome = function () {
    this.weatherContainer.innerHTML = `
        <div>
            <h2>🌍 Welcome to SkyFetch</h2>
            <p>Search for a city to get real-time weather updates.</p>
        </div>
    `;
};

/* 🔹 Handle Search */
WeatherApp.prototype.handleSearch = function () {
    const city = this.cityInput.value.trim();

    if (!city) {
        this.showError("Please enter a city name.");
        return;
    }

    if (city.length < 2) {
        this.showError("City name too short.");
        return;
    }

    this.getWeather(city);
    this.cityInput.value = "";
};

/* 🔹 Get Weather */
WeatherApp.prototype.getWeather = async function (city) {
    this.showLoading();
    this.searchBtn.disabled = true;
    this.searchBtn.textContent = "Searching...";

    const currentUrl = `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
    const forecastUrl = `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    try {
        const [currentRes, forecastRes] = await Promise.all([
            axios.get(currentUrl),
            axios.get(forecastUrl)
        ]);

        this.displayWeather(currentRes.data);
        this.displayForecast(forecastRes.data);

        this.saveRecentSearch(city);
        localStorage.setItem("lastCity", city);

    } catch (error) {
        if (error.response && error.response.status === 404) {
            this.showError("City not found. Please check spelling.");
        } else {
            this.showError("Something went wrong. Try again later.");
        }
    } finally {
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = "Search";
    }
};

/* 🔹 Save Recent Search */
WeatherApp.prototype.saveRecentSearch = function (city) {
    const formatted =
        city.charAt(0).toUpperCase() +
        city.slice(1).toLowerCase();

    const index = this.recentSearches.indexOf(formatted);
    if (index > -1) {
        this.recentSearches.splice(index, 1);
    }

    this.recentSearches.unshift(formatted);

    if (this.recentSearches.length > this.maxRecentSearches) {
        this.recentSearches.pop();
    }

    localStorage.setItem("recentSearches", JSON.stringify(this.recentSearches));
    this.displayRecentSearches();
};

/* 🔹 Load Recent Searches */
WeatherApp.prototype.loadRecentSearches = function () {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
        this.recentSearches = JSON.parse(saved);
    }
    this.displayRecentSearches();
};

/* 🔹 Display Recent Searches */
WeatherApp.prototype.displayRecentSearches = function () {
    this.recentSearchesContainer.innerHTML = "";

    if (this.recentSearches.length === 0) {
        this.recentSearchesSection.style.display = "none";
        return;
    }

    this.recentSearchesSection.style.display = "block";

    this.recentSearches.forEach(function (city) {
        const btn = document.createElement("button");
        btn.className = "recent-search-btn";
        btn.textContent = city;

        btn.addEventListener("click", function () {
            this.cityInput.value = city;
            this.getWeather(city);
        }.bind(this));

        this.recentSearchesContainer.appendChild(btn);
    }.bind(this));
};

/* 🔹 Load Last City */
WeatherApp.prototype.loadLastCity = function () {
    const lastCity = localStorage.getItem("lastCity");

    if (lastCity) {
        this.getWeather(lastCity);
    } else {
        this.showWelcome();
    }
};

/* 🔹 Clear History */
WeatherApp.prototype.clearHistory = function () {
    if (confirm("Clear all recent searches?")) {
        this.recentSearches = [];
        localStorage.removeItem("recentSearches");
        this.displayRecentSearches();
    }
};

/* 🔹 Display Current Weather */
WeatherApp.prototype.displayWeather = function (data) {
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    this.weatherContainer.innerHTML = `
        <h2>${data.name}</h2>
        <img src="${iconUrl}" />
        <p><strong>Temperature:</strong> ${Math.round(data.main.temp)}°C</p>
        <p>${data.weather[0].description}</p>
    `;
};

/* 🔹 Forecast Processing */
WeatherApp.prototype.processForecastData = function (data) {
    return data.list.filter(item =>
        item.dt_txt.includes("12:00:00")
    ).slice(0, 5);
};

/* 🔹 Display Forecast */
WeatherApp.prototype.displayForecast = function (data) {
    const dailyForecasts = this.processForecastData(data);

    const forecastHTML = dailyForecasts.map(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const temp = Math.round(day.main.temp);
        const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;

        return `
            <div class="forecast-card">
                <h4>${dayName}</h4>
                <img src="${iconUrl}" />
                <p>${temp}°C</p>
                <p>${day.weather[0].description}</p>
            </div>
        `;
    }).join("");

    this.weatherContainer.innerHTML += `
        <div class="forecast-section">
            <h3>5-Day Forecast</h3>
            <div class="forecast-container">
                ${forecastHTML}
            </div>
        </div>
    `;
};

/* 🔹 Loading */
WeatherApp.prototype.showLoading = function () {
    this.weatherContainer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Fetching weather data...</p>
        </div>
    `;
};

/* 🔹 Error */
WeatherApp.prototype.showError = function (message) {
    this.weatherContainer.innerHTML = `
        <div class="error-message">
            ❌ ${message}
        </div>
    `;
};

/* 🔹 Create App */
const app = new WeatherApp("2f6976af8b7b33a7d5323c1e39237b20");