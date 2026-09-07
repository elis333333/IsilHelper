import { useEffect, useRef } from "react";
import { useQueue } from "./downloads";
import { useDonationPrompt } from "../store/donation";

/** Dos minutos de uso seguido, o una descarga que termina, lo que llegue
 *  antes. Los dos disparan lo mismo: `trigger()` ya sabe no repetirse. */
const CONTINUOUS_USE_MS = 2 * 60 * 1000;

/**
 * Decide cuándo pedir el aporte.
 *
 * Los dos relojes solo corren con sesión conectada: sin eso, dos minutos
 * mirando la pantalla de "Conectar" no son dos minutos de uso, y no hay
 * ninguna descarga que pueda terminar.
 */
export function useDonationTriggers(connected: boolean): void {
  const trigger = useDonationPrompt((state) => state.trigger);
  const queue = useQueue();
  // Si la cola venía corriendo en el sondeo anterior. Sin esto no hay forma
  // de distinguir "la cola acaba de vaciarse" de "la cola ya estaba vacía",
  // que dispararía el aviso nada más conectar sin haber bajado nada.
  const wasRunning = useRef(false);

  useEffect(() => {
    if (!connected) return;
    const timer = setTimeout(trigger, CONTINUOUS_USE_MS);
    return () => clearTimeout(timer);
  }, [connected, trigger]);

  useEffect(() => {
    if (!connected) return;
    const data = queue.data;
    if (data === undefined) return;

    const justFinished =
      wasRunning.current && !data.running && data.items.some((item) => item.status === "done");
    if (justFinished) trigger();

    wasRunning.current = data.running;
  }, [connected, queue.data, trigger]);
}
