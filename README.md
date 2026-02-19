# mcp-server-dns

[![npm version](https://img.shields.io/npm/v/mcp-server-dns.svg)](https://www.npmjs.com/package/mcp-server-dns)
[![npm downloads](https://img.shields.io/npm/dm/mcp-server-dns.svg)](https://www.npmjs.com/package/mcp-server-dns)
[![CI](https://github.com/ofershap/mcp-server-dns/actions/workflows/ci.yml/badge.svg)](https://github.com/ofershap/mcp-server-dns/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

DNS lookups, reverse DNS, WHOIS, and domain checks from your AI assistant — zero auth, zero config, powered by Node.js built-in DNS.

```bash
npx mcp-server-dns
```

> Works with Claude Desktop, Cursor, VS Code Copilot, and any MCP client. Zero auth required — uses Node.js built-in DNS module.

![Demo](assets/demo.gif)

## Tools

| Tool                | What it does                                           |
| ------------------- | ------------------------------------------------------ |
| `dns_lookup`        | Look up A, AAAA, MX, TXT, NS, CNAME, SOA, SRV, or PTR  |
| `reverse_dns`       | Perform reverse DNS (PTR) lookup on an IP address      |
| `resolve_all`       | Resolve A, AAAA, MX, TXT, NS, CNAME in one call        |
| `check_nameservers` | Get nameserver (NS) records for a domain               |
| `whois`             | Query WHOIS data (follows IANA referrals to registrar) |

## Quick Start

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "dns": {
      "command": "npx",
      "args": ["-y", "mcp-server-dns"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dns": {
      "command": "npx",
      "args": ["-y", "mcp-server-dns"]
    }
  }
}
```

### VS Code

Add to user settings or `.vscode/mcp.json`:

```json
{
  "mcp": {
    "servers": {
      "dns": {
        "command": "npx",
        "args": ["-y", "mcp-server-dns"]
      }
    }
  }
}
```

## Examples

- "What are the DNS records for example.com?"
- "Do a reverse DNS lookup on 8.8.8.8"
- "Show me the WHOIS info for github.com"
- "What nameservers does cloudflare.com use?"
- "Resolve all record types for google.com"

## Development

```bash
git clone https://github.com/ofershap/mcp-server-dns.git
cd mcp-server-dns
npm install
npm test
npm run build
```

## Author

**Ofer Shapira**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-ofershap-blue?logo=linkedin)](https://linkedin.com/in/ofershap)
[![GitHub](https://img.shields.io/badge/GitHub-ofershap-black?logo=github)](https://github.com/ofershap)

## License

MIT © 2026 Ofer Shapira
