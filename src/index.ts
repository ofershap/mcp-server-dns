import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  dnsLookup,
  reverseDns,
  resolveAll,
  checkNameservers,
  whoisLookup,
} from "./dns.js";

const recordTypeSchema = z
  .enum(["A", "AAAA", "MX", "TXT", "CNAME", "NS", "SOA", "SRV", "PTR"])
  .default("A");

const server = new McpServer({
  name: "mcp-server-dns",
  version: "1.0.0",
});

server.tool(
  "dns_lookup",
  "Look up DNS records for a domain. Returns A, AAAA, MX, TXT, NS, CNAME, SOA, SRV, or PTR records.",
  {
    domain: z.string().describe("Domain name to look up (e.g. example.com)"),
    type: recordTypeSchema.describe(
      "Record type: A, AAAA, MX, TXT, CNAME, NS, SOA, SRV, or PTR",
    ),
  },
  async ({ domain, type }) => {
    const result = await dnsLookup(domain, type);
    return { content: [{ type: "text" as const, text: result }] };
  },
);

server.tool(
  "reverse_dns",
  "Perform a reverse DNS (PTR) lookup on an IP address.",
  {
    ip: z.string().describe("IP address (e.g. 8.8.8.8)"),
  },
  async ({ ip }) => {
    const result = await reverseDns(ip);
    return { content: [{ type: "text" as const, text: result }] };
  },
);

server.tool(
  "resolve_all",
  "Resolve all common DNS record types (A, AAAA, MX, TXT, NS, CNAME) for a domain in one call.",
  {
    domain: z.string().describe("Domain name to resolve (e.g. example.com)"),
  },
  async ({ domain }) => {
    const result = await resolveAll(domain);
    return { content: [{ type: "text" as const, text: result }] };
  },
);

server.tool(
  "check_nameservers",
  "Get the nameserver (NS) records for a domain.",
  {
    domain: z.string().describe("Domain name (e.g. example.com)"),
  },
  async ({ domain }) => {
    const result = await checkNameservers(domain);
    return { content: [{ type: "text" as const, text: result }] };
  },
);

server.tool(
  "whois",
  "Query WHOIS data for a domain. Uses IANA and follows referrals to registrar WHOIS servers.",
  {
    domain: z.string().describe("Domain name for WHOIS (e.g. example.com)"),
  },
  async ({ domain }) => {
    const result = await whoisLookup(domain);
    return { content: [{ type: "text" as const, text: result }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
