import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { buildIndex, readCachedContents, scopeLine } from "./cache-index";
import type { CourseDetail, CourseSummary, Loaded, PendingList } from "../../lib/messages";

const courses = (n: number): Loaded<CourseSummary[]> => ({
  state: "ok",
  value: Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    fullname: `Curso ${i + 1}`,
    progress: null,
  })),
});

const pending: Loaded<PendingList> = {
  state: "ok",
  value: {
    complete: true,
    items: [
      {
        id: 90,
        name: "Entrega de la unidad 1",
        due: 1_757_000_000,
        urgency: "week",
        courseId: 1,
        courseName: "Curso 1",
        courseShort: null,
        kind: "assign",
        url: null,
      },
    ],
  },
};

const detail = (courseId: number): Loaded<CourseDetail> => ({
  state: "ok",
  value: {
    courseId,
    courseName: `Curso ${courseId}`,
    sections: [
      {
        id: 1,
        name: "Contenidos",
        modules: [
          { id: 11, name: "T01 - Introducción", kind: "url", completed: null, url: null, files: [], externalCount: 1 },
        ],
      },
    ],
    files: [],
    links: [],
    attachmentsFailed: false,
  },
});

describe("índice del buscador", () => {
  it("cuenta los 11 cursos que trajo la pestaña Cursos", () => {
    const index = buildIndex(courses(11), undefined, []);
    expect(index.scope.courses).toBe(11);
    expect(index.entries).toHaveLength(11);
  });

  it("no cuenta nada si la carga falló", () => {
    const failed: Loaded<CourseSummary[]> = { state: "failed", reason: "waf" };
    expect(buildIndex(failed, undefined, []).scope.courses).toBe(0);
  });

  it("suma cursos, pendientes y material en un solo índice", () => {
    const index = buildIndex(courses(11), pending, [detail(1), detail(2)]);
    expect(index.scope).toEqual({ courses: 11, pending: 1, openedCourses: 2 });
    expect(index.entries).toHaveLength(11 + 1 + 2);
  });

  it("ignora el detalle de un curso que no cargó", () => {
    const failed: Loaded<CourseDetail> = { state: "failed", reason: "network" };
    const index = buildIndex(undefined, undefined, [detail(1), failed, undefined]);
    expect(index.scope.openedCourses).toBe(1);
  });
});

describe("lectura de la caché de Query", () => {
  /** Este es el fallo que se corrige: la pestaña Cursos había cargado los 11 y
   *  el buscador contaba 0 porque miraba la caché una sola vez, al montarse.
   *  La prueba usa las mismas claves que las pantallas. */
  it("ve el material que dejó la pantalla de detalle de curso", () => {
    const client = new QueryClient();
    client.setQueryData(["contents", 7], detail(7));
    client.setQueryData(["contents", 9], detail(9));

    const index = buildIndex(undefined, undefined, readCachedContents(client));
    expect(index.scope.openedCourses).toBe(2);
    expect(index.entries.map((e) => e.courseId).sort()).toEqual([7, 9]);
  });

  it("no confunde otras claves con las de contenidos", () => {
    const client = new QueryClient();
    client.setQueryData(["courses"], courses(11));
    client.setQueryData(["contents", 7], detail(7));

    expect(readCachedContents(client)).toHaveLength(1);
  });

  it("sin nada en caché no inventa material", () => {
    expect(readCachedContents(new QueryClient())).toEqual([]);
  });
});

describe("línea de alcance", () => {
  it("dice cuántos cursos hay de verdad", () => {
    expect(scopeLine({ courses: 11, pending: 2, openedCourses: 3 })).toBe(
      "Busco en 11 cursos, 2 pendientes y el material de 3 cursos abiertos.",
    );
  });

  it("explica por qué no hay material cuando no se abrió ningún curso", () => {
    expect(scopeLine({ courses: 11, pending: 2, openedCourses: 0 })).toContain(
      "no has abierto ningún curso",
    );
  });

  it("concuerda en singular con un solo curso abierto", () => {
    expect(scopeLine({ courses: 11, pending: 0, openedCourses: 1 })).toContain(
      "el material de un curso abierto",
    );
  });
});
