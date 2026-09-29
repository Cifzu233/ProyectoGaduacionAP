// src/lib/detecciones.js
// Cómo se presenta una detección de cámara cuando NO hay plaga.
//
// El modelo de visión a veces nombra la especie a la que apunta la trampa
// aunque la lámina esté vacía ("polilla, severidad ninguna, sin capturas
// visibles"). Mostrar ese nombre hace pensar que hay plaga cuando no la hay,
// así que en ese caso la interfaz enseña un mensaje claro en lugar del nombre.

export const SIN_PLAGA_TITULO = "Sin plagas detectadas";
export const SIN_PLAGA_DETALLE = "La revisión salió limpia.";
export const SIN_PLAGA_CHIP = "todo limpio";

const CHIP_POR_SEVERIDAD = {
  alta: "ap-chip--alerta",
  media: "ap-chip--aviso",
  baja: "ap-chip--neutro",
  ninguna: "ap-chip--ok",
};

/**
 * No hay nada que reportar cuando la detección no trae nombre de plaga, o
 * cuando lo trae pero sin severidad ni acción pendiente.
 */
export function sinPlaga(deteccion) {
  const nombre = String(deteccion?.plaga ?? "").trim();
  if (!nombre) return true;
  return deteccion?.severidad === "ninguna" && !deteccion?.requiere_accion;
}

/** Título de la detección: el nombre de la plaga o el mensaje de "sin nada". */
export function tituloDeteccion(deteccion) {
  return sinPlaga(deteccion) ? SIN_PLAGA_TITULO : deteccion.plaga;
}

/** Etiqueta y color del chip que acompaña al título. */
export function chipDeteccion(deteccion) {
  if (sinPlaga(deteccion)) {
    return { texto: SIN_PLAGA_CHIP, clase: "ap-chip--ok" };
  }
  return {
    texto: deteccion?.severidad || "ninguna",
    clase: CHIP_POR_SEVERIDAD[deteccion?.severidad] || "ap-chip--neutro",
  };
}
