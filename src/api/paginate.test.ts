import { describe, expect, it, vi } from "vitest";
import { collectPages, type Page } from "./paginate";
import { err, ok, type Result } from "./result";
import type { ApiError } from "./errors";

const PAGE = 3;

/** Devuelve páginas de `PAGE` elementos a partir de una lista completa. */
function pager(all: number[]) {
  return vi.fn(async (after: number | undefined): Promise<Result<Page<number>, ApiError>> => {
    const start = after === undefined ? 0 : all.indexOf(after) + 1;
    const items = all.slice(start, start + PAGE);
    return ok({ items, lastId: items.at(-1) });
  });
}

describe("collectPages", () => {
  it("junta todas las páginas hasta que una viene incompleta", async () => {
    const all = [1, 2, 3, 4, 5, 6, 7];
    const result = await collectPages(pager(all), PAGE, 10);
    expect(result.items).toEqual(all);
    expect(result.pages).toBe(3);
    expect(result.complete).toBe(true);
  });

  it("una sola página incompleta no pide más", async () => {
    const fetchPage = pager([1, 2]);
    const result = await collectPages(fetchPage, PAGE, 10);
    expect(result.items).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("pasa el cursor de la página anterior", async () => {
    const fetchPage = pager([1, 2, 3, 4, 5]);
    await collectPages(fetchPage, PAGE, 10);
    expect(fetchPage.mock.calls.map(([after]) => after)).toEqual([undefined, 3]);
  });

  it("se detiene en el tope de páginas y lo marca como incompleto", async () => {
    const all = Array.from({ length: 30 }, (_, i) => i + 1);
    const result = await collectPages(pager(all), PAGE, 2);
    expect(result.pages).toBe(2);
    expect(result.items).toHaveLength(6);
    expect(result.complete).toBe(false);
  });

  it("no gira en el sitio si el cursor se repite", async () => {
    // Un servidor que devuelve siempre el mismo lastId colgaría el bucle.
    const fetchPage = vi.fn(async (): Promise<Result<Page<number>, ApiError>> =>
      ok({ items: [1, 2, 3], lastId: 99 }),
    );
    const result = await collectPages(fetchPage, PAGE, 10);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(result.complete).toBe(true);
  });

  it("sin lastId para en vez de repetir la primera página", async () => {
    const fetchPage = vi.fn(async (): Promise<Result<Page<number>, ApiError>> =>
      ok({ items: [1, 2, 3], lastId: undefined }),
    );
    const result = await collectPages(fetchPage, PAGE, 10);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(result.items).toEqual([1, 2, 3]);
  });

  it("devuelve lo ya reunido cuando una página falla, marcándolo parcial", async () => {
    let call = 0;
    const fetchPage = vi.fn(async (): Promise<Result<Page<number>, ApiError>> => {
      call += 1;
      if (call === 1) return ok({ items: [1, 2, 3], lastId: 3 });
      return err<ApiError>({ kind: "waf", attempts: 4 });
    });
    const result = await collectPages(fetchPage, PAGE, 10);
    expect(result.items).toEqual([1, 2, 3]);
    expect(result.complete).toBe(false);
    expect(result.error).toEqual({ kind: "waf", attempts: 4 });
  });

  it("si falla la primera página no devuelve nada y sí el error", async () => {
    const fetchPage = vi.fn(async (): Promise<Result<Page<number>, ApiError>> =>
      err<ApiError>({ kind: "network", detail: "sin red" }),
    );
    const result = await collectPages(fetchPage, PAGE, 10);
    expect(result.items).toEqual([]);
    expect(result.complete).toBe(false);
    expect(result.error?.kind).toBe("network");
  });
});
