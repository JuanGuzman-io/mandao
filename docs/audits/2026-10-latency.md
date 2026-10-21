# Diagnóstico externo de latencia de Mandao

**Snapshot auditado:** `e0b45abde29183ed3ef0f9ef181cc2ea07dcc123`. Revisión de solo lectura; no se ejecutó ningún comando ni skill de Mandao, ningún test ni ningún instalador. Se leyeron Git, código, Markdown/YAML y el grafo existente. El reporte y sus cálculos se generaron originalmente fuera del repositorio; esta copia incorpora el diagnóstico y sus anexos calculados como documentación histórica.

> **Alcance histórico:** este diagnóstico describe exclusivamente el snapshot indicado, anterior a MDO-0011 y al layout v2. «Hoy», «actual» y «vigente» en el cuerpo se refieren a ese snapshot, no al estado presente de `main`. Los enlaces de evidencia están fijados al commit auditado; las recomendaciones no implican nuevas decisiones aprobadas.

## 1. Conclusión y orden de intervención

La evidencia favorece **reducir retrabajo, volumen del review y coordinación manual**, no eliminar TDD ni el Reviewer. Las horas de reloj mezclan ejecución con inactividad. La contabilidad histórica además duplica una sesión entre specs; comparar costes brutos induce a optimizar el lugar equivocado. No hay datos para atribuir un porcentaje exacto del tiempo a esperar al usuario.

