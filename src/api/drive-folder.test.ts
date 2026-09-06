import { describe, expect, it } from "vitest";
import { decodeEntities, listingProblem, parseFolderHtml } from "./drive-folder";
import {
  CHANGED_HTML,
  LOGIN_HTML,
  MULTI_ACCOUNT_HTML,
  REAL_HTML,
  REAL_HTML_WITH_TITLE,
  SYNTHETIC_TYPES_HTML,
} from "./fixtures/embedded-folder";

/** Saca la lista o revienta el test con la causa, para no repetir el guardia. */
function listed(html: string) {
  const listing = parseFolderHtml(html);
  if (!listing.ok) throw new Error(`esperaba una lista, vino ${listing.reason}`);
  return listing;
}

describe("parseFolderHtml · contra el HTML real capturado", () => {
  it("saca id, nombre y tipo de la entrada", () => {
    const listing = listed(REAL_HTML);

    expect(listing.entries).toHaveLength(1);
    expect(listing.entries[0]).toEqual({
      // El identificador sale del enlace, no del atributo `id` del div.
      id: "ID33_NJqK",
      name: "30628-SILABO.pdf",
      kind: "file",
      app: null,
      url: "https://drive.google.com/file/d/ID33_NJqK/view?usp=drive_web",
    });
  });

  it("no depende del atributo `id` del div", () => {
    // En el HTML capturado ese atributo perdió el prefijo `entry-` al
    // anonimizarlo, y aun así la entrada se lee entera: el ancla es la clase.
    expect(REAL_HTML).not.toContain('id="entry-');
    expect(listed(REAL_HTML).entries).toHaveLength(1);
  });

  it("no confunde las clases hijas con una entrada nueva", () => {
    // `flip-entry-info`, `flip-entry-title` y compañía comparten prefijo.
    expect(REAL_HTML).toContain("flip-entry-info");
    expect(listed(REAL_HTML).entries).toHaveLength(1);
  });

  it("lee el nombre de la carpeta del título de la página", () => {
    expect(listed(REAL_HTML_WITH_TITLE).folderName).toBe("T01 - Introducción");
  });

  it("deja el nombre de la carpeta en null cuando el HTML no trae título", () => {
    expect(listed(REAL_HTML).folderName).toBeNull();
  });
});

describe("parseFolderHtml · tipos que la captura no traía", () => {
  it("distingue la subcarpeta, que es lo que permite recorrer", () => {
    const kinds = listed(SYNTHETIC_TYPES_HTML).entries.map((entry) => entry.kind);
    expect(kinds).toEqual(["folder", "native", "native"]);
  });

  it("distingue el nativo del binario y dice de qué aplicación es", () => {
    const natives = listed(SYNTHETIC_TYPES_HTML).entries.filter(
      (entry) => entry.kind === "native",
    );
    expect(natives.map((entry) => entry.app)).toEqual(["document", "presentation"]);
  });

  it("decodifica las entidades del nombre", () => {
    const entries = listed(SYNTHETIC_TYPES_HTML).entries;
    expect(entries[0]?.name).toBe("T02 - Modelo entidad relación");
    // Un `&amp;` sin decodificar acaba literal en el nombre del archivo.
    expect(entries[1]?.name).toBe("Guía & taller");
  });

  it("aguanta el prefijo de cuenta de quien tiene varias sesiones abiertas", () => {
    expect(listed(MULTI_ACCOUNT_HTML).entries.map((entry) => entry.kind)).toEqual([
      "folder",
      "file",
    ]);
  });
});

