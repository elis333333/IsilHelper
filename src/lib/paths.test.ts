import { describe, expect, it } from "vitest";
import { downloadPath, sanitizeFilename, sanitizeSegment } from "./paths";

describe("sanitizeSegment", () => {
  it("conserva las tildes y la eñe", () => {
    expect(sanitizeSegment("Diseño de Software")).toBe("Diseño de Software");
  });

  it("sustituye los separadores de ruta", () => {
    expect(sanitizeSegment("Unidad 1/2")).toBe("Unidad 1-2");
    expect(sanitizeSegment("C:\\temp")).toBe("C--temp");
  });

  it("quita los caracteres de control", () => {
    expect(sanitizeSegment("Tema\u00021\u001f")).toBe("Tema1");
  });

  it("colapsa los espacios repetidos", () => {
    expect(sanitizeSegment("Tema   1  ")).toBe("Tema 1");
  });

  it("quita los puntos y espacios del final, que Windows recorta solo", () => {
    expect(sanitizeSegment("Sesión 3.")).toBe("Sesión 3");
    expect(sanitizeSegment(".oculto")).toBe("oculto");
  });

  it("no deja un segmento vacío", () => {
    // Las etiquetas de Moodle traen nombres así (`domain.md` §5).
    expect(sanitizeSegment("\n\n \n\n")).toBe("sin nombre");
    expect(sanitizeSegment("...")).toBe("sin nombre");
  });

  it("esquiva los nombres reservados de Windows", () => {
    expect(sanitizeSegment("CON")).toBe("_CON");
    expect(sanitizeSegment("aux.txt")).toBe("_aux.txt");
    expect(sanitizeSegment("CONTABILIDAD")).toBe("CONTABILIDAD");
  });

  it("recorta los nombres largos sin dejar basura al final", () => {
    const long = `${"a".repeat(88)}. b`;
    const cut = sanitizeSegment(long);
    expect(cut.length).toBeLessThanOrEqual(90);
    expect(cut.endsWith(".")).toBe(false);
    expect(cut.endsWith(" ")).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("deja intacto un nombre normal", () => {
    expect(sanitizeFilename("T01 - Introducción.pdf")).toBe("T01 - Introducción.pdf");
  });

  it("conserva la extensión al recortar", () => {
    const cut = sanitizeFilename(`${"n".repeat(120)}.pdf`);
    expect(cut.endsWith(".pdf")).toBe(true);
    expect(cut.length).toBeLessThanOrEqual(90);
  });

  it("usa el respaldo cuando no queda nombre", () => {
    expect(sanitizeFilename("///")).toBe("---");
    expect(sanitizeFilename("")).toBe("archivo");
    expect(sanitizeFilename("   ", "material.bin")).toBe("material.bin");
  });

  it("no confunde un punto de en medio con una extensión", () => {
    const cut = sanitizeFilename(`Guía v1.2 ${"x".repeat(120)}`);
    expect(cut.length).toBeLessThanOrEqual(90);
  });
});

describe("downloadPath", () => {
  const base = {
    courseName: "Base de Datos II",
    sectionName: "Complementario",
    moduleName: "Semana 3",
    filename: "guia.pdf",
  };

  it("arma curso / sección / archivo", () => {
    expect(downloadPath({ ...base, ownFolder: false })).toBe(
      "IsilHelper/Base de Datos II/Complementario/guia.pdf",
    );
  });

  it("intercala el módulo cuando trae más de un archivo", () => {
    expect(downloadPath({ ...base, ownFolder: true })).toBe(
      "IsilHelper/Base de Datos II/Complementario/Semana 3/guia.pdf",
    );
  });

  it("nunca produce una ruta que suba de carpeta", () => {
    const path = downloadPath({
      courseName: "..",
      sectionName: "../..",
      moduleName: "x",
      filename: "../evil.sh",
      ownFolder: false,
    });
    expect(path.includes("..")).toBe(false);
    expect(path.startsWith("IsilHelper/")).toBe(true);
  });

  it("distingue dos archivos homónimos de módulos distintos", () => {
    const uno = downloadPath({ ...base, moduleName: "Semana 3", ownFolder: true });
    const dos = downloadPath({ ...base, moduleName: "Semana 4", ownFolder: true });
    expect(uno).not.toBe(dos);
  });
});
