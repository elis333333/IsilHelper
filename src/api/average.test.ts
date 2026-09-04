import { describe, expect, it } from "vitest";
import { courseGrade, gradedCount, overallAverage } from "./average";
import type { GradeItem } from "./types";

const item = (over: Partial<GradeItem> & { id: number }): GradeItem => ({
  itemtype: "mod",
  grademax: 20,
  ...over,
});

describe("courseGrade", () => {
  it("prefiere el total que calcula Moodle antes que recalcular", () => {
    const items = [
      item({ id: 1, graderaw: 10, weightraw: 0.5 }),
      item({ id: 2, graderaw: 20, weightraw: 0.5 }),
      item({ id: 3, itemtype: "course", graderaw: 17, grademax: 20 }),
    ];
    const grade = courseGrade(items);
    expect(grade.source).toBe("total");
    expect(grade.percentage).toBeCloseTo(85);
  });

  it("pondera con weightraw cuando no hay total del curso", () => {
    // 50 % con peso 0,25 y 100 % con peso 0,75 → 87,5 %
    const items = [
      item({ id: 1, graderaw: 10, grademax: 20, weightraw: 0.25 }),
      item({ id: 2, graderaw: 20, grademax: 20, weightraw: 0.75 }),
    ];
    const grade = courseGrade(items);
    expect(grade.source).toBe("weighted");
    expect(grade.percentage).toBeCloseTo(87.5);
  });

  it("salta lo que aún no tiene nota en vez de contarlo como cero", () => {
    const items = [
      item({ id: 1, graderaw: 20, grademax: 20, weightraw: 0.5 }),
      item({ id: 2, graderaw: null, grademax: 20, weightraw: 0.5 }),
    ];
    expect(courseGrade(items).percentage).toBeCloseTo(100);
  });

  it("devuelve null, no cero, cuando no hay ninguna nota puesta", () => {
    const items = [item({ id: 1, graderaw: null, weightraw: 1 })];
    const grade = courseGrade(items);
    expect(grade).toEqual({ percentage: null, source: "none", graded: 0 });
  });

  it("no divide por cero si el grademax es cero", () => {
    const items = [item({ id: 1, graderaw: 5, grademax: 0, weightraw: 1 })];
    expect(courseGrade(items).percentage).toBeNull();
  });

  it("ignora pesos ausentes o nulos al ponderar", () => {
    const items = [
      item({ id: 1, graderaw: 10, grademax: 20, weightraw: null }),
      item({ id: 2, graderaw: 20, grademax: 20, weightraw: 1 }),
    ];
    expect(courseGrade(items).percentage).toBeCloseTo(100);
  });

  it("cuenta las actividades calificadas sin contar el total del curso", () => {
    const items = [
      item({ id: 1, graderaw: 10 }),
      item({ id: 2, graderaw: null }),
      item({ id: 3, itemtype: "course", graderaw: 15 }),
    ];
    expect(gradedCount(items)).toBe(1);
  });
});

describe("overallAverage", () => {
  it("promedia los cursos que tienen nota", () => {
    const average = overallAverage([
      { percentage: 80, source: "total", graded: 3 },
      { percentage: 90, source: "total", graded: 2 },
    ]);
    expect(average).toBeCloseTo(85);
  });

  it("excluye del promedio los cursos sin nota, no los cuenta como cero", () => {
    const average = overallAverage([
      { percentage: 80, source: "total", graded: 3 },
      { percentage: null, source: "none", graded: 0 },
    ]);
    expect(average).toBeCloseTo(80);
  });

  it("devuelve null si ningún curso tiene nota todavía", () => {
    expect(overallAverage([{ percentage: null, source: "none", graded: 0 }])).toBeNull();
  });
});
