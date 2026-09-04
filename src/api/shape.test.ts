import { describe, expect, it } from "vitest";
import { describeShape, distribution, typeName } from "./shape";

describe("describeShape", () => {
  it("cuenta en cuántos elementos aparece cada campo", () => {
    const shape = describeShape([
      { id: 1, name: "a", extra: true },
      { id: 2, name: "b" },
      { id: 3 },
    ]);
    expect(shape.count).toBe(3);
    expect(shape.fields.id).toEqual({ present: 3, types: ["number"] });
    expect(shape.fields.name).toEqual({ present: 2, types: ["string"] });
    expect(shape.fields.extra).toEqual({ present: 1, types: ["boolean"] });
  });

  it("distingue un campo ausente de uno presente pero nulo", () => {
    const shape = describeShape([{ a: null }, { a: 1 }, {}]);
    expect(shape.fields.a).toEqual({ present: 2, types: ["null", "number"] });
  });

  it("recorre objetos anidados con la ruta separada por puntos", () => {
    const shape = describeShape([{ course: { id: 1, fullname: "x" } }]);
    expect(shape.fields["course.id"]).toEqual({ present: 1, types: ["number"] });
    expect(shape.fields["course.fullname"]).toEqual({ present: 1, types: ["string"] });
  });

  it("mira el primer elemento de los arrays y lo marca con []", () => {
    const shape = describeShape([{ contents: [{ fileurl: "u", filesize: 10 }] }]);
    expect(shape.fields["contents"]).toEqual({ present: 1, types: ["array"] });
    expect(shape.fields["contents[].fileurl"]).toEqual({ present: 1, types: ["string"] });
  });

  it("no revienta con un array vacío", () => {
    const shape = describeShape([{ contents: [] }]);
    expect(shape.fields["contents"]?.types).toEqual(["array"]);
  });

  it("respeta el tope de profundidad", () => {
    const shape = describeShape([{ a: { b: { c: { d: 1 } } } }], 2);
    expect(shape.fields["a.b"]).toBeDefined();
    expect(shape.fields["a.b.c.d"]).toBeUndefined();
  });

  it("NO incluye ningún valor, solo tipos", () => {
    const shape = describeShape([{ nombre: "Elis", nota: 17.5 }]);
    const serializado = JSON.stringify(shape);
    expect(serializado).not.toContain("Elis");
    expect(serializado).not.toContain("17.5");
    expect(shape.fields.nombre?.types).toEqual(["string"]);
  });
});

describe("distribution", () => {
  it("cuenta valores repetidos", () => {
    expect(distribution(["assign", "quiz", "assign"])).toEqual({ assign: 2, quiz: 1 });
  });

  it("separa ausente de nulo", () => {
    expect(distribution([undefined, null, true])).toEqual({
      "(ausente)": 1, "(null)": 1, true: 1,
    });
  });
});

describe("typeName", () => {
  it.each([
    [null, "null"], [[], "array"], [{}, "object"],
    ["x", "string"], [1, "number"], [true, "boolean"],
  ])("%s → %s", (value, expected) => {
    expect(typeName(value)).toBe(expected);
  });
});
