import { describe, it, expect } from "vitest";
import {
  scoreEvents,
  aggregateRegions,
  buildFunnel,
  tierFor,
  weightsFromParams,
  DEFAULT_WEIGHTS,
} from "./roi";
import type { EventMetrics } from "./types";

function metric(partial: Partial<EventMetrics>): EventMetrics {
  return {
    event_id: partial.event_id ?? "e",
    name: partial.name ?? "Event",
    type: partial.type ?? "career",
    city: partial.city ?? "Munich",
    country: partial.country ?? "Germany",
    region: partial.region ?? "Germany",
    lat: partial.lat ?? 48.1,
    lng: partial.lng ?? 11.5,
    start_date: partial.start_date ?? "2026-06-01",
    end_date: partial.end_date ?? "2026-06-01",
    cost: partial.cost ?? null,
    is_wuerth: partial.is_wuerth ?? true,
    new_users: partial.new_users ?? 0,
    total_connections: partial.total_connections ?? 0,
    total_simulations: partial.total_simulations ?? 0,
    avg_connections: partial.avg_connections ?? 0,
    avg_simulations: partial.avg_simulations ?? 0,
    users_connected: partial.users_connected ?? 0,
    users_simulated: partial.users_simulated ?? 0,
  };
}

describe("tierFor", () => {
  it("maps scores to tiers at the 33/66 boundaries", () => {
    expect(tierFor(80)).toBe("good");
    expect(tierFor(66)).toBe("good");
    expect(tierFor(50)).toBe("mid");
    expect(tierFor(33)).toBe("mid");
    expect(tierFor(10)).toBe("poor");
  });
});

describe("scoreEvents", () => {
  it("returns empty for no events", () => {
    expect(scoreEvents([])).toEqual([]);
  });

  it("scores a metric-saturating event 100 and an empty event 0", () => {
    const best = metric({
      event_id: "best",
      new_users: 100,
      avg_connections: 10,
      avg_simulations: 10,
    });
    const worst = metric({
      event_id: "worst",
      new_users: 0,
      avg_connections: 0,
      avg_simulations: 0,
    });
    const scored = scoreEvents([best, worst]);
    const b = scored.find((e) => e.event_id === "best")!;
    const w = scored.find((e) => e.event_id === "worst")!;
    expect(b.roi).toBe(100);
    expect(b.tier).toBe("good");
    expect(w.roi).toBe(0);
    expect(w.tier).toBe("poor");
  });

  it("scores absolutely, not relatively: a weak lone event stays low", () => {
    // Regression for the "ROI 100 for a single mediocre event" bug.
    const weak = metric({
      event_id: "weak",
      new_users: 49,
      avg_connections: 1.1,
      avg_simulations: 1.2,
    });
    const [scored] = scoreEvents([weak]);
    expect(scored.roi).toBeLessThan(50);
    expect(scored.tier).not.toBe("good");
  });

  it("respects weights — weighting only users tracks the user metric", () => {
    const a = metric({ event_id: "a", new_users: 100, avg_connections: 0, avg_simulations: 0 });
    const b = metric({ event_id: "b", new_users: 0, avg_connections: 100, avg_simulations: 100 });
    const scored = scoreEvents([a, b], { users: 1, connections: 0, simulations: 0 });
    expect(scored.find((e) => e.event_id === "a")!.roi).toBe(100);
    expect(scored.find((e) => e.event_id === "b")!.roi).toBe(0);
  });

  it("normalizes weights that do not sum to 1", () => {
    // Large sample + metrics well above benchmark => 100 regardless of weight scale.
    const a = metric({ event_id: "a", new_users: 500, avg_connections: 50, avg_simulations: 50 });
    const scored = scoreEvents([a], { users: 2, connections: 2, simulations: 2 });
    expect(scored[0].roi).toBe(100);
  });

  it("dampens tiny events and flags them as low data", () => {
    // 2 attendees who both engaged heavily must NOT score like a proven event.
    const tiny = metric({
      event_id: "tiny",
      new_users: 2,
      avg_connections: 5,
      avg_simulations: 5,
    });
    const [scored] = scoreEvents([tiny]);
    expect(scored.lowData).toBe(true);
    expect(scored.confidence).toBeLessThan(0.2);
    expect(scored.roi).toBeLessThan(20);
  });

  it("computes cost-adjusted value per euro only when cost is set", () => {
    const withCost = metric({
      event_id: "c",
      new_users: 10,
      total_connections: 20,
      total_simulations: 70,
      cost: 100,
    });
    const noCost = metric({ event_id: "n", new_users: 5 });
    const scored = scoreEvents([withCost, noCost]);
    expect(scored.find((e) => e.event_id === "c")!.valuePerEuro).toBeCloseTo(1.0);
    expect(scored.find((e) => e.event_id === "n")!.valuePerEuro).toBeNull();
  });

  it("scores a single event on absolute benchmarks (no NaN)", () => {
    // A healthy-sized event: new_users 80 (conf 0.8), conns 4, sims 4.
    // conf-shrunk conns = 4*.8=3.2 /4 = .8; users 80/100=.8 => all .8 => 80.
    const scored = scoreEvents([
      metric({ new_users: 80, avg_connections: 4, avg_simulations: 4 }),
    ]);
    expect(Number.isNaN(scored[0].roi)).toBe(false);
    expect(scored[0].roi).toBe(80);
  });
});