| Prioridad | Hallazgo y evidencia | Cambio concreto propuesto | Riesgo / calidad |
|---|---|---|---|
| 1 | Review packs de MDO-0010 T3: **67.2k y 72.5k tokens aproximados**; 76% y 72% de caracteres en salidas generadas. El pack incluye todo `taskDiff`. [src/cli/run-leader.ts:182](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/run-leader.ts#L182); [src/scripts/review.ts:75](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/review.ts#L75) | En `src/scripts/review.ts` y `src/cli/run-leader.ts`, separar diff canónico de exports; al Reviewer darle el primero y un recibo de generación/hash por harness. Conservar el diff íntegro para ampliarlo si falla el recibo o cambia el renderer. | Bajo si se conserva validación mecánica y acceso al diff íntegro; ocultar generados sin comprobarlos sí perdería cobertura. |
| 2 | **10/14 tareas con costes necesitaron retrabajo**, 12 registros FAIL (incluyen un fallo de gate). MDO-0010 documenta tres omisiones de cláusulas en el brief/Done when. [docs/kaizen/MDO-0010.md:85](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0010.md#L85) | En `src/scripts/brief.ts`, derivar una checklist ejecutable de escenarios, cláusulas y alternativas prohibidas; incluir decisiones relevantes. Un único pase de completitud antes de delegar, no más documentos escritos por el modelo. | Bajo si conserva el alcance aprobado. `core/commands/tasks.md` ya mejoró la instrucción; no basta repetirla en más plantillas. |
| 3 | Loop con handoffs separados para RED, implementación y review; contexto llegó a **409,757 tokens**. T3 sugirió cortar dos veces antes de bajar el contexto. [core/commands/implement.md:68](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L68); [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/session-cuts.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/session-cuts.md#L1) | En `src/cli/session-advice.ts`, persistir un cut-id y no preguntar otra vez en el mismo límite; permitir rotación técnica automatizada cuando el harness la soporte. En bajo riesgo, una llamada al Implementer puede escribir RED, registrarlo y seguir a GREEN; mantener Reviewer independiente. | Medio: conservar checkpoint, trazabilidad y control RED. No fusionar Tester independiente con Implementer en tareas de riesgo. |
| 4 | `clarify` manda **toda pregunta técnica al developer**; los fallbacks de worktree y los cortes de sesión requieren intervención aun cuando no cambia el alcance. [core/commands/clarify.md:34](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/clarify.md#L34); [core/commands/specify.md:88](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L88) | En `core/commands/clarify.md`, delegar detalles reversibles cubiertos por la constitución; agrupar solo decisiones que cambian alcance, coste autorizado o acciones externas. Reutilizar autorización de worktree en `start`/`specify`/`quick`. | Bajo para decisiones reversibles; alto si se extiende a contratos públicos o decisiones de producto. La frecuencia real por tipo no está instrumentada. |
| 5 | El Implementer debe ejecutar gates, el Leader los repite, el hook repite tipos/lint y verify vuelve a comprobar. [core/personas/implementer.md:30](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/implementer.md#L30); [core/commands/implement.md:112](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L112); [scripts/hooks/pre-commit:5](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/scripts/hooks/pre-commit#L5) | En `src/cli/run-leader.ts` y `scripts/hooks/pre-commit`, reutilizar recibos por árbol exacto, configuración, selección de tests y versión de herramientas. En verify, repetir integración/e2e y checks no cubiertos. | Bajo con invalidación correcta; omitir por nombre de tarea o por tiempo sería inseguro. Los 26 tiempos Vitest guardados suman solo 3.20 min; faltan tiempos de tipos/build/hooks. |
| 6 | La especificación/brief no contiene decisiones completas; el commit usa archivos declarados y puede dejar fuera cambios aprobados. MDO-0009 dejó fuera **12 archivos** y produjo un commit que no compilaba. [docs/kaizen/MDO-0009.md:76](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0009.md#L76); [src/scripts/commits.ts:130](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/commits.ts#L130) | En `src/scripts/commits.ts`, comparar manifest de cambios aprobados contra lo que va a entrar al commit; el manifest debe proceder del review, no solo de `task.files`. | Bajo si se excluyen archivos ajenos; no arreglarlo con `git add -A` indiscriminado. |
| 7 | Helpers pueden ejecutar una instalación global vieja y luego repetir investigación porque el resultado no coincide con el branch. Ocurrió en MDO-0008. [docs/kaizen/MDO-0008.md:81](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0008.md#L81); [.mandao/bin/mandao.mjs:32](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/bin/mandao.mjs#L32) | En `src/engine/launcher.ts`, distinguir desarrollo del propio Mandao y registrar build/commit real del runner. Para dogfooding, preferir build local de ese checkout. | Bajo; mantener runner instalado para usuarios normales. Hecho histórico probado; no se ejecutó el launcher para afirmar cuál resuelve hoy. |
| 8 | Métricas no separan espera ni ejecución; MDO-0010 tiene **$15.9056 duplicados** de MDO-0009. La corrección de coste ya existe, pero los datos viejos permanecen. [docs/kaizen/MDO-0010.md:92](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0010.md#L92); [src/cli/run-cost.ts:76](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/run-cost.ts#L76) | Instrumentar eventos en `src/cli/run-cost.ts`, `run-ledger.ts`, `session-turns.ts` y `approvals.ts`: command_start/end, asked/answered, agent_start/end, gate_duration y snapshot global por sesión. Crear vista corregida histórica sin editar logs originales. | Bajo; es prerequisito para comparar mejoras, no una reducción de latencia por sí misma. |

Fuentes directas de los packs medidos: [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/reviews/T3-1-pack.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/reviews/T3-1-pack.md#L1) y [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/reviews/T3-2-pack.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/reviews/T3-2-pack.md#L1); desglose en [review-packs.csv](2026-10-latency/review-packs.csv).

No asigno minutos ahorrados a estas recomendaciones: faltan eventos suficientes para calcularlos. El orden combina magnitud observada de contexto/retrabajo con exposición al camino crítico; no es una descomposición causal de las horas.

## 2. Medición: qué se puede afirmar

### 2.1 Duración y coste por spec

La muestra tiene nueve specs con ejecución conservada y cuatro con costes. Solo MDO-0008/0009/0010 tienen ambos extremos de reloj y las tres usan `depth: lite`; no es una muestra de specs standard/full ni permite afirmar una latencia universal de una “spec mediana”. Sus archivos spec.md:1 declaran la profundidad.

`Duración` usa `start.yml.created_at → close-summary.md.closed_at`; es **tiempo transcurrido**, no tiempo de trabajo. Sin start fiable, se marca NR. Los costes son el total de registros; `equivalent` es precio de lista equivalente de una suscripción, **no dinero facturado**. Un `basis` ausente permanece desconocido; nunca se reemplaza por billed. [src/spec/costs.ts:19](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/spec/costs.ts#L19)

| Spec | Duración de reloj | USD registrados | Base | Tareas | FAIL | Tareas con retrabajo | Evidencia |
|---|---:|---:|---|---:|---:|---:|---|
| MDO-0001 | NR | NR | NR | 3 | 2 | 2 | [specs/MDO-0001-list-pinned-skills/execution.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0001-list-pinned-skills/execution.md#L10) |
| MDO-0002 | NR | NR | NR | 1 | 0 | 0 | [specs/MDO-0002-filter-pinned-skills-by-vetting/execution.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0002-filter-pinned-skills-by-vetting/execution.md#L10) |
| MDO-0004 | NR | NR | NR | 3 | 1 | 1 | [specs/MDO-0004-doctor-findings-as-json-for-ci/execution.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0004-doctor-findings-as-json-for-ci/execution.md#L10) |
| MDO-0005 | NR | NR | NR | 1 | 1 | 1 | [specs/MDO-0005-prove-the-doctor-crash-path-end-to-end/_log/execution.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0005-prove-the-doctor-crash-path-end-to-end/_log/execution.md#L10) |
| MDO-0006 | NR | NR | NR | 3 | 0 | 0 | [specs/MDO-0006-leave-no-temporary-folders-behind-after-the-test/execution.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0006-leave-no-temporary-folders-behind-after-the-test/execution.md#L10) |
| MDO-0007 | NR | 5.5196 | sin campo | 2 | 0 | 0 | [specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/execution.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/execution.md#L10); [specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml#L1) |
| MDO-0008 | 190.35 min | 18.3225 | equivalent, sin campo | 4 | 5 | 3 | [specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/execution.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/execution.md#L10); [specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml#L1); [specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/start.yml:8](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/start.yml#L8); [specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/close-summary.md:6](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/close-summary.md#L6) |
| MDO-0009 | 537.70 min | 19.6441 | equivalent | 3 | 3 | 3 | [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/execution.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/execution.md#L10); [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml#L1); [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/start.yml:8](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/start.yml#L8); [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/close-summary.md:6](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/close-summary.md#L6) |
| MDO-0010 | 132.99 min | 45.2325 | equivalent | 5 | 4 | 4 | [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/execution.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/execution.md#L10); [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml#L1); [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/start.yml:8](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/start.yml#L8); [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/close-summary.md:6](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/close-summary.md#L6) |

MDO-0007 no tiene hora de inicio de spec: entre el primer coste conservado y el cierre hay **15.86 min**, solo una ventana final, no la duración completa. Las specs antiguas que guardan logs en la raíz se incluyen como legado, no se inventa coste cero cuando faltan costes.

**Doble contabilidad verificable:** MDO-0009 y MDO-0010 comparten la sesión `bcd55241-…`. En MDO-0009 esa sesión ya había registrado implement + verify + close = **12.3896 + 1.8632 + 1.6528 = $15.9056**. El primer registro de MDO-0010 guarda todo el acumulado ($27.0764), en vez de solo el delta ($11.1708). La vista corregida de MDO-0010 sería **$29.3269**, conservando intacto el log de $45.2325. La propia Kaizen reconoce el defecto. [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml#L1); [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml#L1); [docs/kaizen/MDO-0010.md:93](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0010.md#L93)

Hoy `allEntries()` recoge los registros de todas las specs antes de calcular el delta; no recomiendo volver a implementar una corrección que ya está. La etiqueta `specify` de MDO-0010 sigue sin ser un coste puro de planificación: incluye Reviewer, Tester e Implementers. [src/cli/run-cost.ts:76](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/run-cost.ts#L76); [src/cli/run-cost.ts:101](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/run-cost.ts#L101)

### 2.2 Por comando: coste y ventanas observables

No hay eventos `command_start/command_end`. La columna temporal siguiente es una **ventana entre marcas conocidas**, no ejecución activa ni espera humana. Una sola marca de coste no permite una duración; NR significa no registrable con estas fuentes.

| Spec | Comando | USD | Ventana temporal reconstruible | Fuente |
|---|---|---:|---|---|
| MDO-0007 | specify | 1.3555 | NR: solo marca de cierre, sin inicio | [specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml:4](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml#L4) |
| MDO-0007 | implement | 2.6514 | NR: solo marca de cierre, sin inicio; Δ desde anterior registro: 10.61 min (no atribuir íntegro al comando) | [specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml:17](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml#L17) |
| MDO-0007 | verify | 0.5009 | NR: solo marca de cierre, sin inicio; Δ desde anterior registro: 2.13 min (no atribuir íntegro al comando) | [specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml:38](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml#L38) |
| MDO-0007 | close | 1.0118 | NR: solo marca de cierre, sin inicio; Δ desde anterior registro: 3.21 min (no atribuir íntegro al comando) | [specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml:58](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml#L58) |
| MDO-0008 | specify | 2.8602 | 55.72 min desde creación de worktree hasta último coste specify (incluye setup, pausas y revisiones) | [specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml:4](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml#L4) |
| MDO-0008 | implement | 12.8394 | 110.43 min desde primer step/cut hasta último coste implement (incluye pausas/retrabajo) | [specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml:30](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml#L30) |
| MDO-0008 | verify | 1.3707 | 3.21 min entre primero y último registro del propio comando; falta inicio | [specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml:75](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml#L75) |
| MDO-0008 | close | 1.2522 | NR: solo marca de cierre, sin inicio; Δ desde anterior registro: 13.66 min (no atribuir íntegro al comando) | [specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml:109](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml#L109) |
| MDO-0009 | specify | 1.8149 | 4.94 min desde creación de worktree hasta último coste specify (incluye setup, pausas y revisiones) | [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml:4](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml#L4) |
| MDO-0009 | clarify | 1.9236 | NR: solo marca de cierre, sin inicio; Δ desde anterior registro: 10.34 min (no atribuir íntegro al comando) | [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml:18](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml#L18) |
| MDO-0009 | implement | 12.3896 | 61.91 min desde primer step/cut hasta último coste implement (incluye pausas/retrabajo) | [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml:32](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml#L32) |
| MDO-0009 | verify | 1.8632 | NR: solo marca de cierre, sin inicio; Δ desde anterior registro: 465.31 min (no atribuir íntegro al comando) | [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml:56](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml#L56) |
| MDO-0009 | close | 1.6528 | NR: solo marca de cierre, sin inicio; Δ desde anterior registro: 3.91 min (no atribuir íntegro al comando) | [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml:77](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml#L77) |
| MDO-0010 | specify | 27.0764 | 13.20 min desde creación de worktree hasta último coste specify (incluye setup, pausas y revisiones) | [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml:4](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml#L4) |
| MDO-0010 | implement | 16.0675 | 94.61 min desde primer step/cut hasta último coste implement (incluye pausas/retrabajo) | [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml:30](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml#L30) |
| MDO-0010 | verify | 0.8795 | NR: solo marca de cierre, sin inicio; Δ desde anterior registro: 13.30 min (no atribuir íntegro al comando) | [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml:76](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml#L76) |
| MDO-0010 | close | 1.2091 | NR: solo marca de cierre, sin inicio; Δ desde anterior registro: 4.50 min (no atribuir íntegro al comando) | [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml:94](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml#L94) |

Para setup/constitution/story/tasks/quick y las fases históricas sin costes, los logs disponibles no dan duración/coste por comando. No equivale a que no se ejecutaran. En MDO-0009 clarify y el inicio de implement se intercalan: no deben sumarse ventanas de presencia como si fueran etapas exclusivas.

### 2.3 Dónde se ve el tiempo y el coste

- **MDO-0009:** entre el cierre de coste implement y el cierre de coste verify hay **465.31 min (7 h 45 min)**: 86.5% de los 537.70 min de reloj. Esa ventana contiene espera, reinicio y verify; **no es una medición de espera del usuario**. [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml#L1).
- **MDO-0010:** los cortes T3 aparecen a 14:32:12 y 14:40:59 UTC; el primer contexto reducido se registra a 14:44:32. Son **12.34 min entre el primer aviso y la siguiente captura reducida**; el log no distingue cuánto fue espera y cuánto trabajo intermedio. [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/session-cuts.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/session-cuts.md#L1).
- **Trabajo del modelo:** en implement, Leader + Reviewer concentran **65.5% del coste** agregado de las cuatro specs con costes ($28.767/43.948 aproximadamente); no se puede convertir ese porcentaje en porcentaje de tiempo. Los fallos encontrados sí incluyen bugs reales. [specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/_log/costs.yml#L1); [specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r/_log/costs.yml#L1); [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/costs.yml#L1); [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/costs.yml#L1).
- **Gates visibles:** 26 archivos de gates conservan 26 duraciones Vitest, **192.128 s = 3.20 min**: MDO-0007 1.958 s; 0008 49.970 s; 0009 53.090 s; 0010 87.110 s. No incluye todos los RED, los tests del Implementer, verify, tipos/build/hooks ni CI. El CSV de evidencia desglosa archivo y línea de las 26 mediciones. No se puede declarar que todos los gates solo tardan 3.2 min.

### 2.4 Espera humana: medición insuficiente

`approvals.yml` guarda la respuesta pero no `asked_at`. `execution.md` guarda fecha sin hora por paso. `state.yml` no aparece en las specs revisadas. No hay emparejamiento persistido pregunta→respuesta ni duraciones de subagentes/gates por fase. Por tanto **la espera humana exacta por spec y comando es NR**, no cero. [src/spec/approvals.ts:9](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/spec/approvals.ts#L9); [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/execution.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/execution.md#L10)

Los informes Kaizen sí exportaron estos agregados a partir de transcripciones que no están en el repositorio:

| Spec | Pausas exportadas | Mediana | Turnos por tarea | Fuente |
|---|---|---|---|---|
| MDO-0008 | 11: 10 ≤5 min; 1 de 5–60 min | 0.6 min | 26, 43, 14, 11 | [docs/kaizen/MDO-0008.md:34](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0008.md#L34) |
| MDO-0009 | 24: 21 ≤5 min; 1 de 5–60; 2 >60 | 0.9 min | 42, 27, 21 | [docs/kaizen/MDO-0009.md:31](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0009.md#L31) |
| MDO-0010 | 51: 46 ≤5 min; 3 de 5–60; 2 >60 | 1.1 min | 42, 30, 55, 12, 19 | [docs/kaizen/MDO-0010.md:32](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0010.md#L32) |

**Esos agregados tampoco prueban espera por aprobación:** `readTranscript` mide desde la última respuesta a cada prompt del usuario; `pausesOf` reúne la transcripción entera de cada sesión, sin recortarla a la ventana de la spec. Las sesiones compartidas contaminan las atribuciones; algunas pausas son mensajes nuevos, no respuestas a una pregunta bloqueante. No sumar los buckets ni multiplicar su mediana para obtener horas de espera. [src/scripts/session-turns.ts:99](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/session-turns.ts#L99); [src/scripts/session-turns.ts:214](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/session-turns.ts#L214)

## 3. Mapa de flujos

Las flechas describen secuencia prescrita, no ejecuciones observadas en todas las specs. Los nombres se citan como datos; no se invocaron.

| Proceso | Orden | Variantes / evidencia |
|---|---|---|
| Setup nuevo/existente | CLI init → constitution → aprobación de fundamento | Modelos, idiomas, skills y branching en setup. En active, aprobar diff por archivo. [core/commands/init.md:18](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/init.md#L18); [core/commands/constitution.md:63](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/constitution.md#L63) |
| Unirse a equipo | sync → doctor → harness add si falta | Ya documentado en README; no repetir constitution completa si existe. [README.md:114](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/README.md#L114) |
| Story/feature standard/full | start → story opcional → specify → clarify si hay abiertos → aprobación design → tasks → aprobación tasks → implement → verify → close | `story` puede venir del tracker; full añade revisión adversarial de diseño. [core/commands/specify.md:98](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L98); [core/commands/tasks.md:79](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/tasks.md#L79) |
| Story/feature lite | start → specify (story + spec + tareas) → aprobación spec → implement → verify → close | ≤3 tareas inline; con más, tasks.md separado. No añadir una fase tasks vacía. [core/commands/tasks.md:31](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/tasks.md#L31) |
| Bug | start --type bug → specify (reproducción, causa, expected/actual; lite por defecto) → [clarify/aprobación] → implement con regresión RED → verify → close | [core/templates/shared/rules/spec-types.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/templates/shared/rules/spec-types.md#L10) |
| Hotfix | start --hotfix / specify --hotfix → flujo bug lite → implement → verify → close → confirmar back-merges requeridos | Se ramifica de hotfix.from; riesgo puede subir profundidad; el flujo actual no define una vía urgente que elimine verify/close. [core/templates/shared/rules/hotfix.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/templates/shared/rules/hotfix.md#L10) |
| Quick | start --quick o fallback spec-new → pre-check → worktree autorizado → cambio → post-check → gates → lite review → quick-log → commit | Si rompe gate, escala a story/specify. [core/commands/quick.md:33](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/quick.md#L33) |
| Reanudar | resume → ubicación/checkpoint/modelos → resolver commit pendiente o uncommitted diff → volver a implement | Fuera del worktree se detiene. [core/commands/resume.md:34](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/resume.md#L34) |

`perf` y `audit` son stub; `research` está planificado en README sin archivo canónico. No forman rutas ejecutables actuales. [core/commands/perf.md:6](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/perf.md#L6); [core/commands/audit.md:6](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/audit.md#L6); [README.md:240](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/README.md#L240)

## 4. Cargas y dependencias por comando

### Método de tokens

Estimación reproducible: **ceil(caracteres/4)**; no tokenizer del proveedor. En SVG/base64 esa regla puede subestimar bastante: los porcentajes de generados se calculan en caracteres, no se presentan como porcentajes exactos de tokens facturados. Los tamaños son de los archivos actuales, no de las revisiones históricas. Una lista de plantillas en frontmatter es un catálogo de dependencias, no prueba de que se carguen todas a la vez: `specify` ya indica carga condicional y los templates se resuelven a rutas. El total potencial no incluye sistema, herramientas, respuestas, diff ni contexto acumulado. [core/commands/specify.md:64](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L64); [src/render/render.ts:138](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/render/render.ts#L138)

| Comando | Canónico ≈ tokens | Reglas/plantillas declaradas ≈ tokens | Personas canónicas posibles ≈ tokens | Scripts declarados |
|---|---:|---:|---:|---:|
| audit (stub) | 247 | 0 (0 archivos) | 0 | 0 |
| clarify (stable) | 659 | 2,558 (5 archivos) | 0 | 4 |
| close (stable) | 1,931 | 2,237 (7 archivos) | 0 | 13 |
| constitution (stable) | 2,070 | 1,900 (12 archivos) | 0 | 2 |
| implement (stable) | 3,492 | 3,514 (7 archivos) | 2,432 | 17 |
| init (stable) | 244 | 0 (0 archivos) | 0 | 0 |
| perf (stub) | 345 | 0 (0 archivos) | 0 | 0 |
| quick (stable) | 1,275 | 2,851 (5 archivos) | 686 | 4 |
| resume (stable) | 763 | 974 (1 archivos) | 2,432 | 6 |
| specify (stable) | 2,739 | 7,944 (22 archivos) | 0 | 8 |
| story (stable) | 798 | 2,193 (5 archivos) | 0 | 3 |
| tasks (stable) | 1,442 | 4,034 (7 archivos) | 0 | 5 |
| verify (stable) | 1,326 | 3,495 (8 archivos) | 357 | 8 |

**Constitución disponible:** 9,335 tokens aproximados. Se debería cargar la parte relevante, no toda por reflejo. Config, sources, modelos y guías de módulo se añaden según el comando. El inventario JSON conserva cada ruta.

| Archivo compartido | Tokens aproximados |
|---|---:|
| [docs/constitution/CHANGELOG.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/CHANGELOG.md#L1) | 1,294 |
| [docs/constitution/architecture.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/architecture.md#L1) | 1,515 |
| [docs/constitution/business-rules.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/business-rules.md#L1) | 892 |
| [docs/constitution/critical-flows.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/critical-flows.md#L1) | 565 |
| [docs/constitution/glossary.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/glossary.md#L1) | 569 |
| [docs/constitution/infrastructure.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/infrastructure.md#L1) | 614 |
| [docs/constitution/performance.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/performance.md#L1) | 322 |
| [docs/constitution/product.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/product.md#L1) | 901 |
| [docs/constitution/security.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/security.md#L1) | 826 |
| [docs/constitution/standards.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/standards.md#L1) | 1,481 |
| [docs/constitution/ux.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/constitution/ux.md#L1) | 356 |
| [AGENTS.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/AGENTS.md#L1) | 725 |
| [.mandao/config.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/config.yml#L1) | 214 |
| [.mandao/sources.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/sources.yml#L1) | 37 |
| [.mandao/models.yml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/models.yml#L1) | 241 |
| [.agents/skills/codebase-conventions/SKILL.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.agents/skills/codebase-conventions/SKILL.md#L1) | 1,246 |

**Docs de las specs recientes antes de logs/reports:** MDO-0007 story+spec ≈4.2k; MDO-0008 story+spec+tasks ≈7.3k; MDO-0009 story+spec ≈8.8k; MDO-0010 story+spec+tasks ≈11.5k. Son sus archivos finales, no el payload exacto de cada turno. `composeBrief` recorta AC y escenarios, pero no incluye una estructura completa de decisiones: eso ayuda a explicar el fallo documentado, no prueba que cada Implementer haya leído toda la spec. [src/scripts/brief.ts:33](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/brief.ts#L33); [docs/kaizen/MDO-0010.md:85](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0010.md#L85)


### audit

Comando: [core/commands/audit.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/audit.md#L1) (≈247 tokens canónicos; archivo generado Codex ≈212 tokens).

**Lecturas requeridas/condicionales:** Contrato declarado, pero stub.

**Subagentes:** Ninguno: no implementado.

**Scripts declarados:** ninguno.

**Entradas declaradas:** {{paths.constitution}}/.

### clarify

Comando: [core/commands/clarify.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/clarify.md#L1) (≈659 tokens canónicos; archivo generado Codex ≈537 tokens).

**Lecturas requeridas/condicionales:** story, requirements/spec lite, design, tabla de consistencia y findings de trace; respuestas del PO/desarrollador.

**Subagentes:** Ninguno obligatorio.

**Scripts declarados:** `next`, `trace`, `diagram`, `commit-spec`.
 El presupuesto compartido añade lectura/registro de `cost`; pueden aparecer `red`, `tests`, `build` u otros dentro de los roles. La lista declarada no cuenta invocaciones reales.

| Regla/plantilla (catálogo; cargar solo cuando aplica) | Tokens ≈ |
|---|---:|
| [.mandao/templates/app/rules/context.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/context.md#L1) | 764 |
| [.mandao/templates/app/rules/consistency-check.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/consistency-check.md#L1) | 603 |
| [.mandao/templates/app/rules/spec-docs.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/spec-docs.md#L1) | 611 |
| [.mandao/templates/app/rules/doc-requirements.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-requirements.md#L1) | 189 |
| [.mandao/templates/app/rules/budget.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/budget.md#L1) | 391 |

**Entradas declaradas:** {{paths.specs}}/<ID>-<slug>/requirements.md [required]; {{paths.specs}}/<ID>-<slug>/design.md.

### close

Comando: [core/commands/close.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/close.md#L1) (≈1931 tokens canónicos; archivo generado Codex ≈1723 tokens).

**Lecturas requeridas/condicionales:** story/design/spec y verify-report; impacts, kaizen, releases y graph de commits; constitución y módulos solo con impactos aprobados.

**Subagentes:** Ninguno obligatorio; herramientas graph/diagram y tracker dependen de disponibilidad.

**Scripts declarados:** `where`, `next`, `status`, `branching`, `kaizen`, `kaizen-compare`, `close-summary`, `release-status`, `impacts`, `diagram`, `diagram-drift`, `publish-plan`, `commit-spec`.
 El presupuesto compartido añade lectura/registro de `cost`; pueden aparecer `red`, `tests`, `build` u otros dentro de los roles. La lista declarada no cuenta invocaciones reales.

| Regla/plantilla (catálogo; cargar solo cuando aplica) | Tokens ≈ |
|---|---:|
| [.mandao/templates/app/rules/context.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/context.md#L1) | 764 |
| [.mandao/templates/app/rules/spec-docs.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/spec-docs.md#L1) | 611 |
| [.mandao/templates/app/close/release-notes.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/close/release-notes.md#L1) | 71 |
| [.mandao/templates/app/close/technical.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/close/technical.md#L1) | 81 |
| [.mandao/templates/app/close/kaizen.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/close/kaizen.md#L1) | 53 |
| [.mandao/templates/app/rules/doc-close.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-close.md#L1) | 266 |
| [.mandao/templates/app/rules/budget.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/budget.md#L1) | 391 |

**Entradas declaradas:** {{paths.specs}}/<ID>-<slug>/.

### constitution

Comando: [core/commands/constitution.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/constitution.md#L1) (≈2070 tokens canónicos; archivo generado Codex ≈1784 tokens).

**Lecturas requeridas/condicionales:** Config/sources; constitución existente en active; AGENTS de proyectos/módulos; grafo y evidencias del stack.

**Subagentes:** Capacidad agents, pero no define un subagente concreto obligatorio. Skills de graph/arquitectura/producto pueden ampliar contexto.

**Scripts declarados:** `fingerprint`, `branching`.

| Regla/plantilla (catálogo; cargar solo cuando aplica) | Tokens ≈ |
|---|---:|
| [.mandao/templates/app/rules/context.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/context.md#L1) | 764 |
| [.mandao/templates/app/constitution/product.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/product.md#L1) | 84 |
| [.mandao/templates/app/constitution/business-rules.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/business-rules.md#L1) | 92 |
| [.mandao/templates/app/constitution/glossary.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/glossary.md#L1) | 60 |
| [.mandao/templates/app/constitution/critical-flows.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/critical-flows.md#L1) | 64 |
| [.mandao/templates/app/constitution/architecture.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/architecture.md#L1) | 163 |
| [.mandao/templates/app/constitution/standards.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/standards.md#L1) | 244 |
| [.mandao/templates/app/constitution/security.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/security.md#L1) | 131 |
| [.mandao/templates/app/constitution/performance.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/performance.md#L1) | 71 |
| [.mandao/templates/app/constitution/ux.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/ux.md#L1) | 30 |
| [.mandao/templates/app/constitution/infrastructure.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/infrastructure.md#L1) | 141 |
| [.mandao/templates/app/constitution/CHANGELOG.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/constitution/CHANGELOG.md#L1) | 56 |

**Entradas declaradas:** .mandao/config.yml [required]; .mandao/sources.yml; {{paths.constitution}}/.

### implement

Comando: [core/commands/implement.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L1) (≈3492 tokens canónicos; archivo generado Codex ≈3090 tokens).

**Lecturas requeridas/condicionales:** tasks/spec lite y progress; modelos; brief con AC/escenarios, módulos, gates, skills, grafo; gate logs y review packs a través de scripts.

**Subagentes:** Leader en sesión principal; tests-only por Tester en riesgo/strong o Implementer; Implementer en contexto fresco; Reviewer/reviewer_alt u otro harness. Por tarea con TDD, normalmente hay handoff RED, handoff implementación y review.

**Scripts declarados:** `where`, `next`, `models`, `status`, `tasks`, `step`, `brief`, `loop`, `checkpoint`, `resources`, `gates`, `review-pack`, `review`, `commit`, `pr-plan`, `mutation`, `implement-summary`.
 El presupuesto compartido añade lectura/registro de `cost`; pueden aparecer `red`, `tests`, `build` u otros dentro de los roles. La lista declarada no cuenta invocaciones reales.

**Personas disponibles para esos roles:** [core/personas/leader.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/leader.md#L1) ≈764, [core/personas/implementer.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/implementer.md#L1) ≈625, [core/personas/reviewer.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/reviewer.md#L1) ≈686, [core/personas/tester.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/tester.md#L1) ≈357. Sus tokens están en contextos distintos, no todos en el del Leader.

| Regla/plantilla (catálogo; cargar solo cuando aplica) | Tokens ≈ |
|---|---:|
| [.mandao/templates/app/rules/review.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/review.md#L1) | 974 |
| [.mandao/templates/app/rules/clean-code.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/clean-code.md#L1) | 227 |
| [.mandao/templates/app/rules/test-policy.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/test-policy.md#L1) | 1189 |
| [.mandao/templates/app/rules/commits.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/commits.md#L1) | 375 |
| [.mandao/templates/app/spec/execution.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/execution.md#L1) | 269 |
| [.mandao/templates/app/spec/pivot-record.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/pivot-record.md#L1) | 89 |
| [.mandao/templates/app/rules/budget.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/budget.md#L1) | 391 |

**Entradas declaradas:** {{paths.specs}}/<ID>-<slug>/tasks.md [required]; {{paths.specs}}/<ID>-<slug>/_log/progress.yml.

### init

Comando: [core/commands/init.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/init.md#L1) (≈244 tokens canónicos; archivo generado Codex ≈222 tokens).

**Lecturas requeridas/condicionales:** CLI: config si existe; entrada detectada del workspace.

**Subagentes:** Ninguno requerido por el comando; el CLI muestra prompts.

**Scripts declarados:** ninguno.

**Entradas declaradas:** ninguna.

### perf

Comando: [core/commands/perf.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/perf.md#L1) (≈345 tokens canónicos; archivo generado Codex ≈261 tokens).

**Lecturas requeridas/condicionales:** Contrato declarado, pero stub.

**Subagentes:** Ninguno: no implementado.

**Scripts declarados:** ninguno.

**Entradas declaradas:** {{paths.constitution}}/performance.md; {{paths.constitution}}/critical-flows.md.

### quick

Comando: [core/commands/quick.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/quick.md#L1) (≈1275 tokens canónicos; archivo generado Codex ≈1068 tokens).

**Lecturas requeridas/condicionales:** AGENTS/standards, quick gate y review; diff, quick-log y estado del checkout.

**Subagentes:** Un Reviewer independiente, con alternativa/cross-harness si hace falta. No hay Tester dedicado obligatorio para un cambio sin tests.

**Scripts declarados:** `cost`, `quick-check`, `spec-new`, `quick-log`.
 El presupuesto compartido añade lectura/registro de `cost`; pueden aparecer `red`, `tests`, `build` u otros dentro de los roles. La lista declarada no cuenta invocaciones reales.

**Personas disponibles para esos roles:** [core/personas/reviewer.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/reviewer.md#L1) ≈686. Sus tokens están en contextos distintos, no todos en el del Leader.

| Regla/plantilla (catálogo; cargar solo cuando aplica) | Tokens ≈ |
|---|---:|
| [.mandao/templates/app/rules/context.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/context.md#L1) | 764 |
| [.mandao/templates/app/rules/quick-gate.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/quick-gate.md#L1) | 347 |
| [.mandao/templates/app/rules/review.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/review.md#L1) | 974 |
| [.mandao/templates/app/rules/commits.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/commits.md#L1) | 375 |
| [.mandao/templates/app/rules/budget.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/budget.md#L1) | 391 |

**Entradas declaradas:** {{paths.constitution}}/standards.md; AGENTS.md.

### resume

Comando: [core/commands/resume.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/resume.md#L1) (≈763 tokens canónicos; archivo generado Codex ≈636 tokens).

**Lecturas requeridas/condicionales:** story y progress, últimas filas de execution, modelos de este harness, diff y cola de commits; brief al continuar.

**Subagentes:** Reutiliza roles del loop implement cuando continúa; dashboard sin id no lanza agentes.

**Scripts declarados:** `where`, `models`, `tasks`, `loop`, `checkpoint`, `commit`.

**Personas disponibles para esos roles:** [core/personas/leader.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/leader.md#L1) ≈764, [core/personas/implementer.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/implementer.md#L1) ≈625, [core/personas/reviewer.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/reviewer.md#L1) ≈686, [core/personas/tester.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/tester.md#L1) ≈357. Sus tokens están en contextos distintos, no todos en el del Leader.

| Regla/plantilla (catálogo; cargar solo cuando aplica) | Tokens ≈ |
|---|---:|
| [.mandao/templates/app/rules/review.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/review.md#L1) | 974 |

**Entradas declaradas:** {{paths.specs}}/; {{paths.specs}}/<ID>-<slug>/_log/progress.yml.

### specify

Comando: [core/commands/specify.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L1) (≈2739 tokens canónicos; archivo generado Codex ≈2114 tokens).

**Lecturas requeridas/condicionales:** story o start.yml; constitución relevante; AGENTS de módulos; requirements/design o spec lite; quickstart/data-model/contract solo si aplican.

**Subagentes:** Ninguno nombrado para la ruta normal; full exige revisión adversarial. Skills brainstorming o producto según punto de partida.

**Scripts declarados:** `next`, `spec-new`, `trace`, `diagram`, `branching`, `commit-spec`, `resources`, `premise`.
 El presupuesto compartido añade lectura/registro de `cost`; pueden aparecer `red`, `tests`, `build` u otros dentro de los roles. La lista declarada no cuenta invocaciones reales.

| Regla/plantilla (catálogo; cargar solo cuando aplica) | Tokens ≈ |
|---|---:|
| [.mandao/templates/app/rules/context.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/context.md#L1) | 764 |
| [.mandao/templates/app/rules/spec-docs.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/spec-docs.md#L1) | 611 |
| [.mandao/templates/app/rules/traceability.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/traceability.md#L1) | 371 |
| [.mandao/templates/app/rules/consistency-check.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/consistency-check.md#L1) | 603 |
| [.mandao/templates/app/rules/test-policy.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/test-policy.md#L1) | 1189 |
| [.mandao/templates/app/spec/story.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/story.md#L1) | 271 |
| [.mandao/templates/app/spec/requirements.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/requirements.md#L1) | 206 |
| [.mandao/templates/app/spec/design.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/design.md#L1) | 186 |
| [.mandao/templates/app/spec/quickstart.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/quickstart.md#L1) | 82 |
| [.mandao/templates/app/spec/spec.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/spec.md#L1) | 333 |
| [.mandao/templates/app/spec/tasks.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/tasks.md#L1) | 169 |
| [.mandao/templates/app/spec/data-model.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/data-model.md#L1) | 135 |
| [.mandao/templates/app/rules/diagram.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/diagram.md#L1) | 627 |
| [.mandao/templates/app/rules/hotfix.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/hotfix.md#L1) | 124 |
| [.mandao/templates/app/rules/spec-types.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/spec-types.md#L1) | 140 |
| [.mandao/templates/app/rules/doc-data-model.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-data-model.md#L1) | 267 |
| [.mandao/templates/app/rules/doc-requirements.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-requirements.md#L1) | 189 |
| [.mandao/templates/app/rules/doc-design.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-design.md#L1) | 422 |
| [.mandao/templates/app/rules/doc-lite.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-lite.md#L1) | 439 |
| [.mandao/templates/app/rules/doc-quickstart.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-quickstart.md#L1) | 96 |
| [.mandao/templates/app/rules/doc-tasks.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-tasks.md#L1) | 329 |
| [.mandao/templates/app/rules/budget.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/budget.md#L1) | 391 |

**Entradas declaradas:** {{paths.specs}}/<ID>-<slug>/story.md; {{paths.constitution}}/ [required]; .mandao/sources.yml.

### story

Comando: [core/commands/story.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/story.md#L1) (≈798 tokens canónicos; archivo generado Codex ≈717 tokens).

**Lecturas requeridas/condicionales:** sources, constitución relevante, business-rules/glossary/critical-flows; tracker y fuentes si están configurados; story a escribir.

**Subagentes:** Ninguno obligatorio. Usa brainstorming desde cero o product-manager-toolkit con contexto.

**Scripts declarados:** `next`, `spec-new`, `trace`.
 El presupuesto compartido añade lectura/registro de `cost`; pueden aparecer `red`, `tests`, `build` u otros dentro de los roles. La lista declarada no cuenta invocaciones reales.

| Regla/plantilla (catálogo; cargar solo cuando aplica) | Tokens ≈ |
|---|---:|
| [.mandao/templates/app/rules/context.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/context.md#L1) | 764 |
| [.mandao/templates/app/rules/spec-docs.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/spec-docs.md#L1) | 611 |
| [.mandao/templates/app/spec/story.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/story.md#L1) | 271 |
| [.mandao/templates/app/rules/doc-story.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-story.md#L1) | 156 |
| [.mandao/templates/app/rules/budget.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/budget.md#L1) | 391 |

**Entradas declaradas:** .mandao/sources.yml; {{paths.constitution}}/.

### tasks

Comando: [core/commands/tasks.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/tasks.md#L1) (≈1442 tokens canónicos; archivo generado Codex ≈1125 tokens).

**Lecturas requeridas/condicionales:** requirements/spec lite, design, story/AC, guías de módulos, reglas de test/review; tasks existente si se reanuda.

**Subagentes:** Ninguno obligatorio.

**Scripts declarados:** `where`, `next`, `trace`, `tasks`, `commit-spec`.
 El presupuesto compartido añade lectura/registro de `cost`; pueden aparecer `red`, `tests`, `build` u otros dentro de los roles. La lista declarada no cuenta invocaciones reales.

| Regla/plantilla (catálogo; cargar solo cuando aplica) | Tokens ≈ |
|---|---:|
| [.mandao/templates/app/rules/spec-docs.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/spec-docs.md#L1) | 611 |
| [.mandao/templates/app/spec/tasks.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/tasks.md#L1) | 169 |
| [.mandao/templates/app/rules/test-policy.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/test-policy.md#L1) | 1189 |
| [.mandao/templates/app/rules/traceability.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/traceability.md#L1) | 371 |
| [.mandao/templates/app/rules/review.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/review.md#L1) | 974 |
| [.mandao/templates/app/rules/doc-tasks.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-tasks.md#L1) | 329 |
| [.mandao/templates/app/rules/budget.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/budget.md#L1) | 391 |

**Entradas declaradas:** {{paths.specs}}/<ID>-<slug>/requirements.md [required]; {{paths.specs}}/<ID>-<slug>/design.md [required].

### verify

Comando: [core/commands/verify.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/verify.md#L1) (≈1326 tokens canónicos; archivo generado Codex ≈1037 tokens).

**Lecturas requeridas/condicionales:** Docs de la spec, estado y trace vía verify-plan, gate/review logs relevantes, quickstart si existe; verify-report a escribir.

**Subagentes:** Un Tester en contexto fresco por suite; no un único Tester necesariamente. E2E y unit se separan.

**Scripts declarados:** `where`, `next`, `verify-plan`, `tests`, `build`, `status`, `trace`, `commit-spec`.
 El presupuesto compartido añade lectura/registro de `cost`; pueden aparecer `red`, `tests`, `build` u otros dentro de los roles. La lista declarada no cuenta invocaciones reales.

**Personas disponibles para esos roles:** [core/personas/tester.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/tester.md#L1) ≈357. Sus tokens están en contextos distintos, no todos en el del Leader.

| Regla/plantilla (catálogo; cargar solo cuando aplica) | Tokens ≈ |
|---|---:|
| [.mandao/templates/app/rules/spec-docs.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/spec-docs.md#L1) | 611 |
| [.mandao/templates/app/spec/verify-report.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/spec/verify-report.md#L1) | 119 |
| [.mandao/templates/app/rules/test-policy.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/test-policy.md#L1) | 1189 |
| [.mandao/templates/app/rules/traceability.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/traceability.md#L1) | 371 |
| [.mandao/templates/app/rules/consistency-check.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/consistency-check.md#L1) | 603 |
| [.mandao/templates/app/rules/doc-verify.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-verify.md#L1) | 115 |
| [.mandao/templates/app/rules/doc-quickstart.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/doc-quickstart.md#L1) | 96 |
| [.mandao/templates/app/rules/budget.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.mandao/templates/app/rules/budget.md#L1) | 391 |

**Entradas declaradas:** {{paths.specs}}/<ID>-<slug>/.

## 5. Interrupciones humanas

Clasificación: **P** producto/alcance/política del equipo; **E** externa/irreversible o uso de presupuesto expresamente autorizado; **T** detalle técnico/operativo que puede delegarse dentro de límites. Cada fila es un punto o familia condicional; no implica una pausa en cada ejecución. Bloqueos por bug real/RED/trace no son por sí solos preguntas humanas.

| Comando | Punto de parada/pregunta | Clase | Tratamiento | Evidencia |
|---|---|---|---|---|
| init | harnesses/perfiles/idiomas/modelos/presupuesto | P | Elegir preferencias; preguntar solo valores no configurados o pedidos por el usuario. | [src/cli/init.ts:81](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/init.ts#L81) |
| init | confirmar proyectos detectados y corregir perfiles | P/T | Detección técnica automática; confirmar solo ambigüedad material. | [src/cli/init.ts:113](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/init.ts#L113) |
| init | scope/polyrepo estrategia/home | P | Decide dónde se escriben artefactos; conservar cuando no está configurado. | [src/cli/init.ts:259](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/init.ts#L259) |
| init | confirmar defaults en terminal no interactiva | E/T | Escritura local reversible; permitir autorización de sesión explícita y defaults revisables. | [core/commands/init.md:23](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/init.md#L23) |
| init | selección e instalación de skills | E | Ejecuta instaladores externos: conservar confirmación del paquete/origen. | [src/cli/init-skills.ts:45](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/init-skills.ts#L45) |
| constitution | definir intención/stack en proyecto nuevo | P/T | Separar objetivo del producto de elección técnica delegable. | [core/commands/constitution.md:52](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/constitution.md#L52) |
| constitution | aprobar docs draft o diff por archivo en active | P | Conservar agrupando los cambios de una revisión. | [core/commands/constitution.md:63](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/constitution.md#L63) |
| constitution | autorizar exclusiones/hooks/instaladores | E | Conservar para instalación; no repetir por herramientas ya instaladas. | [core/commands/constitution.md:72](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/constitution.md#L72) |
| constitution | confirmar branching, incluso ya configurado | P | Preferir reconfirmación solo al proponer cambio del modelo. | [core/commands/constitution.md:111](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/constitution.md#L111) |
| constitution | resolver tecnologías dropped y aprobar skills | P/E | No inventar convenciones; agrupar preguntas y autorización de instalaciones. | [core/commands/constitution.md:142](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/constitution.md#L142) |
| story | crear item en tracker; publicar AC aprobados | E | Conservar payload previo; no repetir si ya autorizado en la sesión. | [core/commands/story.md:40](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/story.md#L40) |
| story | hasta cinco preguntas de suficiencia | P/T | Buscar fuentes antes; detalles técnicos reversibles pueden ir a decisión del agente. | [core/commands/story.md:46](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/story.md#L46) |
| story | aprobar story | P | Puede combinarse con aprobación spec en lite si el alcance está completo. | [core/commands/story.md:65](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/story.md#L65) |
| specify | sin ref: ID/create/no tracker | P/E | No preguntar si start.yml/story ya lo resuelve; código ya lo prescribe. | [core/commands/specify.md:79](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L79) |
| specify | fallback creación de branch/worktree e instalación de dependencias | E/T | Automatizar tras autorización inicial; usuario no decide nombres internos cada vez. | [core/commands/specify.md:88](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L88) |
| specify/tasks/implement/verify/close/quick | cambiar de checkout; en no-Claude imprime resume y se detiene | T | El estado de trabajo correcto es necesario; el transporte manual no es una decisión de producto. | [core/commands/specify.md:99](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L99) |
| specify | critical OPEN bloquea; riesgo puede cambiar profundidad | P/T | Mantener decisión de alcance; decidir detalles ya cubiertos por constitución. | [core/commands/specify.md:118](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L118) |
| specify | revisión/diagrama y aprobación de requirements/design o spec lite | P | Conservar un gate de aprobación, con artefacto concreto. | [core/commands/specify.md:194](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L194) |
| clarify | toda pregunta técnica al developer | T | Cambiar por solo la pregunta técnica irreversible o fuera de política; resolver el resto con evidencia. | [core/commands/clarify.md:34](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/clarify.md#L34) |
| clarify | pregunta de negocio al PO y comentario MCP con confirmación | P/E | Producto requiere respuesta; publicación externa necesita autorización. | [core/commands/clarify.md:36](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/clarify.md#L36) |
| clarify | diseño cambiado: regenerar diagrama y aprobar otra vez | P/T | Reaprobar semántica de alcance; no formato/ortografía sin cambio de significado. | [core/commands/clarify.md:50](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/clarify.md#L50) |
| tasks | aprobar overview/tasks | P | Preservar; no ejecutar comando separado si lite ya tiene tareas aprobadas. | [core/commands/tasks.md:79](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/tasks.md#L79) |
| implement | draft o cambio tras resumen: una pregunta antes de aprobar por invocación | P/T | Conservar para pendientes materiales; hash de texto dispara también en cambios cosméticos. | [src/cli/approve.ts:189](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/approve.ts#L189) |
| implement | cap superado: await-budget | E | Conservar: el presupuesto lo define el humano, hoy no hay cap por defecto. | [core/commands/implement.md:70](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L70) |
| implement | session.stop por estimación de ahorro | T | Rotación automática o aviso no bloqueante según política; no repetir en el mismo límite. | [core/commands/implement.md:74](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L74) |
| implement | resources defer; esperar o forzar con petición del usuario | T/E | Proteger máquina; diferir a CI automáticamente cuando el contrato de entrega lo permita. | [core/commands/implement.md:111](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L111) |
| implement | PIVOT: spec errónea, esperar firma | P | Conservar cuando cambia el alcance/contrato. | [core/commands/implement.md:149](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L149) |
| implement | tres FAIL strong: HALT y reportar | P/T | No borrar el halt: distinguir fallo de código de bloqueo de infraestructura antes de consumir reintento. | [src/spec/loop.ts:190](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/spec/loop.ts#L190) |
| implement | commit no permitido en harness; pending-commit | E/T | Aprobación git del harness puede ser legítima; no bloquear trabajo disjunto. | [core/commands/implement.md:162](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L162) |
| implement→verify | corte de sesión en frontera de comandos | T | No requiere decisión de producto. La ejecución actual recomienda nueva conversación. | [src/cli/session-advice.ts:70](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/session-advice.ts#L70) |
| verify | tasks abiertos, worktree incorrecto o trabajo sin commit | T | Bloqueo correcto si evita verificar estado parcial; resolver mecánicamente lo que ya tiene PASS. | [core/commands/verify.md:50](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/verify.md#L50) |
| verify | fallo/product bug: recomendar nueva tarea/quick; reporta blocker | P/T | Conservar corrección, no pedir permiso por detalles del fix ya cubierto. | [core/commands/verify.md:85](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/verify.md#L85) |
| close | aprobar estandarización Kaizen e impactos por archivo | P | Agrupar; evitar reaprobar elementos ya autorizados en approvals.yml. | [core/commands/close.md:67](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/close.md#L67) |
| close | confirmar publicación al tracker por target | E | Conservar; saltar payload unchanged y reutilizar autorización exacta vigente. | [core/commands/close.md:115](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/close.md#L115) |
| close | confirmar back-merge de hotfix | E | Conservar confirmación de acción externa; recordatorio no requiere detener toda la documentación. | [core/commands/close.md:105](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/close.md#L105) |
| close | cleanup worktree después de merge, modo ask | E | Puede delegarse con auto-after-merge y comprobación de checkout limpio. | [core/commands/close.md:138](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/close.md#L138) |
| quick | confirmar fallback de worktree | E/T | Misma autorización de setup que start; no debe confundirse con permiso para editar README. | [core/commands/quick.md:47](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/quick.md#L47) |
| quick | gate excedido → escalar | P | Conservar límite, pero documentar si el exceso es solo bookkeeping obligatorio. | [core/commands/quick.md:70](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/quick.md#L70) |
| resume | opciones revisar/continuar/descartar diff sin commit | T/E | Si checkpoint inequívoco, continuar por defecto; descartar requiere confirmación. | [core/commands/resume.md:45](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/resume.md#L45) |
| todos con budget | 80% aviso; 100% confirmación si hay cap | E | No confundir aviso con pausa; evitar cap inventado. | [core/templates/shared/rules/budget.md:10](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/templates/shared/rules/budget.md#L10) |
| skills opcionales | brainstorming desde cero: preguntas de diseño | P/T | Es rama condicional, no coste fijo para una story con contexto. | [core/commands/specify.md:72](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L72) |

El conteo real por clase es **NR**: ni approvals ni execution guardan la pregunta, clase, asked_at, answered_at y duración. El catálogo no debe convertirse en un número de interrupciones observadas.

## 6. Guards, falsos positivos y chequeos repetidos

### Casos con evidencia, separando histórico y vigente

| Caso | Diagnóstico | Propuesta y riesgo | Evidencia |
|---|---|---|---|
| Match de palabras de seguridad bloqueaba un PASS que explicaba un fix | **Falso positivo histórico confirmado y ya corregido**: texto sin tag solo se convierte en nota. No se debe atribuir a la versión actual la heurística antigua. | Conservar bloqueo estructurado de hallazgos abiertos. | [src/spec/review-findings.ts:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/spec/review-findings.ts#L1) |
| Tag security/high en texto marcado resuelto o en cita | **Riesgo vigente demostrable por lectura**, no incidencia medida: `securityBlockers` filtra toda línea por regex, sin estado ni distinción finding/cita. | Salida estructurada con status=open/resolved y severity; bloquear solo findings abiertos. Riesgo medio de clasificación incorrecta, requiere tests de regresión. | [src/spec/review-findings.ts:8](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/spec/review-findings.ts#L8); [src/cli/checkpoint-guards.ts:49](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/checkpoint-guards.ts#L49) |
| Hash de aprobación compara todo salvo status | Cambiar espacios/prosa no semántica puede obligar reaprobar; **riesgo vigente, no tasa observada**. La política de hash es explícita, no un bug probado de implementación. | Hash de sección/semántica o aprobación por delta clasificado; nunca ignorar automáticamente cambios a AC/contratos. | [src/spec/approvals.ts:26](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/spec/approvals.ts#L26); [src/spec/next.ts:108](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/spec/next.ts#L108) |
| Todo detalle técnico en clarify termina en persona | Exigencia humana real en el texto, sin evidencia de cuántas pausas causó. | Delegar decisiones reversibles dentro de constitución. Riesgo bajo con registro; conservar P/E. | [core/commands/clarify.md:34](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/clarify.md#L34) |
| Prueba de premise High nunca puede ser lectura/búsqueda | Puede exigir probe para hechos documentales/estáticos. **No demuestra por sí solo que los probes observados fueran redundantes**: MDO-0006 sí tuvo una premise falsa encontrada tarde. | Tipo de premise: runtime requiere ejecución; hecho sintáctico admite evidencia AST/archivo precisa. Riesgo medio; mantener probes para comportamiento. | [core/templates/shared/rules/doc-design.md:18](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/templates/shared/rules/doc-design.md#L18); [docs/kaizen/MDO-0006.md:63](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0006.md#L63) |
| Falta de gitleaks/semgrep | Se repite NOT_INSTALLED, pero **no bloquea** `gatesPassed`; no culparla de horas de detención. El encabezado "Every configured gate passed" es demasiado optimista. | Probar disponibilidad una vez por entorno y cachear; distinguir PASS de INCOMPLETE en resumen; cobertura completa en CI. | [src/scripts/gates.ts:30](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/gates.ts#L30); [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/gates/T1-1.md:3](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/gates/T1-1.md#L3) |
| Cada test nuevo debe haber figurado por nombre en RED | Puede tratar un rename de test como escenario nuevo; regex no modela test parametrizado/dinámico con precisión. **Riesgo, no falsos positivos contados**. | IDs estables de escenario y evidencia por caso; excepciones trazables de rename, mantener control RED del nuevo comportamiento. | [src/scripts/red.ts:31](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/red.ts#L31); [src/cli/checkpoint-guards.ts:17](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/checkpoint-guards.ts#L17) |
| Types/lint/gates repetidos a igual árbol | Repetición prescrita: Implementer → Leader → hook → verify; no todo rerun es redundante si cambia el árbol. | Recibo de gates por hash + config/tool versions; nuevo review tras cambio real, no otro review de los mismos bytes. | [core/personas/implementer.md:30](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/implementer.md#L30); [src/cli/run-leader.ts:78](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/run-leader.ts#L78); [scripts/hooks/pre-commit:5](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/scripts/hooks/pre-commit#L5) |
| Corte de sesión repite T3 | Dos stop antes de nuevo contexto reducido; factor de interrupción observado, no tiempo de aprobación exacto. Constantes de 15 turnos/tarea y 10k reload son hipótesis; Kaizen muestra desajuste. | Ajustar con muestras y deduplicar por frontera. Coste de cambio de sesión y latencia humana deben entrar al cálculo. | [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/session-cuts.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/session-cuts.md#L1); [src/scripts/session-cut.ts:13](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/session-cut.ts#L13); [docs/kaizen/MDO-0010.md:43](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/docs/kaizen/MDO-0010.md#L43) |

**No falsos positivos:** el review de MDO-0010 T1 encontró aprobación que pasaba por encima de un critical OPEN, critical findings omitidos y hash de shown que tapaba una aprobación anterior. T2 de MDO-0009 encontró un fallo real que podía dejar una skill a medio copiar. Esos FAILs protegen calidad; quitar el Reviewer o el gate correspondiente escondería defectos. [specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/reviews/T1-1-review.md:7](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/_log/reviews/T1-1-review.md#L7); [specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/execution.md:22](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/_log/execution.md#L22)

## 7. Duplicación: qué consolidar y qué conservar

| Duplicación | Fuentes | Acción |
|---|---|---|
| TDD, no weakening y mutación | [core/commands/implement.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L1); [core/templates/shared/rules/test-policy.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/templates/shared/rules/test-policy.md#L1); [core/personas/implementer.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/implementer.md#L1); [src/cli/checkpoint-guards.ts:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/checkpoint-guards.ts#L1) | Dejar una política canónica y contrato mínimo por rol; mantener el guard ejecutable. No son duplicados eliminables los tests de regresión y la validación independiente. |
| Checklist/independencia y formato del verdict | [core/commands/implement.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L1); [core/templates/shared/rules/review.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/templates/shared/rules/review.md#L1); [core/personas/reviewer.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/reviewer.md#L1); [src/scripts/review.ts:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/review.ts#L1) | Generar el resumen para cada rol desde la política; evitar que un review pack vuelva a contar todas las reglas. Mantener el contexto independiente. |
| Cobertura de cada cláusula en Done when | [core/commands/tasks.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/tasks.md#L1); [core/templates/shared/rules/doc-tasks.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/templates/shared/rules/doc-tasks.md#L1); [core/templates/shared/rules/traceability.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/templates/shared/rules/traceability.md#L1); [src/scripts/brief.ts:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/brief.ts#L1) | Hay tensión actual: tasks manda listar toda cláusula/alternativa, doc-tasks dice añadir solo lo no dicho en requirements y no repetir decisiones. Derivar checklist por IDs y separar índice de detalle en una única fuente. |
| Worktree, EnterWorktree y resume | [core/commands/specify.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L1); [core/commands/tasks.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/tasks.md#L1); [core/commands/implement.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L1); [core/commands/verify.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/verify.md#L1) | Consolidar procedimiento por harness y resultado de where en una política de transporte; no copiar ramas completas por comando. El guard de ubicación sí debe permanecer. |
| Budget start/end y coste | [core/commands/specify.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L1); [core/commands/implement.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L1); [core/templates/shared/rules/budget.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/templates/shared/rules/budget.md#L1); [src/cli/run-cost.ts:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/cli/run-cost.ts#L1) | Mover contabilidad automática al orquestador y dejar autorización del cap como política. El coste de repetir un puntero es pequeño; el problema es volver a abrir una sesión/recorrer todo el transcript. |
| Disciplina profesional: done/evidence/uncertainty | [core/personas/leader.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/leader.md#L1); [core/personas/implementer.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/implementer.md#L1); [core/personas/reviewer.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/reviewer.md#L1); [core/personas/tester.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/personas/tester.md#L1) | Compartir origen al generar personas, conservar en cada rol el mínimo que necesita para actuar; los contextos separados no comparten automáticamente un prompt. |
| Copias por harness y exports claro/oscuro | [core/commands/specify.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/specify.md#L1); [.agents/skills/mandao-specify/SKILL.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.agents/skills/mandao-specify/SKILL.md#L1); [.claude/skills/mandao-specify/SKILL.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.claude/skills/mandao-specify/SKILL.md#L1); [scripts/diagrams/build.mjs:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/scripts/diagrams/build.mjs#L1) | Son salidas de distribución deliberadas: no eliminarlas del producto. Sí evitar leerlas todas/revisarlas semánticamente cuando su origen y hash están verificados. |

**Contradicción concreta de carga:** el brief estructurado incluye AC, escenarios, skill-map y gates, pero no una sección de decisiones/rechazados. A la vez `tasks.md` pide materializar cada alternativa rechazada en Done when, mientras `doc-tasks.md:16` pide no repetir decisiones. Es una fuente plausible de omisión respaldada por tres FAILs históricos; la latencia causal exacta no está registrada. [src/scripts/brief.ts:33](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/brief.ts#L33); [core/commands/tasks.md:60](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/tasks.md#L60); [core/templates/shared/rules/doc-tasks.md:16](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/templates/shared/rules/doc-tasks.md#L16)

## 8. Qué recortar con control y qué cambia la calidad

| Recortar/consolidar con controles equivalentes | No quitar sin aceptar pérdida/cambio de calidad |
|---|---|
| SVG/exports y copias generadas del prompt cuando existe recibo mecánico; conservar diff completo accesible | Revisión independiente, especialmente tras bugs reales encontrados |
| Reruns a bytes/config/entorno idénticos mediante recibo cacheado | Tests de regresión, gates que cubren cambios reales y e2e crítico |
| Preguntas de transporte, detalles reversibles y reconfirmaciones ya autorizadas | Aprobación de alcance, contratos, presupuestos explícitos, publicación y borrado |
| Contabilidad de coste y triage de disponibilidad ejecutados como scripts | Evidencia de RED antes del nuevo comportamiento y mutación de caracterización |
| Duplicación manual de cláusulas, manteniendo matriz/checklist generada | Omitir cláusulas o alternativas prohibidas para acortar el brief |
| Una fase tasks separada cuando lite ya la resuelve (ya existe) | Forzar lite en seguridad/contratos/multiproyecto para ahorrar trámites |
| Review incremental tras fix, con manifest de cambios y hallazgos pendientes | Dar PASS automático después del primer Reviewer FAIL |


Paralelizar tareas `parallel_safe` podría acortar el camino crítico, pero el flujo actual elige una `next` y usa un checkout y cola de ejecución compartidos. Requiere aislamiento por tarea y contratos/merges definidos; no es una optimización gratis. [src/spec/plan.ts:8](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/spec/plan.ts#L8); [src/scripts/run-tests.ts:73](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/src/scripts/run-tests.ts#L73); [core/commands/implement.md:59](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/core/commands/implement.md#L59)

## 9. Plan recomendado, sin implementación

1. **Primero:** baseline fiable y vista de costes corregida; medir active, waiting-user, waiting-agent, queue y gate duration. Recoger intentos/finding IDs y manifest de review/commit.
2. **Después, sin cambiar políticas de aceptación:** compactar packs generados, corregir manifest de commit, deduplicar corte de sesión y compartir recibos de checks idénticos.
3. **Luego:** checklist de cláusulas/decisiones generada y triage técnico automático dentro de constitución. Validar que baja first-pass rework sin aumentar bugs escapados.
4. **Experimento opt-in de riesgo medio:** continuidad RED→GREEN para bajo riesgo, cambios del modelo Leader, paralelismo aislado. Comparar con grupo equivalente; no dar por seguro que un modelo más barato tarda menos o produce la misma calidad.

Métricas de aceptación para decidir, no valores inventados: wall-clock p50/p90, active/wait separados, coste por base facturado/equivalente, rework por causa, precisión del guard, defectos escapados, proporción de tokens de código canónico vs generados, y checks reutilizados con recibo válido.

## 10. Evidencia y limitaciones

- [inventory.json](2026-10-latency/inventory.json): archivos, plantillas, tokens estimados, entradas/salidas, scripts, filas de ejecución, costes, aprobaciones, cuts y duraciones Vitest con archivo/línea.
- [command-files.csv](2026-10-latency/command-files.csv): una fila por archivo/papel de cada comando.
- [cost-records.csv](2026-10-latency/cost-records.csv): registro individual con coste y duplicado histórico detectado.
- [gate-test-times.csv](2026-10-latency/gate-test-times.csv): duración guardada de cada run y su fuente.
- [review-packs.csv](2026-10-latency/review-packs.csv): volumen del pack y parte generada.
- No se leyeron transcripciones privadas fuera del repo, no se consultó facturación, no se midió red/proveedor, y los agregados Kaizen se trataron como evidencia derivada, con sus defectos de ventana explícitos.
- Snapshot actual y ejecución histórica no son idénticos: varios problemas ya se corrigieron entre specs. Cada hallazgo distingue hecho histórico, comportamiento vigente y riesgo no observado.
- No se puede convertir una estimación de tokens en segundos, USD en duración o pausas en tiempo de aprobación sin más eventos.


## Apéndice: personas generadas realmente presentes

Anexo tabular: [role-files.csv](2026-10-latency/role-files.csv).

Estos archivos son representaciones alternativas de las personas canónicas: **no sumar ambos tamaños** como si el mismo rol cargara dos veces la misma definición. El harness y la variante de tier determinan qué archivo recibe. Las reglas/guías adicionales siguen siendo condicionales.

| Archivo generado | Tokens ≈ |
|---|---:|
| [.claude/agents/mandao-implementer-fast.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.claude/agents/mandao-implementer-fast.md#L1) | 676 |
| [.claude/agents/mandao-implementer-standard.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.claude/agents/mandao-implementer-standard.md#L1) | 680 |
| [.claude/agents/mandao-implementer-strong.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.claude/agents/mandao-implementer-strong.md#L1) | 677 |
| [.claude/agents/mandao-leader.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.claude/agents/mandao-leader.md#L1) | 811 |
| [.claude/agents/mandao-reviewer.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.claude/agents/mandao-reviewer.md#L1) | 702 |
| [.claude/agents/mandao-tester.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.claude/agents/mandao-tester.md#L1) | 386 |
| [.codex/agents/mandao-implementer-fast.toml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.codex/agents/mandao-implementer-fast.toml#L1) | 678 |
| [.codex/agents/mandao-implementer-standard.toml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.codex/agents/mandao-implementer-standard.toml#L1) | 682 |
| [.codex/agents/mandao-implementer-strong.toml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.codex/agents/mandao-implementer-strong.toml#L1) | 680 |
| [.codex/agents/mandao-leader.toml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.codex/agents/mandao-leader.toml#L1) | 812 |
| [.codex/agents/mandao-reviewer-alt.toml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.codex/agents/mandao-reviewer-alt.toml#L1) | 753 |
| [.codex/agents/mandao-reviewer.toml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.codex/agents/mandao-reviewer.toml#L1) | 709 |
| [.codex/agents/mandao-tester.toml:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.codex/agents/mandao-tester.toml#L1) | 389 |
| [.github/agents/mandao-implementer-fast.agent.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.github/agents/mandao-implementer-fast.agent.md#L1) | 677 |
| [.github/agents/mandao-implementer-standard.agent.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.github/agents/mandao-implementer-standard.agent.md#L1) | 681 |
| [.github/agents/mandao-implementer-strong.agent.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.github/agents/mandao-implementer-strong.agent.md#L1) | 679 |
| [.github/agents/mandao-leader.agent.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.github/agents/mandao-leader.agent.md#L1) | 814 |
| [.github/agents/mandao-reviewer-alt.agent.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.github/agents/mandao-reviewer-alt.agent.md#L1) | 746 |
| [.github/agents/mandao-reviewer.agent.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.github/agents/mandao-reviewer.agent.md#L1) | 701 |
| [.github/agents/mandao-tester.agent.md:1](https://github.com/JuanGuzman-io/mandao/blob/e0b45abde29183ed3ef0f9ef181cc2ea07dcc123/.github/agents/mandao-tester.agent.md#L1) | 387 |

Los CSV y [inventory.json](2026-10-latency/inventory.json) son los anexos calculados del diagnóstico original. Se conservan sin recalcularlos contra `main`. Los scripts utilizados en la auditoría original no se incluyen en esta copia; estos anexos permiten inspeccionar los cálculos y sus fuentes, pero no constituyen por sí solos un procedimiento de reproducción automatizada.
