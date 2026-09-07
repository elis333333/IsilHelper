import { describe, expect, it } from "vitest";
import { driveFileName, exploreCourseDrive, type DriveLinkInput } from "./drive";
import type { DriveEntry } from "../api/drive-folder";
import type { FolderReader, FoundFile } from "../api/drive-walk";
import type { DriveError } from "../api/drive";
import { err, ok } from "../api/result";
import { drivePath } from "../lib/paths";

const found = (patch: Partial<FoundFile>): FoundFile => ({
  id: "1AbC",
  name: "guia.pdf",
  kind: "file",
  app: null,
  trail: [],
  ...patch,
});

describe("driveFileName", () => {
  it("deja el nombre tal cual en un binario, que ya trae extensión", () => {
    expect(driveFileName(found({}))).toBe("guia.pdf");
  });

  it("añade la extensión a un documento nativo, que no la trae", () => {
    // Un Google Doc se llama "Apuntes", sin más, y se exporta a PDF. Sin la
    // extensión no abre con doble clic.
    expect(driveFileName(found({ name: "Apuntes", kind: "native", app: "document" }))).toBe(
      "Apuntes.pdf",
    );
    expect(driveFileName(found({ name: "Notas", kind: "native", app: "spreadsheet" }))).toBe(
      "Notas.xlsx",
    );
    expect(
      driveFileName(found({ name: "Sesión 1", kind: "native", app: "presentation" })),
    ).toBe("Sesión 1.pdf");
  });

  it("no duplica la extensión si el nombre ya la trae", () => {
    expect(
      driveFileName(found({ name: "Informe.pdf", kind: "native", app: "document" })),
    ).toBe("Informe.pdf");
  });

  it("cae al identificador cuando Drive no dio nombre", () => {
    expect(driveFileName(found({ name: null }))).toBe("1AbC");
  });
});

describe("drivePath", () => {
  const base = {
    courseName: "Base de Datos II",
    sectionName: "Contenidos",
    moduleName: "T01 - Introducción",
    filename: "silabo.pdf",
  };

  it("mete el tema siempre, que es como el estudiante reconoce el material", () => {
    expect(drivePath({ ...base, trail: [] })).toBe(
      "IsilHelper/Base de Datos II/Contenidos/T01 - Introducción/silabo.pdf",
    );
  });

  it("reproduce debajo el árbol propio de Drive", () => {
    expect(drivePath({ ...base, trail: ["Semana 3", "Anexos"] })).toBe(
      "IsilHelper/Base de Datos II/Contenidos/T01 - Introducción/Semana 3/Anexos/silabo.pdf",
    );
  });

  it("sanea cada segmento del camino, que viene de nombres de Drive", () => {
    // El separador se sustituye antes de quitar los puntos del principio, así
    // que `../etc` acaba en `-etc`. Feo, pero es lo que importa: no queda
    // ningún `..` y la ruta no sube de carpeta.
    const path = drivePath({ ...base, trail: ["../etc", "Semana 3/4"] });
    expect(path.includes("..")).toBe(false);
    expect(path.startsWith("IsilHelper/")).toBe(true);
    expect(path).toBe(
      "IsilHelper/Base de Datos II/Contenidos/T01 - Introducción/-etc/Semana 3-4/silabo.pdf",
    );
  });

  it("distingue dos archivos homónimos de temas distintos", () => {
    const uno = drivePath({ ...base, moduleName: "T01", trail: [] });
    const dos = drivePath({ ...base, moduleName: "T02", trail: [] });
    expect(uno).not.toBe(dos);
  });
});

