# mcp-weatherapi

WeatherAPI.com MCP — wraps WeatherAPI.com (api.weatherapi.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `current` | Get current/real-time weather for a location, including temperature, condition, humidity, wind, UV, and air quality (AQI). Location can be a city name, "lat,lon", zip code, or IATA airport code. Example: current({ q: "London", aqi: true }). |
| `forecast` | Get a multi-day weather forecast for a location: daily high/low temperature, condition, chance of rain, total precipitation, and sunrise/sunset times. Up to 10 days. Example: forecast({ q: "Tokyo", days: 5 }). |
| `astronomy` | Get astronomy data for a location and date: sunrise, sunset, moonrise, moonset, moon phase, and moon illumination. Example: astronomy({ q: "Reykjavik", dt: "2026-06-21" }). |
| `marine` | Get marine/ocean conditions forecast for a coastal location: significant wave height, swell height, water temperature, and wind. Up to 7 days, sampled every 6 hours. Example: marine({ q: "33.7,-118.4", days: 2 }). |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "weatherapi": {
      "url": "https://gateway.pipeworx.io/weatherapi/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Weatherapi data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
