# mcp-weatherapi

WeatherAPI.com MCP — wraps WeatherAPI.com (api.weatherapi.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/weatherapi/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Weatherapi data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/current \
  -H 'Content-Type: application/json' \
  -d '{"q":"London","aqi":true}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/current`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