describe("exploreCourseDrive", () => {
  const link = (url: string, moduleName = "T01"): DriveLinkInput => ({
    url,
    moduleName,
    sectionName: "Contenidos",
  });

  /** Lector de mentira, por id de carpeta. Cada caso lo prepara con lo que
   *  necesita: contenido, un fallo de verdad, o nada (lo que produce el
   *  `shape` que `embeddedfolderview` da cuando el id no es una carpeta). */
  function reader(byId: Record<string, DriveEntry[] | DriveError>): FolderReader {
    return (id) => {
      const outcome = byId[id];
      if (outcome === undefined) return Promise.resolve(err({ kind: "shape" }));
      if (Array.isArray(outcome)) {
        return Promise.resolve(ok({ ok: true as const, entries: outcome, folderName: null }));
      }
      return Promise.resolve(err(outcome));
    };
  }

  const fileEntry = (id: string, name: string): DriveEntry => ({
    id,
    name,
    kind: "file",
    app: null,
    url: `https://drive.google.com/file/d/${id}/view`,
  });

  it("recorre un enlace /folders/ normal, sin pasar por la resolución de ambiguos", async () => {
    const result = await exploreCourseDrive(
      "Base de Datos II",
      [link("https://drive.google.com/drive/folders/CARPETA")],
      reader({ CARPETA: [fileEntry("F1", "S01-PPT.pptx")] }),
    );

    expect(result.foldersRead).toBe(1);
    expect(result.problems).toHaveLength(0);
    expect(result.files.map((f) => f.name)).toEqual(["S01-PPT.pptx"]);
  });

  it("un ?id= que resulta ser carpeta se recorre entero, no solo se prueba", async () => {
    // Caso real: 14 de 16 enlaces de un curso afectado tenían esta forma.
    const result = await exploreCourseDrive(
      "Dirección de Personas",
      [link("https://drive.google.com/open?id=AMBIGUO_CARPETA")],
      reader({ AMBIGUO_CARPETA: [fileEntry("F2", "S07-PPT.pptx")] }),
    );

    expect(result.problems).toHaveLength(0);
    expect(result.foldersRead).toBe(1);
    expect(result.files.map((f) => f.name)).toEqual(["S07-PPT.pptx"]);
  });

  it("un ?id= que resulta ser un archivo se encola como archivo, no se descarta", async () => {
    // Antes de esta corrección: se intentaba encolar directo como archivo con
    // `kind: "unknown"`, `toQueuedFile` lo descartaba, y no quedaba ningún
    // rastro —ni en `files`, ni en `problems`—. Ahora se pregunta primero.
    const result = await exploreCourseDrive(
      "Dirección de Personas",
      [link("https://drive.google.com/open?id=AMBIGUO_ARCHIVO")],
      reader({}), // sin entrada para el id: el lector devuelve `shape`, que es
      // justo lo que da `embeddedfolderview` cuando el id no es una carpeta
    );

    expect(result.problems).toHaveLength(0);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]?.url).toBe(
      "https://drive.usercontent.google.com/download?id=AMBIGUO_ARCHIVO&export=download",
    );
  });

  it("un ?id= que falla de verdad —sesión de Google, por ejemplo— se reporta, no se adivina como archivo", async () => {
    const result = await exploreCourseDrive(
      "Dirección de Personas",
      [link("https://drive.google.com/open?id=SIN_SESION")],
      reader({ SIN_SESION: { kind: "login" } }),
    );

    expect(result.files).toHaveLength(0);
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]?.detail).toContain("iniciar sesión");
  });

  it("el caso real: dos cursos, 14 de 16 enlaces en forma ?id=, y ninguno se pierde", async () => {
    // Reproduce la forma exacta encontrada en `1582… DIRECCION DE PERSONAS
    // (VIR)` y `2016… GESTION DE PROYECTOS (SPR)`, los dos con el mismo
    // reparto: 2 en /folders/, 14 en ?id=, todos carpetas de verdad.
    const folders = [
      "https://drive.google.com/drive/folders/A",
      "https://drive.google.com/drive/folders/B",
      ...Array.from({ length: 14 }, (_, i) => `https://drive.google.com/open?id=C${i}`),
    ];
    const byId: Record<string, DriveEntry[]> = { A: [fileEntry("fA", "a.pptx")], B: [fileEntry("fB", "b.pptx")] };
    for (let i = 0; i < 14; i++) byId[`C${i}`] = [fileEntry(`fC${i}`, `c${i}.pptx`)];

    const result = await exploreCourseDrive(
      "Curso afectado",
      folders.map((url, i) => link(url, `T${i + 1}`)),
      reader(byId),
    );

    expect(result.problems).toHaveLength(0);
    expect(result.foldersRead).toBe(16);
    expect(result.files).toHaveLength(16);
  });

  it("sigue encolando directo los enlaces inequívocos (file, native)", async () => {
    const result = await exploreCourseDrive(
      "Curso",
      [
        link("https://drive.google.com/file/d/UNARCHIVO/view"),
        link("https://docs.google.com/document/d/UNDOC/edit"),
      ],
      reader({}),
    );

    expect(result.foldersRead).toBe(0);
    expect(result.files).toHaveLength(2);
    expect(result.files.map((f) => f.url)).toEqual([
      "https://drive.usercontent.google.com/download?id=UNARCHIVO&export=download",
      "https://docs.google.com/document/d/UNDOC/export?format=pdf",
    ]);
  });

  it("sigue reportando lo que no tiene ninguna forma de Drive reconocible", async () => {
    const result = await exploreCourseDrive(
      "Curso",
      [link("https://ejemplo.org/no-es-drive")],
      reader({}),
    );

    expect(result.files).toHaveLength(0);
    expect(result.problems).toEqual([
      { where: "T01", detail: "Este enlace no tiene una forma de Drive que sepa reconocer." },
    ]);
  });
});
