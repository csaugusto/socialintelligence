# BRAINSTORM — Expansión del proyecto hacia Trends, Creators y algoritmo propio

## Propósito de este documento

Ordenar la expansión natural de **Social Intelligence** más allá del caso inicial de medios. La idea no es abrir líneas paralelas sin control, sino identificar un **core compartido** que pueda servir tanto para medios como para creadores/influencers, manteniendo una sola base tecnológica y dos verticales de producto.

---

## Punto de partida

El proyecto actual ya tiene una dirección clara:

- detecta tendencias externas;
- genera o propone contenido;
- calcula scores por red social;
- recomienda si conviene publicar;
- y evoluciona hacia un SaaS multi-medio con aprendizaje por cliente.

Esto ya no es solo un dashboard. Es el inicio de un **motor de decisión editorial**.

---

## Nueva oportunidad detectada

Además del caso para medios, surge una segunda vertical:

### Dashboard / sistema de tendencias para creators e influencers

Objetivo general:

- ayudarles a detectar temas con potencial;
- sugerir qué tipo de contenido crear;
- recomendar en qué red y cuándo publicar;
- medir qué sí funciona y qué no;
- y usar ese aprendizaje para nutrir el algoritmo central.

Esta expansión **sí encaja** con el proyecto actual. No debe verse como una desviación, sino como una **ramificación lógica** del mismo motor.

---

## Tesis principal

No construir dos productos totalmente separados por debajo.

Construir:

- **un core engine común**, y encima
- **dos verticales de producto**.

### Vertical 1 — Media Intelligence
Pensado para:

- estaciones de radio;
- periódicos digitales;
- medios regionales;
- portales informativos.

Unidad principal de decisión:

- nota;
- urgencia editorial;
- cobertura;
- categoría;
- parrilla de publicación.

### Vertical 2 — Creator Intelligence
Pensado para:

- influencers;
- creadores de contenido;
- marcas personales;
- pequeños equipos sociales.

Unidad principal de decisión:

- idea de contenido;
- formato;
- hook;
- timing;
- plataforma ideal;
- probabilidad de rendimiento.

---

## Qué comparten ambas verticales

Las dos necesitan, en esencia, lo mismo:

- ingestión de tendencias;
- análisis de contexto;
- scoring;
- recomendación por canal;
- medición de resultados;
- feedback loop;
- aprendizaje por perfil/cliente.

La diferencia real está en la capa superior del producto y en la interfaz de decisión, no en el motor base.

---

## Core compartido propuesto

### 1. Trends ingestion layer
Fuentes posibles:

- Google Trends / Google Trends API;
- News API;
- señales de redes sociales;
- YouTube;
- TikTok;
- Pinterest;
- Reddit;
- futuras fuentes por vertical.

Responsabilidades:

- capturar señales externas;
- normalizar datos;
- deduplicar temas;
- detectar clusters;
- estimar momentum;
- medir novedad y saturación.

### 2. Opportunity Engine
Motor central que transforma señales dispersas en oportunidades accionables.

Concepto sugerido:

### Opportunity
Entidad abstracta que existe antes de convertirse en una nota o en una idea de contenido.

Campos posibles:

- topic;
- cluster;
- fuentes que lo detectaron;
- geografía;
- ventana temporal;
- velocidad de crecimiento;
- nivel de saturación;
- novedad;
- shelf life;
- score base de oportunidad.

Luego esa oportunidad puede derivar en:

- nota periodística;
- reel;
- TikTok;
- carrusel;
- hilo;
- post de texto;
- short;
- newsletter;
- cápsula de audio.

### 3. Scoring Engine
No depender de un solo score opaco. Separar el juicio en componentes.

Subscores sugeridos:

- **Trend score** — qué tan fuerte es la tendencia afuera;
- **Relevance score** — qué tanto encaja con el cliente o perfil;
- **Platform fit score** — en qué red tiene más sentido;
- **Timing score** — si conviene publicarlo ahora;
- **Content readiness score** — qué tan listo está el contenido o brief;
- **Competition / saturation score** — qué tan saturado está el tema.

Luego:

- score final;
- recomendación textual;
- explicación breve.

### 4. Recommendation Engine
Debe responder cosas como:

- publicar ahora / esperar / descartar;
- mejor para Instagram que para X;
- mejor como video corto que como carrusel;
- útil para cobertura inmediata;
- útil para evergreen;
- mejor guardar para mañana;
- no va con la audiencia.

### 5. Feedback Loop
Elemento clave del producto.

El sistema debe aprender de:

- rendimiento real de publicaciones;
- decisiones humanas del editor o creador;
- correcciones manuales;
- resultados esperados vs reales;
- patrones por cliente o perfil.

Sin esta parte, el sistema solo recomienda.
Con esta parte, el sistema realmente **aprende**.

---

## Diferencia conceptual entre medios y creators

### En medios
La pregunta principal es:

- ¿esta nota vale la pena publicarse?
- ¿en qué red conviene moverla?
- ¿con qué urgencia?

### En creators
La pregunta principal es:

- ¿qué contenido debería crear?
- ¿qué formato conviene?
- ¿qué ángulo o hook tiene más potencial?
- ¿en qué red y en qué momento?

Esto significa que el sistema creator no debe girar alrededor de una “nota”, sino de una:

### Content Opportunity
Campos sugeridos:

- tema;
- red sugerida;
- formato sugerido;
- hook sugerido;
- tono;
- CTA sugerido;
- complejidad de producción;
- duración ideal;
- tendencia base;
- score esperado;
- explicación de por qué se recomienda.

---

## Hipótesis de valor para creators

Propuesta sencilla y creíble:

