import { beforeEach, describe, expect, it, vi } from "vitest";
import { callWebService, resetThrottle, type WebServiceDeps } from "./client";
import { MAX_RETRIES, PAUSE_MS } from "../lib/constants";

const TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90"; // inventado, 32 hex

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Dobles: las esperas no son reales y el reloj avanza con ellas, así que la
 *  pausa entre peticiones se puede comprobar sin que el test tarde. */
function makeDeps(responses: Array<Response | Error>) {
  const sleeps: number[] = [];
  let clock = 0;
  const queue = [...responses];

  const fetchMock = vi.fn(async () => {
    const next = queue.shift();
    if (next === undefined) throw new Error("el test no preparó más respuestas");
    if (next instanceof Error) throw next;
    return next;
  });

  const deps: WebServiceDeps = {
    fetch: fetchMock as unknown as typeof globalThis.fetch,
    sleep: async (ms) => {
      sleeps.push(ms);
      clock += ms;
    },
    now: () => clock,
  };
  return { deps, sleeps, fetchMock };
}

beforeEach(() => {
  resetThrottle();
});

describe("callWebService", () => {
  it("devuelve el valor cuando la respuesta es buena", async () => {
    const { deps } = makeDeps([json({ userid: 42, username: "cXXXXXXX" })]);
    const result = await callWebService<{ userid: number }>(
      TOKEN, "core_webservice_get_site_info", {}, deps,
    );
    expect(result).toEqual({ ok: true, value: { userid: 42, username: "cXXXXXXX" } });
  });

  it("detecta `exception` aunque el estado sea 200", async () => {
    const { deps, fetchMock } = makeDeps([
      json({
        exception: "moodle_exception",
        errorcode: "invalidtoken",
        message: "Ficha (token) no válida - ficha no encontrada",
      }),
    ]);
    const result = await callWebService(TOKEN, "core_webservice_get_site_info", {}, deps);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toEqual({
      kind: "moodle",
      errorcode: "invalidtoken",
      message: "Ficha (token) no válida - ficha no encontrada",
    });
    // Un error no se reintenta: es una respuesta válida de Moodle.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ante un 418 espera cada vez más y no dispara en ráfaga", async () => {
    const bloqueos = Array.from({ length: MAX_RETRIES }, () => new Response("", { status: 418 }));
    const { deps, sleeps, fetchMock } = makeDeps(bloqueos);

    const result = await callWebService(TOKEN, "core_webservice_get_site_info", {}, deps);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toEqual({ kind: "waf", attempts: MAX_RETRIES });
    expect(fetchMock).toHaveBeenCalledTimes(MAX_RETRIES);

    // Las esperas del WAF son crecientes: 5 s, 10 s, 15 s, 20 s.
    const wafWaits = sleeps.filter((ms) => ms >= 5_000);
    expect(wafWaits).toEqual([5_000, 10_000, 15_000, 20_000]);
  });

  it("se recupera si el 418 pasa y la siguiente respuesta es buena", async () => {
    const { deps, fetchMock } = makeDeps([
      new Response("", { status: 418 }),
      json({ userid: 7 }),
    ]);
    const result = await callWebService<{ userid: number }>(
      TOKEN, "core_webservice_get_site_info", {}, deps,
    );
    expect(result).toEqual({ ok: true, value: { userid: 7 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("respeta la pausa mínima entre peticiones", async () => {
    const { deps, sleeps } = makeDeps([json({ a: 1 }), json({ b: 2 })]);
    await callWebService(TOKEN, "f1", {}, deps);
    await callWebService(TOKEN, "f2", {}, deps);
    expect(sleeps.some((ms) => ms === PAUSE_MS)).toBe(true);
  });

  it("no intenta parsear el HTML de login que Moodle sirve con estado 200", async () => {
    const html = new Response("<html><body>login</body></html>", {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
    const { deps } = makeDeps([html]);
    const result = await callWebService(TOKEN, "core_webservice_get_site_info", {}, deps);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.kind).toBe("unexpected");
  });

  it("reintenta ante un fallo de red y acaba informando de red", async () => {
    const fallos = Array.from({ length: MAX_RETRIES }, () => new TypeError("Failed to fetch"));
    const { deps, fetchMock } = makeDeps(fallos);
    const result = await callWebService(TOKEN, "core_webservice_get_site_info", {}, deps);

    expect(fetchMock).toHaveBeenCalledTimes(MAX_RETRIES);
    expect(result.ok === false && result.error.kind).toBe("network");
  });

  it("manda el token en el cuerpo y nunca en la URL, sin credenciales", async () => {
    const { deps, fetchMock } = makeDeps([json({ ok: 1 })]);
    await callWebService(TOKEN, "core_enrol_get_users_courses", { userid: 42 }, deps);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain(TOKEN);
    expect(url).not.toContain("wstoken");
    expect(init.credentials).toBe("omit");

    const body = init.body as URLSearchParams;
    expect(body.get("wstoken")).toBe(TOKEN);
    expect(body.get("wsfunction")).toBe("core_enrol_get_users_courses");
    expect(body.get("moodlewsrestformat")).toBe("json");
    expect(body.get("userid")).toBe("42");
  });
});
