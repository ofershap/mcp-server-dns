import dns from "node:dns/promises";
import net from "node:net";

export type RecordType =
  | "A"
  | "AAAA"
  | "MX"
  | "TXT"
  | "CNAME"
  | "NS"
  | "SOA"
  | "SRV"
  | "PTR";

interface MxRecord {
  exchange: string;
  priority: number;
}

interface SoaRecord {
  nsname: string;
  hostmaster: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minttl: number;
}

interface SrvRecord {
  priority: number;
  weight: number;
  port: number;
  name: string;
}

function whoisQuery(host: string, domain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: 43 }, () => {
      socket.write(`${domain}\r\n`, () => {
        socket.end();
      });
    });

    const chunks: Buffer[] = [];
    socket.on("data", (chunk: Buffer) => chunks.push(chunk));
    socket.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });
    socket.on("error", reject);
    socket.setTimeout(10000, () => {
      socket.destroy(new Error("WHOIS query timed out"));
    });
  });
}

export async function dnsLookup(
  domain: string,
  type: RecordType,
): Promise<string> {
  const records = await dns.resolve(domain, type);

  switch (type) {
    case "MX": {
      const mx = records as MxRecord[];
      if (mx.length === 0) return "No MX records found.";
      return mx
        .sort((a, b) => a.priority - b.priority)
        .map((r) => `${r.priority}  ${r.exchange}`)
        .join("\n");
    }
    case "TXT": {
      const txt = records as string[][];
      if (txt.length === 0) return "No TXT records found.";
      return txt.map((entries) => entries.join("")).join("\n");
    }
    case "SOA": {
      const soa = records as SoaRecord[];
      const s = soa[0];
      if (!s) return "No SOA record found.";
      return [
        `nsname:    ${s.nsname}`,
        `hostmaster: ${s.hostmaster}`,
        `serial:    ${s.serial}`,
        `refresh:   ${s.refresh}`,
        `retry:     ${s.retry}`,
        `expire:    ${s.expire}`,
        `minttl:    ${s.minttl}`,
      ].join("\n");
    }
    case "SRV": {
      const srv = records as SrvRecord[];
      if (srv.length === 0) return "No SRV records found.";
      return srv
        .map((r) => `${r.priority} ${r.weight} ${r.port} ${r.name}`)
        .join("\n");
    }
    default: {
      const arr = records as string[];
      if (arr.length === 0) return `No ${type} records found.`;
      return arr.join("\n");
    }
  }
}

export async function reverseDns(ip: string): Promise<string> {
  const hostnames = await dns.reverse(ip);
  return hostnames.length > 0 ? hostnames.join("\n") : "No PTR records found.";
}

export async function resolveAll(domain: string): Promise<string> {
  const types: { name: string; type: RecordType }[] = [
    { name: "A", type: "A" },
    { name: "AAAA", type: "AAAA" },
    { name: "MX", type: "MX" },
    { name: "TXT", type: "TXT" },
    { name: "NS", type: "NS" },
    { name: "CNAME", type: "CNAME" },
  ];

  const results: string[] = [];
  for (const { name, type } of types) {
    try {
      const records = await dnsLookup(domain, type);
      results.push(`=== ${name} ===\n${records}`);
    } catch {
      results.push(`=== ${name} ===\n(no records or error)`);
    }
  }
  return results.join("\n\n");
}

export async function checkNameservers(domain: string): Promise<string> {
  const nameservers = await dns.resolveNs(domain);
  return nameservers.length > 0
    ? nameservers.join("\n")
    : "No nameserver records found.";
}

export async function whoisLookup(domain: string): Promise<string> {
  let response = await whoisQuery("whois.iana.org", domain);

  const referMatch =
    response.match(/^refer:\s*(\S+)/im) ??
    response.match(/^ReferralServer:\s*whois:\/\/(\S+)/im);
  if (referMatch && referMatch[1]) {
    const referralHost = referMatch[1].trim();
    if (referralHost && !referralHost.startsWith("http")) {
      response = await whoisQuery(referralHost, domain);
    }
  }

  return response.trim() || "No WHOIS data returned.";
}
