'use strict';

const permission = document.querySelector('.permission');
const positive = document.querySelector('.positive');
const negative = document.querySelector('.negative');
const error = document.querySelector('.error');

const API_KEY = '436d3f1d86c49c7f53ba2b7412545ab5';
const RAIN_MARGIN = 4;

//funcion que hace peticion a url y devuelve json
async function getData({ url, options = {} }) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error('Error in the petition');
  }

  const data = await response.json();

  return data;
}

//funcion que muestra un panel
function showPanel(panel) {
  hideAllPanels();
  panel.classList.remove('hidden');
}

//oculta todos los paneles
function hideAllPanels() {
  permission.classList.add('hidden');
  positive.classList.add('hidden');
  negative.classList.add('hidden');
  error.classList.add('hidden');
}

//funcion que se ejecutará si va a llover
function showPositive({ city, temperature, weather, nextRain }) {
  showPanel(positive);
  const text = positive.querySelector('p');
  text.innerHTML = `
  Right now there is ${temperature}ºC in ${city} with ${weather} and 
  ${nextRain > 0 ? `probably it is going to rain in ${nextRain} hour(s)` : 'it is raining right now!!'}
  `;
}

//funcion que se ejecutara si no va a llover
function showNegative({ city, weather, temperature }) {
  showPanel(negative);
  const text = negative.querySelector('p');
  text.innerHTML = `
  Right now there is ${temperature}ºC in ${city} with ${weather} and it is not going to rain for the next ${RAIN_MARGIN} hour(s).
  `;
}

//funcion que pide la informacion del tiempo y detecta si lloverá o no
async function getWeatherData({ latitude, longitude }) {
  try {
    //Pedir estado actual a la api
    const currentWeather = await getData({
      url: `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=en`,
    });
    //Pedir prediccion proximas horas a la api
    const nextHours = await getData({
      url: `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=current,minutely,daily&appid=${API_KEY}&units=metric&lang=en`,
    });
    //Comprobar si va a llover en las proximas RAIN_MARGIN horas
    const nextRain = nextHours.hourly.findIndex((hour) => {
      return hour.weather[0].main === 'Rain';
    });
    //si llueve mostrar panel positive
    //si no llueve mostrar panel negative
    if (nextRain > -1 && nextRain <= RAIN_MARGIN) {
      showPositive({
        city: currentWeather.name,
        temperature: currentWeather.main.temp,
        weather: currentWeather.weather[0].description,
        nextRain,
      });
    } else {
      showNegative({
        city: currentWeather.name,
        temperature: currentWeather.main.temp,
        weather: currentWeather.weather[0].description,
      });
    }
  } catch (error) {
    //si hay un error mostrar panel error
    showPanel(error);
  }
}

//funcion que pide la localizacion al usuario
function getUserLocation() {
  hideAllPanels();
  navigator.geolocation.getCurrentPosition(
    (location) => {
      const { latitude, longitude } = location.coords;
      getWeatherData({ latitude, longitude });
      localStorage.setItem('permission', 'ok');
    },
    () => {
      showPanel(error);
    }
  );
}

//funcion principal
function main() {
  if (localStorage.getItem('permission') === 'ok') {
    getUserLocation();
  } else {
    showPanel(permission);

    const permissionButton = permission.querySelector('button');

    permissionButton.onclick = () => {
      getUserLocation();
    };
  }
}

main();
