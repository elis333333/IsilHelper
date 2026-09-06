import { describe, expect, it } from "vitest";
import { collectCourseFiles, isPlatformFile } from "./files";
import type { CourseModule, CourseSection, ModuleContent } from "./types";

const PLUGINFILE = "https://platform.ecala.net/webservice/pluginfile.php/1234/mod_resource/content/1";

function section(name: string, modules?: CourseModule[]): CourseSection {
  return modules === undefined ? { id: 1, name } : { id: 1, name, modules };
}

describe("isPlatformFile", () => {
  it("acepta solo la plataforma", () => {
    expect(isPlatformFile(`${PLUGINFILE}/guia.pdf`)).toBe(true);
    expect(isPlatformFile("https://drive.google.com/file/d/abc/view")).toBe(false);
    expect(isPlatformFile("https://platform.ecala.net.evil.com/x")).toBe(false);
    expect(isPlatformFile("no es una url")).toBe(false);
  });
});

describe("collectCourseFiles", () => {
  it("saca los archivos de la plataforma con su ruta de destino", () => {
    const inventory = collectCourseFiles("Base de Datos II", [
      section("Complementario", [
        {
          id: 10,
          name: "Guía de laboratorio",
          modname: "resource",
          contents: [
            { type: "file", filename: "guia.pdf", filesize: 2048, fileurl: `${PLUGINFILE}/guia.pdf` },
          ],
        },
      ]),
    ]);

    expect(inventory.links).toHaveLength(0);
    expect(inventory.files).toEqual([
      {
        path: "IsilHelper/Base de Datos II/Complementario/guia.pdf",
        name: "guia.pdf",
        url: `${PLUGINFILE}/guia.pdf`,
        size: 2048,
        moduleId: 10,
        moduleName: "Guía de laboratorio",
        sectionName: "Complementario",
      },
    ]);
  });

  it("manda los enlaces de Drive al inventario, no a la cola", () => {
    const inventory = collectCourseFiles("Cálculo", [
      section("Contenidos", [
        {
          id: 20,
          name: "T01 - Introducción",
          modname: "url",
          contents: [
            { type: "url", fileurl: "https://drive.google.com/drive/folders/abc123" },
          ],
        },
      ]),
    ]);

    expect(inventory.files).toHaveLength(0);
    expect(inventory.links).toEqual([
      {
        url: "https://drive.google.com/drive/folders/abc123",
        moduleId: 20,
        moduleName: "T01 - Introducción",
        sectionName: "Contenidos",
        kind: "url",
      },
    ]);
  });

  it("da carpeta propia al módulo que trae más de un archivo", () => {
    const inventory = collectCourseFiles("Redes", [
      section("Complementario", [
        {
          id: 30,
          name: "Semana 3",
          modname: "folder",
          contents: [
            { type: "file", filename: "a.pdf", fileurl: `${PLUGINFILE}/a.pdf` },
            { type: "file", filename: "b.pdf", fileurl: `${PLUGINFILE}/b.pdf` },
          ],
        },
      ]),
    ]);

    expect(inventory.files.map((file) => file.path)).toEqual([
      "IsilHelper/Redes/Complementario/Semana 3/a.pdf",
      "IsilHelper/Redes/Complementario/Semana 3/b.pdf",
    ]);
  });

  it("no encola dos veces la misma ruta", () => {
    const inventory = collectCourseFiles("Redes", [
      section("Complementario", [
        {
          id: 40,
          name: "Lectura",
          modname: "resource",
          contents: [{ type: "file", filename: "a.pdf", fileurl: `${PLUGINFILE}/a.pdf` }],
        },
        {
          id: 41,
          name: "Lectura",
          modname: "resource",
          contents: [{ type: "file", filename: "a.pdf", fileurl: `${PLUGINFILE}/otra/a.pdf` }],
        },
      ]),
    ]);

    expect(inventory.files).toHaveLength(1);
  });

  it("suma los adjuntos de las tareas, que get_contents no devuelve", () => {
    const attachments = new Map<number, ModuleContent[]>([
      [
        50,
        [
          { type: "file", filename: "enunciado.pdf", fileurl: `${PLUGINFILE}/enunciado.pdf` },
          { type: "file", filename: "rubrica.pdf", fileurl: `${PLUGINFILE}/rubrica.pdf` },
        ],
      ],
    ]);

    const inventory = collectCourseFiles(
      "Programación",
      [section("Evaluaciones", [{ id: 50, name: "TA1", modname: "assign", contents: [] }])],
      attachments,
    );

    expect(inventory.files.map((file) => file.path)).toEqual([
      "IsilHelper/Programación/Evaluaciones/TA1/enunciado.pdf",
      "IsilHelper/Programación/Evaluaciones/TA1/rubrica.pdf",
    ]);
  });

  it("trata como enlace un fileurl de otro host aunque venga como archivo", () => {
    const inventory = collectCourseFiles("Ética", [
      section("Complementario", [
        {
          id: 60,
          name: "Lectura externa",
          modname: "resource",
          contents: [
            { type: "file", filename: "x.pdf", fileurl: "https://ejemplo.org/x.pdf" },
          ],
        },
      ]),
    ]);

    expect(inventory.files).toHaveLength(0);
    expect(inventory.links).toHaveLength(1);
  });

  it("ignora las entradas sin fileurl y no revienta con secciones vacías", () => {
    const inventory = collectCourseFiles("Vacío", [
      section("General", [{ id: 70, name: "Aviso", modname: "page" }]),
      section("Otra"),
    ]);

    expect(inventory).toEqual({ files: [], links: [] });
  });
});
