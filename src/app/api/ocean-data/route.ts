import { NextResponse } from 'next/server';
import { WANDO_COORDINATES } from '@/lib/types';

// Open-Meteo Marine API endpoint
const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine';
// Open-Meteo Weather API endpoint
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const type = searchParams.get('type') || 'current'; // 'current' | 'historical'

  try {
    const { latitude, longitude } = WANDO_COORDINATES;

    // Build Marine API URL
    const marineParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: [
        'wave_height',
        'wave_direction',
        'wave_period',
        'ocean_current_velocity',
        'ocean_current_direction',
        'sea_surface_temperature',
      ].join(','),
      timezone: 'Asia/Seoul',
    });

    if (startDate) marineParams.set('start_date', startDate);
    if (endDate) marineParams.set('end_date', endDate);

    // Build Weather API URL
    const weatherParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: [
        'surface_pressure',
        'temperature_2m',
        'relative_humidity_2m',
      ].join(','),
      timezone: 'Asia/Seoul',
    });

    if (startDate) weatherParams.set('start_date', startDate);
    if (endDate) weatherParams.set('end_date', endDate);

    // Fetch both APIs in parallel
    const [marineResponse, weatherResponse] = await Promise.all([
      fetch(`${MARINE_API_URL}?${marineParams.toString()}`),
      fetch(`${WEATHER_API_URL}?${weatherParams.toString()}`),
    ]);

    if (!marineResponse.ok) {
      const errorText = await marineResponse.text();
      console.error('Marine API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch marine data', details: errorText },
        { status: marineResponse.status }
      );
    }

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('Weather API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch weather data', details: errorText },
        { status: weatherResponse.status }
      );
    }

    const marineData = await marineResponse.json();
    const weatherData = await weatherResponse.json();

    // Combine data
    const combinedData = {
      location: WANDO_COORDINATES,
      timezone: 'Asia/Seoul',
      marine: {
        hourly: {
          time: marineData.hourly?.time || [],
          wave_height: marineData.hourly?.wave_height || [],
          wave_direction: marineData.hourly?.wave_direction || [],
          wave_period: marineData.hourly?.wave_period || [],
          ocean_current_velocity: marineData.hourly?.ocean_current_velocity || [],
          ocean_current_direction: marineData.hourly?.ocean_current_direction || [],
          sea_surface_temperature: marineData.hourly?.sea_surface_temperature || [],
        },
      },
      weather: {
        hourly: {
          time: weatherData.hourly?.time || [],
          surface_pressure: weatherData.hourly?.surface_pressure || [],
          temperature_2m: weatherData.hourly?.temperature_2m || [],
          relative_humidity_2m: weatherData.hourly?.relative_humidity_2m || [],
        },
      },
    };

    return NextResponse.json(combinedData);
  } catch (error) {
    console.error('Ocean Data API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
