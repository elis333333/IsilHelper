import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QueuedFile } from "../lib/messages";

/**
 * Pruebas de la cola con dobles de `chrome`: sin red, sin disco y sin esperas
 * reales. Lo que se comprueba es lo que rompe de verdad en producción —el HTML
 * de login guardado con nombre de PDF, el archivo que se baja dos veces, el
 * reintento ante el WAF— y no que las funciones se llamen entre sí.
 */

type FakeDownload = {
  id: number;
  url: string;
  filename: string;
  state: "in_progress" | "complete" | "interrupted";
  mime: string;
  bytesReceived: number;
  totalBytes: number;
  error?: string;
};

let store: Record<string, unknown>;
let downloads: FakeDownload[];
let nextId: number;
let listeners: Array<(delta: chrome.downloads.DownloadDelta) => void>;
let removedFiles: number[];
let erased: number[];

function file(path: string, url = "https://platform.ecala.net/webservice/pluginfile.php/1/a.pdf"): QueuedFile {
  return {
    path,
    name: path.split("/").pop() ?? path,
    url,
    size: 1024,
    courseName: "Base de Datos II",
    sectionName: "Complementario",
  };
}

/** Termina la descarga en curso como lo haría el navegador. */
async function finish(patch: Partial<FakeDownload>): Promise<void> {
  const active = downloads.find((download) => download.state === "in_progress");
  if (active === undefined) throw new Error("no hay ninguna descarga en curso");
  Object.assign(active, { state: "complete", bytesReceived: 1024 }, patch);
  for (const listener of listeners) {
    listener({ id: active.id, state: { current: active.state, previous: "in_progress" } });
  }
  await vi.runAllTimersAsync();
}

