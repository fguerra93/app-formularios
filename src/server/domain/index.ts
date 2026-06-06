// Tipos del dominio.
//
// Se reexportan desde la definición central (`src/lib/types.ts`) para que los
// repositorios y servicios de `src/server/` devuelvan tipos del dominio y no
// filas crudas del proveedor de datos. Cuando se migre a Cloud SQL (Fase 8B),
// los consumidores siguen importando desde aquí sin cambios.
export * from "@/lib/types";
