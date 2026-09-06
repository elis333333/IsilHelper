import { describe, expect, it } from "vitest";
import { classifyDriveUrl, downloadUrl, exportExtension, folderViewUrl } from "./drive-links";

describe("classifyDriveUrl", () => {
  it("reconoce una carpeta", () => {
    expect(classifyDriveUrl("https://drive.google.com/drive/folders/1AbC_dEf-123")).toEqual({
      kind: "folder",
      id: "1AbC_dEf-123",
    });
  });

  it("reconoce un archivo", () => {
    expect(classifyDriveUrl("https://drive.google.com/file/d/1AbC/view?usp=sharing")).toEqual({
      kind: "file",
      id: "1AbC",
    });
  });

  it("reconoce los tres documentos nativos, con su aplicación", () => {
    expect(classifyDriveUrl("https://docs.google.com/document/d/1A/edit")).toEqual({
      kind: "native",
      id: "1A",
      app: "document",
    });
    // La ruta va en plural y el tipo en singular: es fácil equivocarse.
    expect(classifyDriveUrl("https://docs.google.com/spreadsheets/d/1B/edit")).toEqual({
      kind: "native",
      id: "1B",
      app: "spreadsheet",
    });
    expect(classifyDriveUrl("https://docs.google.com/presentation/d/1C/edit")).toEqual({
      kind: "native",
      id: "1C",
      app: "presentation",
    });
  });

  it("aguanta el prefijo de cuenta de quien tiene varias sesiones abiertas", () => {
    expect(classifyDriveUrl("https://drive.google.com/drive/u/0/folders/1A")).toEqual({
      kind: "folder",
      id: "1A",
    });
    expect(classifyDriveUrl("https://drive.google.com/u/2/file/d/1B/view")).toEqual({
      kind: "file",
      id: "1B",
    });
    expect(classifyDriveUrl("https://docs.google.com/document/u/1/d/1C/edit")).toEqual({
      kind: "native",
      id: "1C",
      app: "document",
    });
  });

  it("marca como ambiguo el `?id=`, que puede ser cualquiera de los dos", () => {
    expect(classifyDriveUrl("https://drive.google.com/open?id=1AbC")).toEqual({
      kind: "ambiguous",
      id: "1AbC",
    });
    expect(classifyDriveUrl("https://drive.google.com/uc?export=download&id=1AbC")).toEqual({
      kind: "ambiguous",
      id: "1AbC",
    });
  });

  it("no reconoce lo que no es Drive, y no lo adivina", () => {
    expect(classifyDriveUrl("https://ejemplo.org/file/d/1A/view")).toEqual({ kind: "unknown" });
    expect(classifyDriveUrl("https://drive.google.com.evil.net/file/d/1A/view")).toEqual({
      kind: "unknown",
    });
    expect(classifyDriveUrl("https://drive.google.com/algo/nuevo/1A")).toEqual({ kind: "unknown" });
    expect(classifyDriveUrl("no es una url")).toEqual({ kind: "unknown" });
  });
});

describe("downloadUrl", () => {
  it("usa la ruta medida para los binarios", () => {
    expect(downloadUrl({ kind: "file", id: "1A" })).toBe(
      "https://drive.usercontent.google.com/download?id=1A&export=download",
    );
  });

  it("exporta los nativos, cada uno por su ruta", () => {
    expect(downloadUrl({ kind: "native", id: "1A", app: "document" })).toContain(
      "/document/d/1A/export?format=pdf",
    );
    expect(downloadUrl({ kind: "native", id: "1B", app: "spreadsheet" })).toContain(
      "/spreadsheets/d/1B/export?format=xlsx",
    );
    // La de Slides lleva el formato en la ruta, no en la query.
    expect(downloadUrl({ kind: "native", id: "1C", app: "presentation" })).toBe(
      "https://docs.google.com/presentation/d/1C/export/pdf",
    );
  });

  it("no inventa una descarga para lo que no se puede bajar", () => {
    expect(downloadUrl({ kind: "folder", id: "1A" })).toBeNull();
    expect(downloadUrl({ kind: "unknown" })).toBeNull();
  });
});

describe("exportExtension", () => {
  it("da la extensión del archivo exportado", () => {
    expect(exportExtension("document")).toBe(".pdf");
    expect(exportExtension("spreadsheet")).toBe(".xlsx");
    expect(exportExtension("presentation")).toBe(".pdf");
  });
});

describe("folderViewUrl", () => {
  it("apunta a la vista para incrustar, que es la fuente de la enumeración", () => {
    expect(folderViewUrl("1AbC")).toBe(
      "https://drive.google.com/embeddedfolderview?id=1AbC#list",
    );
  });
});
