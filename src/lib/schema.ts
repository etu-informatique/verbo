// Petits utilitaires pour écrire des schémas JSON (structured outputs).

/** Construit un schéma JSON « strict » (tous les champs requis, aucun champ en plus). */
export function obj(properties: Record<string, unknown>): Record<string, unknown> {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}
export const str = (description?: string) => ({ type: "string", ...(description ? { description } : {}) });
export const num = (description?: string) => ({ type: "integer", ...(description ? { description } : {}) });
export const bool = () => ({ type: "boolean" });
export const arr = (items: unknown) => ({ type: "array", items });
