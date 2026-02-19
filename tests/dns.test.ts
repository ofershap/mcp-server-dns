import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResolve = vi.fn();
const mockReverse = vi.fn();
const mockResolveNs = vi.fn();

vi.mock("node:dns/promises", () => ({
  default: {
    resolve: (...args: unknown[]) => mockResolve(...args),
    reverse: (...args: unknown[]) => mockReverse(...args),
    resolveNs: (...args: unknown[]) => mockResolveNs(...args),
  },
}));

let storedDataHandler: ((chunk: Buffer) => void) | undefined;
let storedEndHandler: (() => void) | undefined;

vi.mock("node:net", () => ({
  default: {
    createConnection: vi.fn(
      (_options: { host: string; port: number }, cb: () => void) => {
        const socket = {
          write: vi.fn((_data: string, writeCb?: () => void) => {
            if (writeCb) writeCb();
            socket.end();
          }),
          end: vi.fn(() => {
            if (storedDataHandler) {
              storedDataHandler(Buffer.from("mock whois data\n"));
            }
            if (storedEndHandler) {
              storedEndHandler();
            }
          }),
          on: vi.fn((event: string, handler: (chunk?: Buffer) => void) => {
            if (event === "data")
              storedDataHandler = handler as (chunk: Buffer) => void;
            if (event === "end") storedEndHandler = handler as () => void;
            return socket;
          }),
          setTimeout: vi.fn(),
        };
        setImmediate(() => cb());
        return socket;
      },
    ),
  },
}));

import {
  dnsLookup,
  reverseDns,
  resolveAll,
  checkNameservers,
  whoisLookup,
} from "../src/dns.js";

beforeEach(() => {
  vi.clearAllMocks();
  storedDataHandler = undefined;
  storedEndHandler = undefined;
});

describe("dnsLookup", () => {
  it("formats A records", async () => {
    mockResolve.mockResolvedValue(["93.184.216.34"]);
    const result = await dnsLookup("example.com", "A");
    expect(mockResolve).toHaveBeenCalledWith("example.com", "A");
    expect(result).toBe("93.184.216.34");
  });

  it("formats MX records with priority and exchange", async () => {
    mockResolve.mockResolvedValue([
      { exchange: "mail.example.com", priority: 10 },
      { exchange: "mail2.example.com", priority: 20 },
    ]);
    const result = await dnsLookup("example.com", "MX");
    expect(result).toContain("10  mail.example.com");
    expect(result).toContain("20  mail2.example.com");
  });

  it("formats TXT records", async () => {
    mockResolve.mockResolvedValue([["v=spf1 include:_spf.example.com"]]);
    const result = await dnsLookup("example.com", "TXT");
    expect(result).toContain("v=spf1");
  });
});

describe("reverseDns", () => {
  it("returns hostnames for IP", async () => {
    mockReverse.mockResolvedValue(["dns.google"]);
    const result = await reverseDns("8.8.8.8");
    expect(mockReverse).toHaveBeenCalledWith("8.8.8.8");
    expect(result).toBe("dns.google");
  });

  it("returns message when no PTR records", async () => {
    mockReverse.mockResolvedValue([]);
    const result = await reverseDns("1.2.3.4");
    expect(result).toBe("No PTR records found.");
  });
});

describe("resolveAll", () => {
  it("resolves multiple record types", async () => {
    mockResolve
      .mockResolvedValueOnce(["93.184.216.34"])
      .mockResolvedValueOnce(["2606:2800:220:1:248:1893:25c8:1946"])
      .mockResolvedValueOnce([{ exchange: "mail.example.com", priority: 10 }])
      .mockResolvedValueOnce([["v=spf1"]])
      .mockResolvedValueOnce(["ns1.example.com"])
      .mockRejectedValueOnce(new Error("no CNAME"));

    const result = await resolveAll("example.com");
    expect(result).toContain("=== A ===");
    expect(result).toContain("93.184.216.34");
    expect(result).toContain("=== AAAA ===");
    expect(result).toContain("=== MX ===");
    expect(result).toContain("=== TXT ===");
    expect(result).toContain("=== NS ===");
    expect(result).toContain("=== CNAME ===");
    expect(result).toContain("(no records or error)");
  });
});

describe("checkNameservers", () => {
  it("returns nameservers for domain", async () => {
    mockResolveNs.mockResolvedValue([
      "ns1.cloudflare.com",
      "ns2.cloudflare.com",
    ]);
    const result = await checkNameservers("cloudflare.com");
    expect(mockResolveNs).toHaveBeenCalledWith("cloudflare.com");
    expect(result).toContain("ns1.cloudflare.com");
    expect(result).toContain("ns2.cloudflare.com");
  });
});

describe("whoisLookup", () => {
  it("returns WHOIS data from IANA response", async () => {
    const result = await whoisLookup("example.com");
    expect(result).toContain("mock whois data");
  });
});