describe("buildFunnel", () => {
  it("produces strictly nested stages with conversion rates", () => {
    const [scored] = scoreEvents([
      metric({ new_users: 100, users_connected: 50, users_simulated: 20 }),
    ]);
    const funnel = buildFunnel(scored);
    expect(funnel.map((s) => s.value)).toEqual([100, 50, 20]);
    expect(funnel[1].conversion).toBeCloseTo(0.5); // 50 of 100
    expect(funnel[2].conversion).toBeCloseTo(0.4); // 20 of 50
    expect(funnel[2].ofSignups).toBeCloseTo(0.2); // 20 of 100
  });

  it("caps simulated users at the connected count", () => {
    const [scored] = scoreEvents([
      metric({ new_users: 30, users_connected: 10, users_simulated: 25 }),
    ]);
    const funnel = buildFunnel(scored);
    expect(funnel[2].value).toBe(10); // can't exceed the previous stage
  });
});

describe("aggregateRegions", () => {
  it("weights regional ROI by new users and ranks regions", () => {
    const de1 = metric({ event_id: "de1", region: "Germany", new_users: 90, avg_connections: 10, avg_simulations: 10 });
    const de2 = metric({ event_id: "de2", region: "Germany", new_users: 10, avg_connections: 0, avg_simulations: 0 });
    const fr = metric({ event_id: "fr", region: "France", new_users: 50, avg_connections: 5, avg_simulations: 5 });
    const scored = scoreEvents([de1, de2, fr]);
    const regions = aggregateRegions(scored);

    expect(regions).toHaveLength(2);
    const germany = regions.find((r) => r.region === "Germany")!;
    expect(germany.eventCount).toBe(2);
    expect(germany.totalNewUsers).toBe(100);
    // Member events ranked best-first.
    expect(germany.events[0].event_id).toBe("de1");
    // Regions sorted by ROI descending.
    expect(regions[0].roi).toBeGreaterThanOrEqual(regions[1].roi);
  });
});

describe("weightsFromParams", () => {
  it("falls back to defaults for missing/invalid params", () => {
    expect(weightsFromParams(new URLSearchParams(""))).toEqual(DEFAULT_WEIGHTS);
    expect(weightsFromParams(new URLSearchParams("wU=abc"))).toEqual(DEFAULT_WEIGHTS);
  });

  it("parses provided weights", () => {
    const w = weightsFromParams(new URLSearchParams("wU=0.5&wC=0.3&wS=0.2"));
    expect(w).toEqual({ users: 0.5, connections: 0.3, simulations: 0.2 });
  });
});
