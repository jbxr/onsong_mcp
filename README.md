# OnSong MCP Server

An MCP (Model Context Protocol) server that enables LLM clients to interact with the [OnSong](https://onsongapp.com/) app via its local network REST API and URL schemes.

## Features

- **Device Discovery** - Automatically find OnSong instances on your local network via mDNS/Bonjour
- **Song Search** - Search your OnSong library by title, artist, keywords, or lyrics
- **State Management** - Get current song, set, and playback position
- **Navigation** - Open songs and sets, trigger actions (next/previous song, scroll, etc.)
- **Import/Export** - Import ChordPro charts and export songs in various formats
- **Set Management** - List, create, and manage sets

## Requirements

- **Node.js 20+**
- **OnSong app** (iPad/iPhone/Mac) with **OnSong Connect** enabled
- Both devices on the same local network

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/your-org/onsong-mcp.git
cd onsong-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Global Installation (after building)

```bash
npm link
```

This makes the `onsong-mcp` command available globally.

## Configuration

### OnSong Setup

1. Open OnSong on your iPad/iPhone/Mac
2. Go to **Settings** (gear icon) > **Utilities** > **OnSong Connect**
3. Toggle **Enable Connect** to ON
4. Note the displayed IP address and port (default: 5076)

### Server Configuration

Create a configuration file at `~/.config/onsong-mcp/config.json`:

```bash
mkdir -p ~/.config/onsong-mcp
```

```json
{
  "defaultTarget": {
    "host": "192.168.1.100",
    "port": 5076
  },
  "enableImport": false,
  "logLevel": "info"
}
```

| Option               | Type     | Default  | Description                                          |
| -------------------- | -------- | -------- | ---------------------------------------------------- |
| `defaultTarget`      | object   | -        | Default OnSong device connection                     |
| `defaultTarget.host` | string   | -        | IP address of OnSong device                          |
| `defaultTarget.port` | number   | 5076     | Port number                                          |
| `enableImport`       | boolean  | `false`  | Allow importing charts (security feature)            |
| `logLevel`           | string   | `"info"` | Log level: `error`, `warn`, `info`, `debug`, `trace` |
| `allowedHosts`       | string[] | `[]`     | Restrict connections to specific hosts               |
| `callbackPort`       | number   | `9876`   | Port for URL scheme callbacks                        |
| `dryRun`             | boolean  | `false`  | Log actions without executing                        |

## Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "onsong": {
      "command": "node",
      "args": ["/absolute/path/to/onsong-mcp/dist/index.js"]
    }
  }
}
```

Or if installed globally via `npm link`:

```json
{
  "mcpServers": {
    "onsong": {
      "command": "onsong-mcp"
    }
  }
}
```

Restart Claude Desktop after updating the configuration.

### Claude Code (CLI)

Add to your project's `.mcp.json` or global `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "onsong": {
      "command": "node",
      "args": ["/absolute/path/to/onsong-mcp/dist/index.js"]
    }
  }
}
```

Or using the CLI:

```bash
claude mcp add onsong node /absolute/path/to/onsong-mcp/dist/index.js
```

### Cursor

Add to your Cursor MCP settings (Settings > MCP):

```json
{
  "mcpServers": {
    "onsong": {
      "command": "node",
      "args": ["/absolute/path/to/onsong-mcp/dist/index.js"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "onsong": {
      "command": "node",
      "args": ["/absolute/path/to/onsong-mcp/dist/index.js"]
    }
  }
}
```

### VS Code with Continue

Add to `.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "node",
          "args": ["/absolute/path/to/onsong-mcp/dist/index.js"]
        }
      }
    ]
  }
}
```

## Running Standalone

For testing or debugging:

```bash
# After building
npm start

# Or in development mode (no build required)
npm run dev

# With options
npm start -- --dry-run --log-level debug
```

## Available Tools

| Tool                   | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `onsong.discover`      | Find OnSong devices on the local network            |
| `onsong.connect.test`  | Test connection to an OnSong device                 |
| `onsong.state.get`     | Get current song, set, and position                 |
| `onsong.search`        | Search the song library                             |
| `onsong.action.run`    | Trigger OnSong actions (next song, scroll, etc.)    |
| `onsong.open`          | Open a specific song or set                         |
| `onsong.import`        | Import a chart file (requires `enableImport: true`) |
| `onsong.export`        | Export songs in various formats                     |
| `onsong.sets.list`     | List all sets                                       |
| `onsong.sets.get`      | Get details of a specific set                       |
| `onsong.sets.create`   | Create a new set                                    |
| `onsong.sets.add_song` | Add a song to a set                                 |

## Example Usage

Once configured, you can interact with OnSong through your LLM client:

> "Discover OnSong devices on my network"

> "What song is currently displayed in OnSong?"

> "Search OnSong for songs by Eagles"

> "Go to the next song"

> "Open 'Amazing Grace' in OnSong"

> "Create a new set called 'Sunday Service'"

## Troubleshooting

### "No devices found"

- Ensure OnSong Connect is enabled in OnSong settings
- Verify both devices are on the same network
- Check firewall settings (allow port 5076 and mDNS)
- Try specifying the host/port directly instead of discovery

### "Connection refused"

- Verify the IP address and port are correct
- Ensure OnSong is running (not backgrounded on iOS)
- Try restarting OnSong Connect

### "Not authenticated"

- The server automatically registers auth tokens
- If issues persist, restart both the MCP server and OnSong
- Check if `allowedHosts` in config is restricting connections

### Server not appearing in Claude Desktop

- Ensure the path in the config is absolute
- Check Claude Desktop logs for errors
- Verify Node.js 20+ is installed: `node --version`
- Restart Claude Desktop after config changes

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint and type check
npm run check

# Build for production
npm run build
```

## License

MIT
