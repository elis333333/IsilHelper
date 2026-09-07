import { describe, expect, it } from "vitest";
import { initialsFrom, isGenericAvatar } from "./avatar";

const BASE = "https://platform.ecala.net";

describe("isGenericAvatar", () => {
  it("acepta la foto que el estudiante subió", () => {
    expect(isGenericAvatar(`${BASE}/webservice/pluginfile.php/6/user/icon/boost/f1?rev=4821`)).toBe(
      false,
    );
  });

  it("descarta el muñeco gris, que es una imagen del tema", () => {
    expect(isGenericAvatar(`${BASE}/theme/image.php/boost/core/1/u/f1`)).toBe(true);
    expect(isGenericAvatar(`${BASE}/theme/image.php?theme=boost&image=u%2Ff1`)).toBe(true);
  });

  it("descarta el marcador de sin foto venga por donde venga", () => {
    // Lo que distingue al genérico es el `/u/` de delante: sin él, `f1` es una
    // foto real y no puede confundirse con el muñeco.
    expect(isGenericAvatar(`${BASE}/pluginfile.php/1/core/2/u/f2.png`)).toBe(true);
    expect(isGenericAvatar(`${BASE}/webservice/pluginfile.php/6/user/icon/boost/f2`)).toBe(false);
  });

  it("descarta la que Moodle marca con rev=-1", () => {
    expect(isGenericAvatar(`${BASE}/webservice/pluginfile.php/6/user/icon/boost/f1?rev=-1`)).toBe(
      true,
    );
  });

  it("descarta lo que no es una URL: lo que no se entiende no se descarga", () => {
    expect(isGenericAvatar("")).toBe(true);
    expect(isGenericAvatar("no-es-una-url")).toBe(true);
  });
});

describe("initialsFrom", () => {
  it("toma la primera letra del nombre y la del último apellido", () => {
    expect(initialsFrom("Elis Rodríguez")).toBe("ER");
    expect(initialsFrom("Juan Carlos Pérez Gómez")).toBe("JG");
  });

  it("conserva las tildes al pasar a mayúscula", () => {
    expect(initialsFrom("Ángela Ñuñez")).toBe("ÁÑ");
  });

  it("con una sola palabra devuelve una sola letra", () => {
    expect(initialsFrom("Elis")).toBe("E");
  });

  it("ignora lo que no empieza por letra", () => {
    expect(initialsFrom("  Elis   (c1234567)  Rodríguez ")).toBe("ER");
  });

  it("nunca devuelve vacío", () => {
    expect(initialsFrom("")).toBe("?");
    expect(initialsFrom("   ")).toBe("?");
    expect(initialsFrom("123")).toBe("?");
  });
});
