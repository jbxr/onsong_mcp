# Quickstart: OnSong MCP Server

Get the OnSong MCP Server running in under 5 minutes.

## Prerequisites

- **macOS** (Apple Silicon or Intel)
- **Node.js 20+** (`node --version` should show v20 or higher)
- **OnSong app** installed on iPad/iPhone/Mac on the same local network
- **OnSong Connect** enabled in OnSong settings

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/onsong-mcp.git
cd onsong-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Enable OnSong Connect

1. Open OnSong on your iPad/iPhone/Mac
2. Go to **Settings** (gear icon)
3. Navigate to **Utilities** > **OnSong Connect**
4. Toggle **Enable Connect** to ON
5. Note the displayed IP address and port

## Configure the MCP Server

Create the configuration directory and file:

```bash
mkdir -p ~/.config/onsong-mcp
```

Create `~/.config/onsong-mcp/config.json`:

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

Replace `192.168.1.100` with your OnSong device's IP address.

## Run the Server

### As a standalone process (for testing)

```bash
npm start
```

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "onsong": {
      "command": "node",
      "args": ["/path/to/onsong-mcp/dist/index.js"]
    }
  }
}
```

### With Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "onsong": {
      "command": "node",
      "args": ["/path/to/onsong-mcp/dist/index.js"]
    }
  }
}
```

## Verify Connection

In your MCP client, try:

1. **Discover devices**:
   ```
   Use the onsong.discover tool to find OnSong on my network
   ```

2. **Test connection**:
   ```
   Test connection to OnSong at 192.168.1.100:5076
   ```

3. **Get current state**:
   ```
   What song is currently displayed in OnSong?
   ```

## Example Commands

| Task | Command |
|------|---------|
| Find OnSong devices | "Discover OnSong devices on my network" |
| Get current song | "What's the current song in OnSong?" |
| Search library | "Search OnSong for songs by Eagles" |
| Next song | "Go to the next song in OnSong" |
| Open specific song | "Open 'Amazing Grace' in OnSong" |

## Enable Import (Optional)

To allow importing charts, update your config:

```json
{
  "enableImport": true
}
```

Then you can:
```
Import this ChordPro chart into OnSong: [chart content]
```

## Troubleshooting

### "No devices found"
- Ensure OnSong Connect is enabled
- Verify both devices are on the same network
- Check firewall settings (allow port 5076)

### "Connection refused"
- Verify the IP address and port are correct
- Ensure OnSong is running and not backgrounded
- Try restarting OnSong Connect

### "Not authenticated"
- The server will automatically register an auth token
- If issues persist, restart both the MCP server and OnSong

## Next Steps

- See [Configuration Guide](./docs/configuration.md) for advanced options
- See [API Reference](./docs/api.md) for all available tools
- See [Troubleshooting](./docs/troubleshooting.md) for common issues
