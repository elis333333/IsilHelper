import { describe, expect, it } from "vitest";
import {
  classifyEvent,
  compareByPriority,
  eventShortLabel,
  eventTypeLabel,
  KIND_COLOR,
  KIND_PRIORITY,
  type EventKind,
} from "./eventKind";

const kindOf = (name: string, modname?: string | null): EventKind =>
  classifyEvent(name, modname).kind;

/**
 * El corpus real del ciclo 202620, con la redacción exacta con la que llega de
 * la plataforma. Son **todas** las formas distintas del ciclo completo, así que
 * lo que pase aquí está medido y no deducido.
 */
describe("los nombres reales del ciclo 202620", () => {
  it("los cinco vencimientos de PA son PA, con su número y su fase", () => {
    for (const number of [1, 2, 3, 4, 5]) {
      const classified = classifyEvent(
        `Vencimiento de Proceso de Aprendizaje ${number}`,
        "assign",
      );
      expect(classified.kind).toBe("PA");
      expect(classified.pa).toEqual({ number, phase: "vencimiento" });
    }
  });

  it("los dos cierres de PA son PA, con su número y su fase", () => {
    // Solo existen el 3 y el 6, y solo en los dos cursos VIR, que tienen seis
    // PA en vez de cuatro más la integral.
    for (const number of [3, 6]) {
      const classified = classifyEvent(`Se cierra Proceso de Aprendizaje ${number}`, "quiz");
      expect(classified.kind).toBe("PA");
      expect(classified.pa).toEqual({ number, phase: "cierre" });
    }
  });

  it("la Evaluación Integral es EI y nunca viene numerada", () => {
    const classified = classifyEvent("Vencimiento de Evaluación Integral", "assign");
    expect(classified.kind).toBe("EI");
    // Aunque el nombre diga "Vencimiento", la fase es cosa de los PA: la EI no
    // tiene dos fechas que distinguir.
    expect(classified.pa).toBe(null);
  });

  it("los foros dependen del modname, porque el nombre no los etiqueta", () => {
    expect(kindOf("RESILIENCIA pendiente", "forum")).toBe("FORO");
    expect(kindOf("AGENTES SOCIALIZADORES pendiente", "forum")).toBe("FORO");
    expect(kindOf("DISTORSIONES COGNITIVAS pendiente", "forum")).toBe("FORO");
  });
});

describe("el nombre manda sobre el modname", () => {
  // La regla la justifican los PA, no las EI: en este ciclo la integral llega
  // siempre como `assign`, pero el mismo Proceso de Aprendizaje llega como
  // `assign` cuando vence y como `quiz` cuando se cierra.
  it("el PA que llega como quiz sigue siendo PA y no cuestionario", () => {
    expect(kindOf("Se cierra Proceso de Aprendizaje 6", "quiz")).toBe("PA");
  });

  it("el PA que llega como assign sigue siendo PA y no tarea", () => {
    expect(kindOf("Vencimiento de Proceso de Aprendizaje 4", "assign")).toBe("PA");
  });

  it("la EI que llega como assign sigue siendo EI y no tarea", () => {
    expect(kindOf("Vencimiento de Evaluación Integral", "assign")).toBe("EI");
  });
});

describe("clasificación por modname", () => {
  it("assign es tarea cuando el nombre no dice otra cosa", () => {
    expect(kindOf("Trabajo grupal", "assign")).toBe("TAREA");
  });

  it("quiz es cuestionario cuando el nombre no dice otra cosa", () => {
    expect(kindOf("Autoevaluación de la semana 3", "quiz")).toBe("QUIZ");
  });

  it("un modname que no está en la tabla es OTRO", () => {
    expect(kindOf("Sala de clase", "zoom")).toBe("OTRO");
  });

  it("sin modname y sin etiqueta en el nombre es OTRO", () => {
    expect(kindOf("Recordatorio")).toBe("OTRO");
    expect(kindOf("Recordatorio", null)).toBe("OTRO");
    expect(kindOf("Recordatorio", undefined)).toBe("OTRO");
  });
});

describe("el número del PA", () => {
  it("llega hasta 6, que es lo que tienen los cursos VIR", () => {
    expect(classifyEvent("Se cierra Proceso de Aprendizaje 6").pa?.number).toBe(6);
  });

  it("es null cuando el nombre no numera", () => {
    // Callar es lo honesto: un "PA 1" inventado es peor que no decir nada.
    expect(classifyEvent("Proceso de Aprendizaje").pa).toEqual({
      number: null,
      phase: null,
    });
  });

  it("no toma un año por número de PA", () => {
    // Lo que protege no es el rango, es exigir que no siga otro dígito.
    expect(classifyEvent("Proceso de Aprendizaje 2026").pa?.number).toBe(null);
  });

  it("solo los PA traen subtipo", () => {
    expect(classifyEvent("Vencimiento de Evaluación Integral").pa).toBe(null);
    expect(classifyEvent("Trabajo grupal", "assign").pa).toBe(null);
  });
});

/**
 * Nada de esto aparece en el ciclo 202620: es tolerancia deducida, puesta a
 * propósito y marcada como tal para que nadie la lea como una medición. Si en
 * octubre el diagnóstico encuentra otra redacción, este bloque es donde se ve
 * qué se estaba cubriendo a ciegas.
 */
describe("tolerancia deducida · no medida en 202620", () => {
  it("aguanta la sigla PA suelta", () => {
    expect(kindOf("Vencimiento de PA2")).toBe("PA");
    expect(classifyEvent("PA-3").pa?.number).toBe(3);
    expect(classifyEvent("PA 4").pa?.number).toBe(4);
  });

  it("aguanta que cambien las tildes y las mayúsculas", () => {
    expect(kindOf("VENCIMIENTO DE EVALUACION INTEGRAL")).toBe("EI");
    expect(kindOf("vencimiento de proceso de aprendizaje 1")).toBe("PA");
  });

  it("no confunde la sigla PA dentro de otra palabra", () => {
    expect(kindOf("Participación en clase", "forum")).toBe("FORO");
  });
});