describe("parseFolderHtml · el icono como segunda fuente del tipo", () => {
  // Con el `id` del div, como lo emite Drive: cuando el enlace no clasifica,
  // es de ahí de donde sale el identificador.
  const withIcon = (href: string, mime: string) =>
    `<div class="flip-entry" id="entry-1AbC"><a href="${href}">` +
    `<img src="https://drive-thirdparty.googleusercontent.com/16/type/${mime}"/>` +
    '<div class="flip-entry-title">x</div></a></div>';

  it("clasifica por el icono cuando el enlace no tiene forma conocida", () => {
    const listing = listed(
      withIcon("https://drive.google.com/ruta/nueva/1A", "application/vnd.google-apps.folder"),
    );
    expect(listing.entries[0]?.kind).toBe("folder");
  });

  it("saca del icono también el tipo de documento nativo", () => {
    const listing = listed(
      withIcon("https://drive.google.com/ruta/nueva/1A", "application/vnd.google-apps.spreadsheet"),
    );
    expect(listing.entries[0]).toMatchObject({ kind: "native", app: "spreadsheet" });
  });

  it("no pisa lo que ya dijo el enlace: es respaldo, no confirmación", () => {
    // Enlace de archivo con icono de carpeta. Manda el enlace, que es el que
    // se usa para bajar; no hay rama de desempate porque no hace falta.
    const listing = listed(
      withIcon(
        "https://drive.google.com/file/d/1AbC/view",
        "application/vnd.google-apps.folder",
      ),
    );
    expect(listing.entries[0]?.kind).toBe("file");
  });
});

describe("parseFolderHtml · la rotura legible", () => {
  it("dice que no hay sesión cuando Google devuelve la pantalla de acceso", () => {
    expect(parseFolderHtml(LOGIN_HTML)).toEqual({ ok: false, reason: "login" });
  });

  it("NO devuelve una lista vacía cuando el HTML cambió: dice que se rompió", () => {
    // Es la diferencia entre "Google cambió la página" y "no tienes material".
    expect(parseFolderHtml(CHANGED_HTML)).toEqual({ ok: false, reason: "shape" });
  });

  it("trata el HTML vacío como rotura, no como carpeta sin nada", () => {
    expect(parseFolderHtml("")).toEqual({ ok: false, reason: "shape" });
  });

  it("no asume que un enlace desconocido sin icono sea un archivo", () => {
    const listing = listed(
      '<div class="flip-entry" id="entry-1A"><a href="https://drive.google.com/ruta/nueva/1A">x</a></div>',
    );
    expect(listing.entries[0]?.kind).toBe("unknown");
  });

  it("devuelve la entrada aunque no pueda leer su nombre", () => {
    const listing = listed(
      '<div class="flip-entry" id="entry-1A"><a href="https://drive.google.com/file/d/1A/view"></a></div>',
    );
    // `null` es "no sé cómo se llama", que no es lo mismo que una cadena vacía.
    expect(listing.entries[0]).toMatchObject({ id: "1A", name: null, kind: "file" });
  });

  it("no repite una entrada que aparezca dos veces", () => {
    expect(listed(REAL_HTML + REAL_HTML).entries).toHaveLength(1);
  });
});

describe("decodeEntities", () => {
  it("resuelve las nombradas y las numéricas", () => {
    expect(decodeEntities("Gu&iacute;a &amp; taller")).toBe("Guía & taller");
    expect(decodeEntities("Sesi&#243;n &#x31;")).toBe("Sesión 1");
  });

  it("respeta las mayúsculas acentuadas, que son letras distintas", () => {
    expect(decodeEntities("&Oacute;PTICA y &oacute;ptica")).toBe("ÓPTICA y óptica");
    expect(decodeEntities("Dise&ntilde;o")).toBe("Diseño");
  });

  it("deja intacto lo que no sabe resolver", () => {
    expect(decodeEntities("100&nada; algo")).toBe("100&nada; algo");
  });
});

describe("listingProblem", () => {
  it("manda a iniciar sesión cuando eso es lo que falta", () => {
    expect(listingProblem("login")).toContain("drive.google.com");
  });

  it("ante un HTML que no entiende, nombra las dos causas y no afirma ninguna", () => {
    const message = listingProblem("shape");
    expect(message).toContain("vacía");
    expect(message).toContain("Google cambió");
  });
});
