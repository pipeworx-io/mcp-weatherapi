interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * WeatherAPI.com MCP — wraps WeatherAPI.com (api.weatherapi.com)
 *
 * Tools:
 * - current: real-time weather + air quality for a location
 * - forecast: multi-day weather forecast (highs/lows, rain chance, sunrise/sunset)
 * - astronomy: astronomy data — sunrise/sunset, moonrise/moonset, moon phase/illumination
 * - marine: marine/ocean conditions — significant wave height, swell, water temp
 *
 * Dual-key model: pass your own WeatherAPI.com key via _apiKey for higher limits,
 * or omit it to use the shared Pipeworx platform key. Key is passed as the `key`
 * query param; the location is the `q` param (city / "lat,lon" / zip / IATA / IP).
 */


const BASE_URL = 'https://api.weatherapi.com/v1';

const API_KEY_OPTIONAL = {
  type: 'string',
  description:
    'Optional — your own WeatherAPI.com API key for higher limits; omit to use the shared Pipeworx key.',
} as const;

const Q_DESC =
  'Location — city name (e.g. "London"), "lat,lon" (e.g. "48.8567,2.3508"), US/UK/Canada zip/postcode, IATA airport code (e.g. "DXB"), or "auto:ip".';

const tools: McpToolExport['tools'] = [
  {
    name: 'current',
    description:
      'Get current/real-time weather for a location, including temperature, condition, humidity, wind, UV, and air quality (AQI). Location can be a city name, "lat,lon", zip code, or IATA airport code. Example: current({ q: "London", aqi: true }).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        q: { type: 'string', description: Q_DESC },
        aqi: {
          type: 'boolean',
          description: 'Include air quality (AQI) data. Default true.',
        },
        _apiKey: API_KEY_OPTIONAL,
      },
      required: ['q'],
    },
  },
  {
    name: 'forecast',
    description:
      'Get a multi-day weather forecast for a location: daily high/low temperature, condition, chance of rain, total precipitation, and sunrise/sunset times. Up to 10 days. Example: forecast({ q: "Tokyo", days: 5 }).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        q: { type: 'string', description: Q_DESC },
        days: {
          type: 'number',
          description: 'Number of forecast days (default 3, max 10).',
        },
        _apiKey: API_KEY_OPTIONAL,
      },
      required: ['q'],
    },
  },
  {
    name: 'astronomy',
    description:
      'Get astronomy data for a location and date: sunrise, sunset, moonrise, moonset, moon phase, and moon illumination. Example: astronomy({ q: "Reykjavik", dt: "2026-06-21" }).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        q: { type: 'string', description: Q_DESC },
        dt: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (optional; defaults to today).',
        },
        _apiKey: API_KEY_OPTIONAL,
      },
      required: ['q'],
    },
  },
  {
    name: 'marine',
    description:
      'Get marine/ocean conditions forecast for a coastal location: significant wave height, swell height, water temperature, and wind. Up to 7 days, sampled every 6 hours. Example: marine({ q: "33.7,-118.4", days: 2 }).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        q: { type: 'string', description: Q_DESC },
        days: {
          type: 'number',
          description: 'Number of marine forecast days (default 1, max 7).',
        },
        _apiKey: API_KEY_OPTIONAL,
      },
      required: ['q'],
    },
  },
];

// -- helpers -----------------------------------------------------------------

async function weatherGet(apiKey: string, path: string, params: URLSearchParams): Promise<any> {
  if (!apiKey) {
    return { error: 'api_key_required', message: 'No WeatherAPI.com key available.' };
  }
  params.set('key', apiKey);
  const res = await fetch(`${BASE_URL}${path}?${params}`);
  if (!res.ok) {
    const text = await res.text();
    return { error: res.status, message: text };
  }
  return res.json();
}

function isErr(data: unknown): boolean {
  return typeof data === 'object' && data !== null && 'error' in (data as Record<string, unknown>);
}

// -- callTool dispatcher -----------------------------------------------------

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string;
  delete args._apiKey;

  switch (name) {
    case 'current':
      return current(args.q as string, args.aqi as boolean | undefined, apiKey);
    case 'forecast':
      return forecast(args.q as string, args.days as number | undefined, apiKey);
    case 'astronomy':
      return astronomy(args.q as string, args.dt as string | undefined, apiKey);
    case 'marine':
      return marine(args.q as string, args.days as number | undefined, apiKey);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// -- tool implementations ----------------------------------------------------

async function current(q: string, aqi: boolean | undefined, apiKey: string) {
  const params = new URLSearchParams({ q, aqi: aqi === false ? 'no' : 'yes' });
  const data = await weatherGet(apiKey, '/current.json', params);
  if (isErr(data)) return data;

  const location = data.location ?? {};
  const cur = data.current ?? {};
  return {
    location: {
      name: location.name,
      region: location.region,
      country: location.country,
      localtime: location.localtime,
    },
    current: {
      temp_c: cur.temp_c,
      temp_f: cur.temp_f,
      condition: cur.condition?.text,
      humidity: cur.humidity,
      wind_kph: cur.wind_kph,
      wind_dir: cur.wind_dir,
      feelslike_c: cur.feelslike_c,
      uv: cur.uv,
      air_quality: cur.air_quality ?? null,
    },
  };
}

async function forecast(q: string, days: number | undefined, apiKey: string) {
  const n = Math.min(10, Math.max(1, days ?? 3));
  const params = new URLSearchParams({ q, days: String(n) });
  const data = await weatherGet(apiKey, '/forecast.json', params);
  if (isErr(data)) return data;

  const location = data.location ?? {};
  const forecastday = data.forecast?.forecastday ?? [];
  return {
    location: {
      name: location.name,
      country: location.country,
      localtime: location.localtime,
    },
    forecast: forecastday.map((d: any) => ({
      date: d.date,
      maxtemp_c: d.day?.maxtemp_c,
      mintemp_c: d.day?.mintemp_c,
      condition: d.day?.condition?.text,
      daily_chance_of_rain: d.day?.daily_chance_of_rain,
      totalprecip_mm: d.day?.totalprecip_mm,
      sunrise: d.astro?.sunrise,
      sunset: d.astro?.sunset,
    })),
  };
}

async function astronomy(q: string, dt: string | undefined, apiKey: string) {
  const params = new URLSearchParams({ q });
  if (dt) params.set('dt', dt);
  const data = await weatherGet(apiKey, '/astronomy.json', params);
  if (isErr(data)) return data;

  const location = data.location ?? {};
  return {
    location: {
      name: location.name,
      country: location.country,
    },
    astronomy: data.astronomy?.astro,
  };
}

async function marine(q: string, days: number | undefined, apiKey: string) {
  const n = Math.min(7, Math.max(1, days ?? 1));
  const params = new URLSearchParams({ q, days: String(n) });
  const data = await weatherGet(apiKey, '/marine.json', params);
  if (isErr(data)) return data;

  const location = data.location ?? {};
  const forecastday = data.forecast?.forecastday ?? [];
  return {
    location: {
      name: location.name,
      country: location.country,
    },
    marine: forecastday.map((d: any) => ({
      date: d.date,
      maxtemp_c: d.day?.maxtemp_c,
      condition: d.day?.condition?.text,
      hours_sample: (d.hour ?? [])
        .filter((_: any, i: number) => i % 6 === 0)
        .map((h: any) => ({
          time: h.time,
          sig_ht_mt: h.sig_ht_mt,
          water_temp_c: h.water_temp_c,
          swell_ht_mt: h.swell_ht_mt,
          wind_kph: h.wind_kph,
        })),
    })),
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
