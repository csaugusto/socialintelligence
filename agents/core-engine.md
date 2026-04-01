# Agente: Core Engine

## Responsabilidad

El corazón intelectual del producto. Todo lo relacionado con scoring, recomendaciones, feedback loop y el futuro Opportunity Engine. Es el agente más crítico — sus decisiones definen el valor diferencial del SaaS.

## Archivos y directorios que le pertenecen

```
src/scorer/          # Score de Contenido y Momento por red
src/db/              # Capa de datos (modelos, queries) — compartido con Infrastructure
```

## Lo que NO toca

- `src/pipeline.js` — orquestación es de Ghost+Pipeline
- `dashboard/` — UI es del Dashboard
- Infraestructura de DB (conexión, migraciones) — es de Infrastructure

## Responsabilidades concretas

- Score de Contenido por red (Instagram, X, Facebook, TikTok)
- Score de Momento (hora, día, saturación de parrilla)
- Lógica de recomendaciones: `Sí, se sugiere publicar` / `Considerar` / `Esperar` / `No aplica`
- Detección de decay type (INMEDIATA, CORTA, EVERGREEN)
- Evolución hacia scoring descompuesto (subscores explicables)
- Feedback loop: recibir resultados reales y ajustar pesos
- Juicio contextual vía Groq (scorer v2 — en lugar de fórmulas, razonamiento)
- Futuro Opportunity Engine (abstracción antes de "nota")

## Dirección técnica (ver ROADMAP.md)

El scorer evoluciona de fórmulas con umbrales fijos a **juicio contextual** via LLM:

```
Fórmula actual:
  score >= 80 AND acción === AHORA AND cooldown OK → notificar

Dirección futura:
  prompt rico con contexto multidimensional → Groq razona → decisión explicada
```

Contexto que el modelo recibirá: velocidad del trend, cobertura cruzada, exclusividad, ciclo de vida, cobertura editorial reciente, hora del día, historial del medio, identidad editorial del cliente.

**Objetivo de llegada:** fine-tuning por cliente con decisiones históricas acumuladas. Cada medio tiene un modelo entrenado en su propia identidad editorial.

## Subscores a implementar (scorer v2)

| Subscore | Qué mide |
|----------|---------|
| Trend score | Fuerza de la tendencia externa |
| Relevance score | Encaje con el perfil del cliente |
| Platform fit score | Idoneidad por red |
| Timing score | Si conviene publicar ahora |
| Content readiness score | Qué tan listo está el contenido |
| Saturation score | Saturación del tema en el mercado |

Cada score debe tener una **explicación textual breve** — sin caja negra.

## Dependencias con otros agentes

- Recibe datos de tendencias y notas de **Ghost+Pipeline**
- Sus scores son consumidos por **Dashboard** y por el bot de alertas
- La DB donde persiste pesos y feedback es gestionada por **Infrastructure**

## Estado actual

- Scorer v1 funcionando (reglas calibradas con 28 días de Enfoque Noticias)
- Labels actualizados: "Sí, se sugiere publicar" / "Considerar"
- Pendiente: scorer v2 (subscores + juicio contextual), feedback loop
