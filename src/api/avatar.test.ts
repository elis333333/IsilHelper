import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAvatar } from "./avatar";
import { resetThrottle, type WebServiceDeps } from "./client";

const TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90"; // inventado, 32 hex
const URL_FOTO = "https://platform.ecala.net/webservice/pluginfile.php/6/user/icon/boost/f1";

/** Un PNG de un píxel. Sirve para comprobar que el `data:` sale bien formado
 *  sin meter un binario de verdad en el repositorio. */
const PIXEL = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function image(bytes: Uint8Array, type = "image/png"): Response {
  return new Response(bytes.buffer as ArrayBuffer, {
    status: 200,
    headers: { "Content-Type": type },
  });
}

/** Guarda la URL pedida además de responder: es lo que hace falta para
 *  comprobar dónde acaba el token. */
function makeDeps(response: Response | Error) {
  const calls: string[] = [];
  const doble = vi.fn(async (input: unknown) => {
    calls.push(String(input));
    if (response instanceof Error) throw response;
    return response;
  });
  const deps: WebServiceDeps = {
    fetch: doble as unknown as typeof globalThis.fetch,
    sleep: async () => undefined,
    now: () => 0,
  };
  return { deps, calls };
}

beforeEach(() => {
  resetThrottle();
});

describe("fetchAvatar", () => {
  it("pega el token a la URL y devuelve la foto como data:", async () => {
    const { deps, calls } = makeDeps(image(PIXEL));
    const result = await fetchAvatar(URL_FOTO, TOKEN, deps);

    expect(result).toEqual({ ok: true, value: "data:image/png;base64,iVBORw0KGgo=" });
    expect(calls[0]).toBe(`${URL_FOTO}?token=${TOKEN}`);
  });

  it("usa & cuando la URL ya trae parámetros", async () => {
    const { deps, calls } = makeDeps(image(PIXEL));
    await fetchAvatar(`${URL_FOTO}?rev=4821`, TOKEN, deps);

    expect(calls[0]).toBe(`${URL_FOTO}?rev=4821&token=${TOKEN}`);
  });

  it("rechaza el HTML de login que Moodle sirve con estado 200", async () => {
    // El fallo que no avisa: sin esto, el `<img>` sale roto y nadie sabe por qué.
    const { deps } = makeDeps(
      new Response("<html>login</html>", {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );
    const result = await fetchAvatar(URL_FOTO, TOKEN, deps);

    expect(result).toEqual({
      ok: false,
      error: { kind: "unexpected", status: 200, contentType: "text/html; charset=utf-8" },
    });
  });

  it("descarta una imagen desproporcionada para un avatar", async () => {
    const { deps } = makeDeps(image(new Uint8Array(256 * 1024 + 1)));
    const result = await fetchAvatar(URL_FOTO, TOKEN, deps);

    expect(result.ok).toBe(false);
  });

  it("descarta una respuesta vacía", async () => {
    const { deps } = makeDeps(image(new Uint8Array(0)));
    expect((await fetchAvatar(URL_FOTO, TOKEN, deps)).ok).toBe(false);
  });

  it("distingue el 418 del WAF", async () => {
    const { deps } = makeDeps(new Response("", { status: 418 }));
    const result = await fetchAvatar(URL_FOTO, TOKEN, deps);

    expect(result).toEqual({ ok: false, error: { kind: "waf", attempts: 1 } });
  });

  it("no deja que el token se cuele en el mensaje de un fallo de red", async () => {
    // El detalle del error es lo único que podría arrastrar la URL —y con ella
    // el token— hasta un mensaje. Se descarta a propósito.
    const { deps } = makeDeps(new TypeError(`Failed to fetch ${URL_FOTO}?token=${TOKEN}`));
    const result = await fetchAvatar(URL_FOTO, TOKEN, deps);

    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain(TOKEN);
  });
});
