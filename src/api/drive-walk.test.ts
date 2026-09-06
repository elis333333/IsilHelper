import { describe, expect, it } from "vitest";
import { walkFolder, walkSummary, type FolderReader, type WalkResult } from "./drive-walk";
import type { DriveEntry } from "./drive-folder";
import { err, ok } from "./result";
import type { DriveError } from "./drive";

/** Un árbol de mentira: `{ idDeCarpeta: [entradas] }`. */
type Tree = Record<string, DriveEntry[]>;

function file(id: string, name: string): DriveEntry {
  return { id, name, kind: "file", app: null, url: `https://drive.google.com/file/d/${id}/view` };
}

function folder(id: string, name: string): DriveEntry {
  return {
    id,
    name,
    kind: "folder",
    app: null,
    url: `https://drive.google.com/drive/folders/${id}`,
  };
}

/** Lector sobre el árbol, con carpetas que fallan a propósito. */
function reader(tree: Tree, broken: Record<string, DriveError> = {}): FolderReader {
  return (id) => {
    const failure = broken[id];
    if (failure !== undefined) return Promise.resolve(err(failure));
    const entries = tree[id];
    if (entries === undefined) return Promise.resolve(err({ kind: "http", status: 404 }));
    return Promise.resolve(ok({ ok: true as const, entries, folderName: id }));
  };
}

const paths = (result: WalkResult) =>
  result.files.map((found) => [...found.trail, found.name].join("/"));

describe("walkFolder", () => {
  it("devuelve los archivos de una carpeta plana", async () => {
    const result = await walkFolder("raiz", reader({ raiz: [file("f1", "a.pdf"), file("f2", "b.pdf")] }));

    expect(paths(result)).toEqual(["a.pdf", "b.pdf"]);
    expect(result.problems).toEqual([]);
    expect(result.truncated).toBe(false);
    expect(result.foldersRead).toBe(1);
  });

  it("baja por las subcarpetas y compone el camino", async () => {
    const result = await walkFolder(
      "raiz",
      reader({
        raiz: [file("f1", "sílabo.pdf"), folder("s1", "Semana 1")],
        s1: [file("f2", "guia.pdf"), folder("s2", "Anexos")],
        s2: [file("f3", "datos.sql")],
      }),
    );

    expect(paths(result)).toEqual([
      "sílabo.pdf",
      "Semana 1/guia.pdf",
      "Semana 1/Anexos/datos.sql",
    ]);
    expect(result.foldersRead).toBe(3);
  });

  // --- La rotura legible --------------------------------------------------

  it("NO omite en silencio una carpeta que falla: la cuenta como problema", async () => {
    const result = await walkFolder(
      "raiz",
      reader(
        {
          raiz: [folder("s1", "Semana 1"), folder("s2", "Semana 2")],
          s2: [file("f1", "b.pdf")],
        },
        { s1: { kind: "shape" } },
      ),
    );

    // El resto del recorrido sigue: un fallo suelto no tumba la tanda.
    expect(paths(result)).toEqual(["Semana 2/b.pdf"]);
    // Y lo que falló se dice, con su nombre para poder ir a mirarlo a mano.
    // El `trail` de una carpeta la incluye: es su ruta completa, que es lo
    // que hace falta para ir a mirarla a mano.
    expect(result.problems).toEqual([
      { folderId: "s1", name: "Semana 1", trail: ["Semana 1"], error: { kind: "shape" } },
    ]);
  });

  it("cuenta como problema la carpeta que Google ya no deja ver", async () => {
    const result = await walkFolder(
      "raiz",
      reader({ raiz: [folder("s1", "Vieja")] }, { s1: { kind: "http", status: 404 } }),
    );

    expect(result.problems[0]?.error).toEqual({ kind: "http", status: 404 });
  });

  it("avisa cuando para por profundidad, en vez de callar lo que falta", async () => {
    const result = await walkFolder(
      "raiz",
      reader({
        raiz: [folder("s1", "N1")],
        s1: [folder("s2", "N2")],
        s2: [file("f1", "hondo.pdf")],
      }),
      { maxDepth: 1, maxFolders: 100 },
    );

    expect(result.truncated).toBe(true);
    expect(paths(result)).toEqual([]);
  });

  it("avisa cuando para por número de carpetas", async () => {
    const result = await walkFolder(
      "raiz",
      reader({
        raiz: [folder("s1", "A"), folder("s2", "B")],
        s1: [file("f1", "a.pdf")],
        s2: [file("f2", "b.pdf")],
      }),
      { maxDepth: 8, maxFolders: 2 },
    );

    expect(result.truncated).toBe(true);
    expect(result.foldersRead).toBe(2);
  });

  it("no da vueltas cuando un atajo apunta a una carpeta de más arriba", async () => {
    // Drive permite atajos, así que el árbol puede tener ciclos.
    const result = await walkFolder(
      "raiz",
      reader({
        raiz: [folder("s1", "Semana 1")],
        s1: [folder("raiz", "atajo a la raíz"), file("f1", "a.pdf")],
      }),
    );

    expect(paths(result)).toEqual(["Semana 1/a.pdf"]);
    expect(result.foldersRead).toBe(2);
  });

  it("no repite un archivo enlazado desde dos carpetas", async () => {
    const result = await walkFolder(
      "raiz",
      reader({
        raiz: [folder("s1", "A"), folder("s2", "B")],
        s1: [file("f1", "compartido.pdf")],
        s2: [file("f1", "compartido.pdf")],
      }),
    );

    expect(result.files).toHaveLength(1);
  });

  it("usa el id como nombre de carpeta cuando Drive no dio ninguno", async () => {
    const anonymous: DriveEntry = { ...folder("s1", "x"), name: null };
    const result = await walkFolder(
      "raiz",
      reader({ raiz: [anonymous], s1: [file("f1", "a.pdf")] }),
    );

    // Feo pero recuperable, y mejor que meter bajo "sin nombre" todo lo que
    // Drive no supo nombrar.
    expect(paths(result)).toEqual(["s1/a.pdf"]);
  });

  it("conserva el tipo de los documentos nativos, que se exportan y no se bajan", async () => {
    const native: DriveEntry = {
      id: "d1",
      name: "Apuntes",
      kind: "native",
      app: "document",
      url: "https://docs.google.com/document/d/d1/edit",
    };
    const result = await walkFolder("raiz", reader({ raiz: [native] }));

    expect(result.files[0]).toMatchObject({ kind: "native", app: "document" });
  });
});

describe("walkSummary", () => {
  const base: WalkResult = { files: [], problems: [], truncated: false, foldersRead: 1 };

  it("cuenta lo encontrado", () => {
    expect(walkSummary({ ...base, files: [{ id: "1", name: "a", kind: "file", app: null, trail: [] }] }))
      .toBe("Encontré 1 archivo.");
  });

  it("nunca calla las carpetas que no pudo leer", () => {
    const summary = walkSummary({
      ...base,
      problems: [{ folderId: "s1", name: "A", trail: [], error: { kind: "shape" } }],
    });
    expect(summary).toContain("no pude leer");
  });

  it("dice que puede faltar material cuando paró antes de tiempo", () => {
    expect(walkSummary({ ...base, truncated: true })).toContain("puede faltar material");
  });
});
