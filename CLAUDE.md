# Social Intelligence — Contexto del Orquestador

## Qué es este proyecto

Motor de decisión de contenido para medios digitales y creadores. Detecta tendencias, genera notas, las publica en Ghost y recomienda cuándo y en qué red publicar. Objetivo: SaaS multi-medio.

Ver README.md para estado actual. Ver ROADMAP.md para dirección futura.

## Estructura de agentes

Este proyecto opera con agentes especializados por dominio. Antes de tocar cualquier área, identifica qué agente es responsable y respeta sus fronteras.

| Agente | Archivo de contexto | Dominio |
|--------|-------------------|---------|
| Ghost + Pipeline | agents/ghost-pipeline.md | CMS, generación de notas, cron, publicación |
| Dashboard | agents/dashboard.md | Next.js, parrilla, UI, auth |
| Core Engine | agents/core-engine.md | Scorer, recommendation engine, feedback loop |
| Infrastructure | agents/infrastructure.md | DB, Docker, GCloud, PM2, deployment |
| QA | agents/qa.md | Validación, tests, consistencia cruzada |

## Reglas globales

- Nunca modificar archivos fuera del dominio asignado sin coordinación explícita
- Cambios que afecten más de un dominio se escalan al orquestador
- Todo cambio estructural o de arquitectura se discute antes de implementar
- El idioma del proyecto es español (comentarios, docs, variables de negocio)
- No generar ni adivinar URLs externas
- No agregar features no solicitadas ni refactors no pedidos