describe("etiquetas de tipo", () => {
  const labelOf = (name: string, modname?: string) => {
    const { kind, pa } = classifyEvent(name, modname);
    return eventTypeLabel(kind, pa);
  };
  const shortOf = (name: string, modname?: string) => {
    const { kind, pa } = classifyEvent(name, modname);
    return eventShortLabel(kind, pa);
  };

  it("distingue el vencimiento del cierre, que son hitos distintos", () => {
    expect(labelOf("Vencimiento de Proceso de Aprendizaje 3")).toBe("Vencimiento PA 3");
    expect(labelOf("Se cierra Proceso de Aprendizaje 3")).toBe("Se cierra PA 3");
  });

  it("un PA sin fase se queda en su número", () => {
    expect(labelOf("Proceso de Aprendizaje 4")).toBe("PA 4");
  });

  it("un PA sin número ni fase usa el nombre largo", () => {
    expect(labelOf("Proceso de Aprendizaje")).toBe("Proceso de aprendizaje");
  });

  it("los demás tipos usan su nombre de siempre", () => {
    expect(labelOf("Vencimiento de Evaluación Integral", "assign")).toBe("Evaluación integral");
    expect(labelOf("RESILIENCIA pendiente", "forum")).toBe("Foro");
    expect(labelOf("Trabajo grupal", "assign")).toBe("Tarea");
  });

  it("en corto el PA lleva número pero no fase", () => {
    // En la celda solo caben tres líneas, y lo que distingue una de otra es de
    // qué PA se trata. La fase la dice el panel, que tiene sitio.
    expect(shortOf("Vencimiento de Proceso de Aprendizaje 3")).toBe("PA 3");
    expect(shortOf("Se cierra Proceso de Aprendizaje 3")).toBe("PA 3");
    expect(shortOf("Vencimiento de Evaluación Integral", "assign")).toBe("EI");
    expect(shortOf("Trabajo grupal", "assign")).toBe("Tarea");
  });
});

describe("urgencia por tipo", () => {
  it("va de la EI hacia abajo", () => {
    expect(KIND_PRIORITY.EI).toBeGreaterThan(KIND_PRIORITY.PA);
    expect(KIND_PRIORITY.PA).toBeGreaterThan(KIND_PRIORITY.TAREA);
    expect(KIND_PRIORITY.TAREA).toBeGreaterThan(KIND_PRIORITY.FORO);
    expect(KIND_PRIORITY.FORO).toBeGreaterThan(KIND_PRIORITY.OTRO);
  });

  it("tarea y cuestionario pesan lo mismo", () => {
    expect(KIND_PRIORITY.QUIZ).toBe(KIND_PRIORITY.TAREA);
  });

  it("la clasificación lleva la urgencia de su tipo", () => {
    expect(classifyEvent("Vencimiento de Evaluación Integral", "assign").priority).toBe(
      KIND_PRIORITY.EI,
    );
    expect(classifyEvent("RESILIENCIA pendiente", "forum").priority).toBe(KIND_PRIORITY.FORO);
  });
});

describe("orden dentro de un día", () => {
  const item = (kind: EventKind, due: number) => ({ priority: KIND_PRIORITY[kind], due });

  it("pone primero lo que más pesa", () => {
    const ordenado = [item("FORO", 100), item("EI", 200), item("TAREA", 150)]
      .sort(compareByPriority)
      .map((entry) => entry.priority);

    expect(ordenado).toEqual([KIND_PRIORITY.EI, KIND_PRIORITY.TAREA, KIND_PRIORITY.FORO]);
  });

  it("desempata por hora cuando pesan lo mismo", () => {
    const ordenado = [item("QUIZ", 300), item("TAREA", 100)].sort(compareByPriority);
    expect(ordenado.map((entry) => entry.due)).toEqual([100, 300]);
  });
});

describe("mapa de colores", () => {
  const kinds: EventKind[] = ["EI", "PA", "TAREA", "QUIZ", "FORO", "OTRO"];

  it("todos los tipos salen en tokens, ninguno en hexadecimal", () => {
    // Un color a mano en este mapa es el primer paso para tenerlo a mano en un
    // JSX, que es justo lo que el sistema prohíbe.
    for (const kind of kinds) {
      expect(KIND_COLOR[kind].color).toMatch(/^--color-/);
      expect(KIND_COLOR[kind].over).toMatch(/^--color-/);
    }
  });

  it("el texto encima del color es oscuro en los seis", () => {
    // Medido con contraste.py: el blanco falla o se queda en texto grande
    // sobre los cinco colores. Sin excepciones que recordar.
    for (const kind of kinds) expect(KIND_COLOR[kind].over).toBe("--color-base");
  });

  it("el foro no usa el morado", () => {
    // #8338EC da 2,77:1 sobre #242424, el fondo del panel y del modal.
    expect(KIND_COLOR.FORO.color).not.toBe("--color-adapt");
    expect(KIND_COLOR.FORO.color).toBe("--color-scale");
  });

  it("tarea y cuestionario comparten el azul", () => {
    expect(KIND_COLOR.QUIZ.color).toBe(KIND_COLOR.TAREA.color);
    expect(KIND_COLOR.TAREA.color).toBe("--color-evolve");
  });

  it("la EI va en rojo y el PA en ámbar", () => {
    expect(KIND_COLOR.EI.color).toBe("--color-error");
    expect(KIND_COLOR.PA.color).toBe("--color-integrate");
  });
});