beforeEach(() => {
  vi.useFakeTimers();
  store = {};
  downloads = [];
  listeners = [];
  removedFiles = [];
  erased = [];
  nextId = 1;

  const chromeDouble = {
    storage: {
      local: {
        get: (key: string) => Promise.resolve(key in store ? { [key]: store[key] } : {}),
        set: (values: Record<string, unknown>) => {
          Object.assign(store, values);
          return Promise.resolve();
        },
        remove: (keys: string[]) => {
          for (const key of keys) delete store[key];
          return Promise.resolve();
        },
      },
    },
    downloads: {
      download: (options: { url: string; filename: string }) => {
        const download: FakeDownload = {
          id: nextId++,
          url: options.url,
          filename: options.filename,
          state: "in_progress",
          mime: "application/pdf",
          bytesReceived: 0,
          totalBytes: 1024,
        };
        downloads.push(download);
        return Promise.resolve(download.id);
      },
      search: ({ id }: { id: number }) =>
        Promise.resolve(downloads.filter((download) => download.id === id)),
      erase: ({ id }: { id: number }) => {
        erased.push(id);
        return Promise.resolve([id]);
      },
      removeFile: (id: number) => {
        removedFiles.push(id);
        return Promise.resolve();
      },
      pause: () => Promise.resolve(),
      resume: () => Promise.resolve(),
      onChanged: {
        addListener: (listener: (delta: chrome.downloads.DownloadDelta) => void) => {
          listeners.push(listener);
        },
      },
    },
  };

  vi.stubGlobal("chrome", chromeDouble);
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** El módulo guarda estado propio (la marca de la última petición), así que se
 *  reimporta limpio en cada caso. */
async function load() {
  const queue = await import("./downloads");
  queue.registerDownloadQueue();
  return queue;
}

describe("cola de descargas", () => {
  it("pega el token al lanzar y no lo guarda en ningún sitio", async () => {
    store.moodleToken = "0123456789abcdef0123456789abcdef";
    const queue = await load();

    await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);
    await vi.runAllTimersAsync();

    expect(downloads[0]?.url).toContain("token=0123456789abcdef0123456789abcdef");

    // El token vive en su clave y en ninguna otra: ni la cola ni el registro
    // conservan la URL con el token pegado.
    const saved = JSON.stringify({ queue: store.downloadQueue, log: store.downloadLog });
    expect(saved).not.toContain("0123456789abcdef0123456789abcdef");
  });

  it("marca el archivo como descargado y borra la anotación del historial", async () => {
    store.moodleToken = "<TOKEN>";
    const queue = await load();

    await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);
    await vi.runAllTimersAsync();
    await finish({ mime: "application/pdf" });

    const snapshot = await queue.queueSnapshot();
    expect(snapshot.items[0]?.status).toBe("done");
    expect(snapshot.running).toBe(false);
    // La URL con el token vivía en la entrada del historial.
    expect(erased).toEqual([1]);
  });

  it("trata como fallo el HTML de login que Moodle devuelve con estado 200", async () => {
    store.moodleToken = "<TOKEN>";
    const queue = await load();

    await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);
    await vi.runAllTimersAsync();
    await finish({ mime: "text/html" });

    const snapshot = await queue.queueSnapshot();
    expect(snapshot.items[0]?.status).toBe("failed");
    expect(snapshot.items[0]?.error).toContain("Vuelve a conectar tu cuenta");
    // Y el HTML no se queda en disco con nombre de PDF.
    expect(removedFiles).toEqual([1]);
  });

  it("no vuelve a bajar lo que ya está en el registro", async () => {
    store.moodleToken = "<TOKEN>";
    store.downloadLog = { "IsilHelper/Curso/Sección/a.pdf": 1 };
    const queue = await load();

    const snapshot = await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);
    await vi.runAllTimersAsync();

    expect(snapshot.items[0]?.status).toBe("skipped");
    expect(downloads).toHaveLength(0);
  });

  it("olvidar una ruta permite volver a bajarla", async () => {
    store.moodleToken = "<TOKEN>";
    store.downloadLog = { "IsilHelper/Curso/Sección/a.pdf": 1 };
    const queue = await load();

    await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);
    await queue.forgetPaths(["IsilHelper/Curso/Sección/a.pdf"]);
    await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);
    await vi.runAllTimersAsync();

    expect(downloads).toHaveLength(1);
  });

  it("reintenta ante un fallo del servidor y se rinde al tercer intento", async () => {
    store.moodleToken = "<TOKEN>";
    const queue = await load();

    await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);
    await vi.runAllTimersAsync();

    await finish({ state: "interrupted", error: "SERVER_FAILED" });
    await finish({ state: "interrupted", error: "SERVER_FAILED" });
    await finish({ state: "interrupted", error: "SERVER_FAILED" });

    const snapshot = await queue.queueSnapshot();
    expect(downloads).toHaveLength(3);
    expect(snapshot.items[0]?.status).toBe("failed");
    expect(snapshot.items[0]?.error).toContain("La plataforma falló");
  });

  it("no reintenta un fallo de disco: reintentar no lo arregla", async () => {
    store.moodleToken = "<TOKEN>";
    const queue = await load();

    await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);
    await vi.runAllTimersAsync();
    await finish({ state: "interrupted", error: "FILE_NO_SPACE" });

    const snapshot = await queue.queueSnapshot();
    expect(downloads).toHaveLength(1);
    expect(snapshot.items[0]?.status).toBe("failed");
  });

  it("baja de uno en uno y sigue con el resto de la tanda", async () => {
    store.moodleToken = "<TOKEN>";
    const queue = await load();

    await queue.enqueue([
      file("IsilHelper/Curso/Sección/a.pdf"),
      file("IsilHelper/Curso/Sección/b.pdf"),
      file("IsilHelper/Curso/Sección/c.pdf"),
    ]);
    await vi.runAllTimersAsync();

    expect(downloads).toHaveLength(1);
    await finish({});
    expect(downloads).toHaveLength(2);
    await finish({});
    await finish({});

    const snapshot = await queue.queueSnapshot();
    expect(snapshot.items.every((item) => item.status === "done")).toBe(true);
    expect(snapshot.running).toBe(false);
  });

  it("la pausa detiene la salida de nuevas descargas", async () => {
    store.moodleToken = "<TOKEN>";
    const queue = await load();

    await queue.enqueue([
      file("IsilHelper/Curso/Sección/a.pdf"),
      file("IsilHelper/Curso/Sección/b.pdf"),
    ]);
    await vi.runAllTimersAsync();
    await queue.pauseQueue();
    await finish({});

    expect(downloads).toHaveLength(1);

    await queue.resumeQueue();
    await vi.runAllTimersAsync();
    expect(downloads).toHaveLength(2);
  });

  it("sin token no lanza nada y lo dice", async () => {
    const queue = await load();

    await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);
    await vi.runAllTimersAsync();

    const snapshot = await queue.queueSnapshot();
    expect(downloads).toHaveLength(0);
    expect(snapshot.items[0]?.error).toContain("No hay sesión conectada");
  });

  it("no encola dos veces el mismo archivo", async () => {
    store.moodleToken = "<TOKEN>";
    const queue = await load();

    await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);
    const snapshot = await queue.enqueue([file("IsilHelper/Curso/Sección/a.pdf")]);

    expect(snapshot.items).toHaveLength(1);
  });

  it("reintentar solo toca lo que falló", async () => {
    store.moodleToken = "<TOKEN>";
    const queue = await load();

    await queue.enqueue([
      file("IsilHelper/Curso/Sección/a.pdf"),
      file("IsilHelper/Curso/Sección/b.pdf"),
    ]);
    await vi.runAllTimersAsync();
    await finish({});
    await finish({ state: "interrupted", error: "FILE_NO_SPACE" });

    await queue.retryQueue();
    await vi.runAllTimersAsync();

    const snapshot = await queue.queueSnapshot();
    expect(snapshot.items[0]?.status).toBe("done");
    expect(snapshot.items[1]?.status).toBe("active");
  });
});
