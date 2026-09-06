import { describe, expect, it } from "vitest";
import { driveFileName } from "./drive";
import type { FoundFile } from "../api/drive-walk";
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
