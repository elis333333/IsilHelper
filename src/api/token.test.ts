import { describe, expect, it } from "vitest";
import { extractTokenParam, parseLaunchToken, tokenFromRedirect } from "./token";

/** Fixtures anonimizados: ningún token real, ni siquiera caducado. */
const TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90"; // 32 hex, inventado
const SIGNATURE = "0123456789abcdef0123456789abcdef";
const PRIVATE = "fedcba9876543210fedcba9876543210";

/** Codifica sin relleno, que es como suele llegar. */
function encodeUnpadded(plain: string): string {
  return btoa(plain).replace(/=+$/, "");
}

describe("extractTokenParam", () => {
  it("saca el base64 de `esquema://token=…`, que no es un query string", () => {
    const result = extractTokenParam("isilhelper://token=QUJDZGVm");
    expect(result).toEqual({ ok: true, value: "QUJDZGVm" });
  });

  it("conserva las mayúsculas: el base64 las distingue", () => {
    const mixed = "AbCdEfGhIjK";
    const result = extractTokenParam(`isilhelper://token=${mixed}`);
    expect(result.ok && result.value).toBe(mixed);
  });

  it("también acepta la forma con query, por si cambiara", () => {
    const result = extractTokenParam("https://x/y?foo=1&token=QUJD&bar=2");
    expect(result.ok && result.value).toBe("QUJD");
  });

  it("falla si no hay token en la redirección (redirigió al login)", () => {
    const result = extractTokenParam("https://login.ecala.net/authenticationendpoint");
    expect(result).toEqual({ ok: false, error: { kind: "nomatch" } });
  });
});

describe("parseLaunchToken", () => {
  it("toma el segundo campo cuando vienen tres", () => {
    const base64 = encodeUnpadded(`${SIGNATURE}:::${TOKEN}:::${PRIVATE}`);
    expect(parseLaunchToken(base64)).toEqual({ ok: true, value: TOKEN });
  });

  it("funciona igual cuando falta el private_token y solo vienen dos", () => {
    const base64 = encodeUnpadded(`${SIGNATURE}:::${TOKEN}`);
    expect(parseLaunchToken(base64)).toEqual({ ok: true, value: TOKEN });
  });

  it("restaura el relleno que Moodle omite", () => {
    const plain = `${SIGNATURE}:::${TOKEN}`;
    const conRelleno = btoa(plain);
    const sinRelleno = conRelleno.replace(/=+$/, "");
    // El caso solo prueba algo si el relleno existía.
    expect(conRelleno).not.toBe(sinRelleno);
    expect(parseLaunchToken(sinRelleno)).toEqual({ ok: true, value: TOKEN });
  });

  it("rechaza el base64 entero usado como token", () => {
    const base64 = encodeUnpadded(`${SIGNATURE}:::${TOKEN}:::${PRIVATE}`);
    const result = parseLaunchToken(encodeUnpadded(base64));
    expect(result.ok).toBe(false);
  });

  it("rechaza un único campo sin separadores", () => {
    const result = parseLaunchToken(encodeUnpadded(TOKEN));
    expect(result).toEqual({ ok: false, error: { kind: "badformat", fields: 1 } });
  });

  it("rechaza un segundo campo que no son 32 hexadecimales", () => {
    const result = parseLaunchToken(encodeUnpadded(`${SIGNATURE}:::demasiado-corto`));
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.kind).toBe("badlength");
  });

  it("no confunde la cookie MoodleSession (26 alfanuméricos) con el token", () => {
    const cookieLike = "abcdefghijklmnopqrstuvwxyz";
    const result = parseLaunchToken(encodeUnpadded(`${SIGNATURE}:::${cookieLike}`));
    expect(result.ok).toBe(false);
  });

  it("rechaza lo que no es base64", () => {
    const result = parseLaunchToken("no-es-base64-!!!");
    expect(result.ok === false && result.error.kind).toBe("notbase64");
  });
});

describe("tokenFromRedirect", () => {
  it("hace el camino completo de la URL al token", () => {
    const base64 = encodeUnpadded(`${SIGNATURE}:::${TOKEN}:::${PRIVATE}`);
    expect(tokenFromRedirect(`isilhelper://token=${base64}`)).toEqual({
      ok: true,
      value: TOKEN,
    });
  });
});
