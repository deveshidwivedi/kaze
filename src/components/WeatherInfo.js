import React from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Eye, Droplets, Thermometer } from 'lucide-react';

const WeatherInfo = ({ weatherData }) => {
  if (!weatherData) return null;

  const {
    main: { temp, feels_like, humidity, pressure } = {},
    weather: [{ description, main: weatherMain }] = [{}],
    wind: { speed } = {},
    visibility,
    name: cityName
  } = weatherData;

  const getWeatherIcon = (weatherMain) => {
    switch (weatherMain?.toLowerCase()) {
      case 'clear':
        return <Sun size={24} />;
      case 'clouds':
        return <Cloud size={24} />;
      case 'rain':
      case 'drizzle':
        return <CloudRain size={24} />;
      case 'snow':
        return <CloudSnow size={24} />;
      default:
        return <Cloud size={24} />;
    }
  };

  const formatVisibility = (visibility) => {
    if (!visibility) return 'データなし';
    return `${(visibility / 1000).toFixed(1)}km`;
  };

  return (
    <div className="weather-info">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        {getWeatherIcon(weatherMain)}
        <h3>{cityName}</h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Thermometer size={16} />
          <span>{temp}°C</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Droplets size={16} />
          <span>{humidity}%</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Wind size={16} />
          <span>{speed}m/s</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Eye size={16} />
          <span>{formatVisibility(visibility)}</span>
        </div>
      </div>
      
      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: '0.9' }}>
        {description} | 体感温度: {feels_like}°C
      </div>
    </div>
  );
};

export default WeatherInfo;