> “Un sistema que detecta oportunidades de contenido, recomienda qué publicar por red y aprende con tus resultados.”

No vender de entrada:

> “Tenemos un algoritmo universal que sabe qué se hará viral.”

Eso suena bonito, pero luego la realidad le da una cachetada con mano de productor ejecutivo.

---

## Qué medir en la vertical de creators

Para que nutra el algoritmo, el sistema debe guardar datos estructurados de cada publicación.

### Métricas de resultado
- views;
- reach;
- engagement;
- comments;
- saves;
- shares;
- CTR;
- watch time;
- retención;
- follows generados;
- conversiones si aplica.

### Variables explicativas
- tema;
- cluster;
- fuente de tendencia;
- red;
- formato;
- duración;
- hook;
- hora;
- día;
- tono;
- categoría;
- tipo de CTA;
- si fue recomendado por el sistema o decisión manual.

### Comparación predicción vs realidad
- score esperado;
- resultado real;
- desviación;
- factores que pudieron afectar.

Aquí nace el verdadero activo del producto.
No solo las sugerencias, sino el histórico que permite afinar el modelo.

---

## Perfil por cliente / creador

Así como en medios existe un perfil editorial, para creators debe existir un:

### Creator Profile
Ejemplos de atributos:

- nicho principal;
- tono;
- formatos más usados;
- redes prioritarias;
- audiencia;
- frecuencia de publicación;
- temas prohibidos o irrelevantes;
- tolerancia a experimentación;
- objetivo principal (alcance, engagement, conversión, autoridad, tráfico).

El mismo trend puede servirle a un creador y no a otro.
El algoritmo no debe decidir solo por tendencia global, sino por:

**tendencia externa × compatibilidad con perfil × evidencia histórica propia**

---

## Evolución sugerida del producto

### Fase 1 — Consolidar el core actual
- estabilizar BD real;
- consolidar entidades comunes;
- separar mejor scoring y recomendaciones;
- registrar feedback y resultados.

### Fase 2 — Formalizar Opportunity Engine
- dejar de pensar solo en “nota”;
- crear entidad abstracta de oportunidad;
- soportar múltiples salidas de contenido.

### Fase 3 — Creator Intelligence MVP
- dashboard sencillo para creadores;
- lista de ideas priorizadas;
- recomendación por red;
- sugerencia de formato;
- score + explicación;
- captura manual de resultados.

### Fase 4 — Integraciones automáticas
- traer estadísticas reales desde APIs de plataformas;
- comparar predicción vs resultado;
- realimentar el modelo.

### Fase 5 — Auto-calibración por perfil
- ajustar pesos por cliente/creador;
- personalización real del sistema;
- experimentación controlada.

### Fase 6 — Modelo más inteligente de decisión
- pasar de reglas simples a juicio asistido por modelo;
- reasoning contextual;
- posible fine-tuning por cliente en etapa avanzada.

---

## Arquitectura de producto sugerida

### Core Platform
Componentes:

- trends ingestion;
- normalization;
- opportunity engine;
- scoring engine;
- recommendation engine;
- analytics store;
- feedback loop;
- scheduler / jobs;
- API interna.

### Vertical: Media
Módulos:

- generación de notas;
- CMS publishing;
- parrilla editorial;
- alertas;
- sugerencias por red;
- urgencia y cobertura.

### Vertical: Creators
Módulos:

- idea bank;
- planner de contenido;
- ranking de oportunidades;
- sugerencia de formato/hook;
- calendario sugerido;
- medición por publicación;
- aprendizaje del perfil.

---

## Riesgos a cuidar

### 1. Score tipo caja negra
Si el sistema solo da un número sin explicación, costará mucho adoptarlo.

### 2. Mezclar demasiado pronto medios y creators en la UX
Comparten motor, pero no deben sentirse como el mismo producto por arriba.

### 3. Sobreprometer “virales”
Lo defendible es:

- detectar oportunidad;
- recomendar con evidencia;
- aprender con resultados.

### 4. Generación automática sin suficiente control
La IA debe servir primero como copiloto, no necesariamente como piloto sin licencia.

---

## Preguntas abiertas para aterrizar después

### Fuentes y tendencias
- ¿qué fuentes de trends valen la pena por API oficial?
- ¿cuáles se usarán solo como señal secundaria?
- ¿qué tan importante será la capa social vs búsqueda vs noticias?

### Datos y modelo
- ¿qué entidad será el centro real: nota, post u oportunidad?
- ¿cómo almacenar resultados históricos de forma comparable?
- ¿cómo medir éxito por red sin caer en métricas vanidosas?

### Negocio
- ¿se venderá primero a medios o a creators?
- ¿serán dos ofertas comerciales o una plataforma con planes?
- ¿qué vertical tendrá mejor adopción al inicio?

### Producto
- ¿conviene un dashboard único con modos o dos dashboards distintos?
- ¿qué parte debe seguir siendo manual y cuál automatizar?

---

## Recomendación estratégica

No pensar esto como “otro dashboard”.
Pensarlo como un:

## Motor de decisión de contenido

Ese motor puede alimentar:

- medios;
- influencers;
- marcas;
- agencias;
- equipos de contenido.

La interfaz cambiará. El core, no tanto.

---

## Resumen ejecutivo

La expansión hacia creators/influencers tiene sentido y es coherente con la dirección actual del proyecto.

La mejor ruta no es duplicar sistemas, sino:

- consolidar un core compartido;
- formalizar una entidad de oportunidad;
- medir resultados reales;
- aprender por perfil;
- y montar encima dos verticales claras: media y creators.

Si esto se hace bien, el activo principal no será solo el dashboard ni la generación de contenido.
Será el **algoritmo de decisión nutrido por datos reales de rendimiento**.
