import axios from 'axios';

const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'your_REACT_APP_WEATHER_API_KEY_here';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const getCurrentWeather = async (lat, lon) => {
  try {
    const response = await axios.get(`${WEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'ja'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Weather API error:', error);
    throw new Error('天気情報の取得に失敗しました');
  }
};

export const getForecast = async (lat, lon) => {
  try {
    const response = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'ja'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Forecast API error:', error);
    throw new Error('天気予報の取得に失敗しました');
  }
};

export const getLocationFromCoords = async (lat, lon) => {
  try {
    const response = await axios.get(`${WEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'ja'
      }
    });
    return {
      city: response.data.name,
      country: response.data.sys.country
    };
  } catch (error) {
    console.error('Location API error:', error);
    throw new Error('位置情報の取得に失敗しました');
  }
};

export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('このブラウザでは位置情報がサポートされていません'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        let message = '位置情報の取得に失敗しました';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '位置情報の使用が許可されていません';
            break;
          case error.POSITION_UNAVAILABLE:
            message = '位置情報が利用できません';
            break;
          case error.TIMEOUT:
            message = '位置情報の取得がタイムアウトしました';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 
      }
    );
  });
};
