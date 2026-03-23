# Social Intelligence — Panel de Publicación Inteligente

> Sistema de análisis editorial y recomendación de publicación en redes sociales, impulsado por datos históricos de la redacción y validación mediante IA generativa.

---

## Tabla de contenidos

1. [¿Qué es este proyecto?](#1-qué-es-este-proyecto)
2. [Origen: análisis de datos reales](#2-origen-análisis-de-datos-reales)
3. [Arquitectura general](#3-arquitectura-general)
4. [El Score de Contenido](#4-el-score-de-contenido)
5. [El Score de Momento](#5-el-score-de-momento)
6. [Perfiles operativos por red](#6-perfiles-operativos-por-red)
7. [Sistema de caducidad](#7-sistema-de-caducidad)
8. [Trending: MX y Mundial](#8-trending-mx-y-mundial)
9. [El prompt de IA](#9-el-prompt-de-ia)
10. [Respuesta esperada de la IA (JSON)](#10-respuesta-esperada-de-la-ia-json)
11. [El panel (dashboard)](#11-el-panel-dashboard)
12. [La parrilla de publicación](#12-la-parrilla-de-publicación)
13. [Flujo completo: clic en Analizar](#13-flujo-completo-clic-en-analizar)
14. [Proveedores de IA y costos](#14-proveedores-de-ia-y-costos)
15. [Implementación de referencia (WordPress)](#15-implementación-de-referencia-wordpress)
16. [Cómo portar a otro sistema](#16-cómo-portar-a-otro-sistema)
17. [Variables a adaptar por marca](#17-variables-a-adaptar-por-marca)

---

## 1. ¿Qué es este proyecto?

Un panel editorial que se integra al CMS de cualquier medio de comunicación y responde tres preguntas por cada nota publicada:

- **¿En qué red vale la pena publicar esto?** → Score de Contenido (0–100 por red)
- **¿Cuándo es el mejor momento?** → Score de Momento (0–100 por red)
- **¿Cómo escribo el copy?** → Generado automáticamente por IA, listo para copiar y pegar

La primera versión fue construida como plugin de WordPress para **Enfoque Noticias (100.1 FM, CDMX)** entre enero y marzo de 2026. Este documento generaliza todo el sistema para que pueda implementarse en cualquier plataforma y para cualquier medio.

### Redes sociales soportadas

| Red | Naturaleza | Tiempo de producción estimado |
|-----|-----------|-------------------------------|
| Instagram | Visual (foto + copy) | ~20 min |
| X / Twitter | Inmediatez (texto puro) | ~2 min |
| Facebook | Narrativo (contexto + copy) | ~15 min |
| TikTok | Video editado | ~120 min |

---

## 2. Origen: análisis de datos reales

El algoritmo no fue construido sobre supuestos genéricos. Antes de escribir una sola línea de código se analizaron **28 días de publicaciones históricas** del medio para identificar:

### 2.1 Peaks de audiencia por red

Los datos de alcance e interacciones por hora revelaron curvas distintas para cada plataforma. Se normalizaron en una escala `0.0–1.0` donde `1.0` = el horario de mayor rendimiento histórico:

```
Instagram  →  peak: 12:00 h (1.00), secundario: 11:00 (0.95), 20:00 (0.85)
X/Twitter  →  peak: 15:00 h (1.00), secundario: 18:00 (0.95), 21:00 (0.88)
Facebook   →  peak:  9:00 h (1.00), secundario: 13:00 (0.92),  7:00 (0.95)
TikTok     →  peak:  6:00 h (1.00), secundario: 12:00 (0.95), 11:00 (0.90)
```

### 2.2 Días de la semana

También se identificó qué día de la semana tiene mejor rendimiento por plataforma (multiplicadores donde `1.0` = mejor día):

```
Instagram  →  lunes y miércoles = 1.00, domingo = 0.70
X/Twitter  →  lunes–miércoles   = 1.00, domingo = 0.58
Facebook   →  miércoles         = 1.00, domingo = 0.78
TikTok     →  domingo y viernes = 1.00, lunes   = 0.82
```

### 2.3 Categorías de contenido por red

Se cruzaron las categorías de las notas con su desempeño en cada red para construir una tabla de pesos. El resultado muestra, por ejemplo:

- Seguridad y crimen → lideran en Facebook y TikTok
- Política y economía → dominan en X/Twitter
- Entretenimiento y farándula → mayor alcance en Instagram y TikTok
- Breaking news → fortaleza máxima en X/Twitter

> **Para adaptar este sistema a otro medio:** reemplazar estos datos con el histórico propio. La estructura del algoritmo es independiente de los valores numéricos.

---

## 3. Arquitectura general

```
┌─────────────────────────────────────────────────────────┐
│                        CMS / Backend                     │
│                                                         │
│  [Nota publicada] ──► [Scorer]  ──────────────────────┐ │
│                          │                             │ │
│                    [Trends API] ◄── Google Trends RSS  │ │
│                          │                             │ │
│                    [AI Prompt] ──► Groq / OpenAI /     │ │
│                          │         Claude API          │ │
│                    [Resultado] ──────────────────────► │ │
│                                                        ▼ │
│                                              [Dashboard] │
└─────────────────────────────────────────────────────────┘
```

### Módulos del sistema

| Módulo | Responsabilidad |
|--------|----------------|
| **Scorer** | Calcula Score de Contenido y Score de Momento sin IA |
| **Trends** | Obtiene trending MX y Mundial en tiempo real (cachéado 15 min) |
| **Analyzer** | Construye el prompt, llama a la IA, procesa la respuesta |
| **Calendar** | Gestiona la parrilla de publicación (slots ocupados) |
| **Dashboard** | Interfaz editorial: visualiza scores, copy, recomendaciones |

---

## 4. El Score de Contenido

**Pregunta que responde:** ¿Qué tan buena es esta nota para esta red social específica?

Es un valor de 0 a 100 calculado puramente por el algoritmo (sin IA). Se calcula una vez que la IA devuelve su evaluación editorial, combinando cuatro factores:

### Con evaluación de IA disponible (modo completo)

| Factor | Puntos máx | Fuente |
|--------|-----------|--------|
| Tema / Categoría | 35 pts | Tabla de pesos por categoría × red |
| Relevancia editorial (IA) | 30 pts | Score 0-100 devuelto por la IA |
| Trending MX + Mundial | 20 pts | Coincidencia con trends en tiempo real |
| Formato / Contexto | 15 pts | Señales detectadas en el texto |
| **Total** | **100 pts** | |

### Sin evaluación de IA (modo rápido / fallback)

| Factor | Puntos máx |
|--------|-----------|
| Tema / Categoría | 50 pts |
| Trending | 30 pts |
| Formato / Contexto | 20 pts |
| **Total** | **100 pts** |

### Factor 1: Categoría

Se detecta automáticamente comparando el título y resumen de la nota contra un diccionario de keywords ponderadas. Cada keyword tiene un vector de pesos `[instagram, x, facebook, tiktok]`:

```
Ejemplo de pesos por categoría:
  'sismo'     → [95, 95, 95, 95]   ← alta en todas las redes
  'futbol'    → [78, 86, 72, 84]   ← X y TikTok lideran
  'presidente'→ [58, 78, 62, 55]   ← X domina, TikTok bajo
  'cartelera' → [60, 55, 62, 68]   ← TikTok e Instagram lideran
  'economia'  → [52, 74, 56, 42]   ← X lidera, TikTok muy bajo
```

Si no se detecta ninguna keyword, se aplica un vector base `[32, 38, 34, 30]`.

### Factor 2: Relevancia editorial (IA)

La IA devuelve un `editorial.score` de 0–100 que evalúa:
- Protagonistas de impacto (presidente, gobernador, celebridades)
- Impacto social de la nota
- Coincidencia con eventos del día
- Novedad, morbo o utilidad práctica

Este score se multiplica por `0.30` para obtener los 30 puntos de este factor.

### Factor 3: Trending

Se calcula combinando trending MX y mundial ponderado según si la nota es local o internacional:

```
Nota local  (detectada por keywords: cdmx, alcaldía, secretaría, etc.)
  → Score combinado = (score_MX × 0.70) + (score_mundial × 0.30)

Nota internacional
  → Score combinado = (score_MX × 0.40) + (score_mundial × 0.60)
```

### Factor 4: Formato / Contexto

Señales detectadas en el texto que suman o restan por red:

```
Señal          Instagram   X       Facebook   TikTok
is_breaking       +5      +15        +3        -10   ← breaking resta en TikTok
has_video         +6       +2        +4         +8
has_conductor     +5       +1        +1         +5
is_analysis       -3       +4        +4         -3
```

El rango del factor está capeado: mínimo -20, máximo 15 (con IA) / 20 (sin IA).

### Umbrales de recomendación (basados en Score de Contenido)

```
≥ 70  →  PUBLICAR
55–69 →  CONSIDERAR  (o PUBLICAR si caducidad CORTA y tiempo alcanza)
35–54 →  ESPERAR / NO PUBLICAR  (depende de caducidad y red)
< 35  →  NO PUBLICAR  (siempre)
```

> **Importante:** el Score de Contenido decide **si** publicar. El Score de Momento decide **cuándo**.

---

## 5. El Score de Momento

**Pregunta que responde:** ¿Es un buen momento para publicar en esta red ahora mismo?

Se recalcula en tiempo real cada vez que se carga el dashboard, ya que depende de la hora actual y del estado de la parrilla.

| Factor | Puntos máx | Cálculo |
|--------|-----------|---------|
| Peak de audiencia | 60 pts | `hour_factor × 60` |
| Día de semana | 25 pts | `day_multiplier × 25` |
| Slot disponible en parrilla | 15 pts | Penalización por saturación |
| **Total** | **100 pts** | |

### Penalización por saturación

```
Slot libre      → 15 pts  (sin penalización)
1 nota agendada → 10 pts
2 notas         →  5 pts  (slot lleno)
3+ notas        →  0 pts  (slot saturado — no publicar aquí)
```

### Interpretación

```
≥ 70  →  Momento ideal
40–69 →  Momento aceptable
< 40  →  Esperar mejor slot
```

---

## 6. Perfiles operativos por red

Una innovación clave del sistema es que entiende la **realidad de producción** de una redacción. No todas las notas tienen sentido en todas las plataformas, y el tiempo que toma producir contenido para cada red determina si es viable publicar antes de que la nota pierda relevancia.

### Regla de viabilidad

```
Si  tiempo_produccion  ≥  ventana_relevancia × 0.80
→   NO PUBLICAR en esta red
```

| Red | Tiempo producción | Naturaleza | Caducidad mínima viable |
|-----|-----------------|-----------|------------------------|
| X / Twitter | 2 min | Inmediatez | Cualquiera (INMEDIATA inclusive) |
| Instagram | 20 min | Visual | CORTA o superior |
| Facebook | 15 min | Narrativo | CORTA o superior |
| TikTok | 120 min | Video | Solo NORMAL o EVERGREEN |

### Lógica de breaking news por red

- **X:** breaking es su mayor fortaleza → bonus de +15 pts en Score de Contenido, publica INMEDIATO
- **Instagram:** breaking suma levemente (+5 pts), puede publicar si hay tiempo
- **Facebook:** breaking suma poco (+3 pts), prioriza narrativa
- **TikTok:** breaking **resta** (-10 pts), el video no estará listo antes de que la nota caduque

---

## 7. Sistema de caducidad

El sistema detecta automáticamente la urgencia de cada nota analizando su texto y asigna uno de cuatro tipos:

| Tipo | Ventana | Keywords detectadas | Comportamiento |
|------|---------|---------------------|---------------|
| **INMEDIATA** | 0–1 hora | sismo, secuestro, balacera, urgente, alerta roja, última hora | Publicar YA. Ignora peaks. |
| **CORTA** | 2–6 horas | accidente, incendio, detenido, muere, rescatan, operativo | Siguiente peak disponible hoy |
| **NORMAL** | 6–24 horas | política, economía, deportes (resultado) | Mejor peak del día |
| **EVERGREEN** | 24–72 horas | cartelera, guía, consejos, agenda cultural, película | Peak óptimo de los próximos días |

### Cómo afecta la caducidad a cada red

```
Tipo INMEDIATA:
  X          → PUBLICAR AHORA  (es la red de breaking)
  Instagram  → PUBLICAR AHORA  (20 min alcanza dentro de 1h)
  Facebook   → PUBLICAR AHORA  (15 min alcanza dentro de 1h)
  TikTok     → NO PUBLICAR     (2h de edición > 1h de vida útil)

Tipo CORTA:
  X          → PUBLICAR AHORA  (texto puro, 2 min de producción)
  Instagram  → siguiente peak disponible
  Facebook   → siguiente peak disponible
  TikTok     → NO PUBLICAR     (2h de edición > 6h de ventana al 80%)

Tipo NORMAL / EVERGREEN:
  Todas      → mejor peak según datos históricos
  TikTok     → peak programado (único caso donde TikTok recibe nota)
```

---

## 8. Trending: MX y Mundial

El sistema consulta Google Trends RSS cada 15 minutos (con caché) para dos geografías:

### Fuentes de datos

**México (MX):**
- Google Trends Daily RSS: `https://trends.google.es/trending/rss?geo=MX`
- Fallback: feeds RSS de medios mexicanos (Aristegui Noticias, El Universal)

**Mundial:**
- Google Trends Daily RSS: `https://trends.google.es/trending/rss?geo=US` (proxy global en inglés/español)
- Fallback: BBC Mundo RSS, Infobae RSS

### Score de trending combinado

```python
# Pseudocódigo del algoritmo de coincidencia

def score_trending(title, excerpt, mx_trends, world_trends):
    text = (title + " " + excerpt).lower()
    
    # Score MX: +30 si coincide exactamente, +10 si coincide palabra clave (>4 chars)
    mx_score = 0
    for trend in mx_trends:
        if trend.keyword.lower() in text:
            mx_score += 30
        else:
            for word in trend.keyword.split():
                if len(word) > 4 and word in text:
                    mx_score += 10
    mx_score = min(100, mx_score)
    
    # Score Mundial: +25 exacto, +8 parcial
    world_score = 0
    # ... mismo proceso con world_trends
    world_score = min(100, world_score)
    
    # Detectar si la nota es local o internacional
    local_signals = ['cdmx', 'ciudad de mexico', 'alcaldía', 'secretaría',
                     'jalisco', 'nuevo leon', 'guadalajara', 'monterrey', ...]
    is_local = any(signal in text for signal in local_signals)
    
    # Combinar con pesos según tipo
    if is_local:
        combined = (mx_score * 0.70) + (world_score * 0.30)
    else:
        combined = (mx_score * 0.40) + (world_score * 0.60)
    
    return {
        'score': min(100, combined),
        'score_mx': mx_score,
        'score_world': world_score,
        'is_local': is_local
    }
```

---

## 9. El prompt de IA

El sistema envía un único prompt por nota que incluye toda la información necesaria para que la IA genere el copy y evalúe la relevancia editorial. Este es el prompt completo que se envía:

```
Eres el editor de redes sociales de {NOMBRE_MEDIO}, {DESCRIPCION_MEDIO}.
Devuelve un JSON con exactamente estas claves: editorial, instagram, x, facebook, tiktok, resumen.

NOTA: {titulo}
TAGS / CATEGORIAS: {tags}
RESUMEN: {excerpt_primeros_400_chars}
HORA LOCAL: {hora} | DIA: {dia_semana} | CATEGORIA: {categoria} | CADUCIDAD: {caducidad_tipo}
TRENDING MX AHORA: {trending_mx_keywords_separados_por_coma}
TRENDING MUNDIAL: {trending_mundial_keywords_separados_por_coma}

SCORES DE ALGORITMO (no cambiar en cada red):
instagram: score={ig_score} urgencia={ig_urgencia} formato={ig_formato}
x:         score={x_score}  urgencia={x_urgencia}  formato={x_formato}
facebook:  score={fb_score} urgencia={fb_urgencia} formato={fb_formato}
tiktok:    score={tt_score} urgencia={tt_urgencia} duracion={tt_duracion}

INSTRUCCIONES:

1. editorial (objeto ÚNICO, no por red):
   - score: entero 0-100. Tu evaluación editorial de relevancia para la audiencia HOY.
     Considera: impacto social, protagonistas relevantes, coincidencia con eventos del día,
     novedad, morbo, utilidad práctica.
   - razon: una frase corta explicando el score (max 12 palabras, sin comillas dobles)
   - redes_prioritarias: array de redes con mayor potencial ["instagram","facebook"] etc.

2. Cada red (instagram, x, facebook, tiktok):
   - score: el fijo del algoritmo (NO CAMBIAR)
   - urgencia: la fija del algoritmo (NO CAMBIAR)
   - formato: el fijo del algoritmo (NO CAMBIAR)
   - copy: texto listo para publicar según formato indicado
   - hashtags: array 2-3 hashtags relevantes en el idioma del medio
   - razon: 1 línea explicando por qué ese formato/ángulo

3. resumen:
   - prioridad: ALTA / MEDIA / BAJA
   - mejor_red: la red con mayor potencial para esta nota
   - trending: score numérico de tendencias
   - insight: observación editorial sobre la nota

REGLAS DE COPY:
- instagram: gancho emocional, emojis naturales, max 140 caracteres
- x: emoji + titular impactante + contexto, max 200 caracteres
- facebook: narrativo según el formato indicado, max 160 caracteres
- tiktok: pie de video, lo más impactante primero, max 120 caracteres
- No uses comillas dobles dentro de valores de texto
- Escribe emojis directamente en UTF-8, NO como secuencias \uXXXX escapadas
- Usa solo caracteres ASCII o UTF-8 válido en el JSON
```

### Configuración de la llamada a la API

```json
{
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.1,
  "max_tokens": 1600,
  "response_format": { "type": "json_object" },
  "messages": [
    {
      "role": "system",
      "content": "Eres un asistente de estrategia de redes sociales. Respondes ÚNICAMENTE con JSON válido, sin texto adicional."
    },
    {
      "role": "user",
      "content": "... prompt construido arriba ..."
    }
  ]
}
```

> **Por qué `temperature: 0.1`:** queremos respuestas consistentes y predecibles, no creativas. El copy necesita ser correcto y directo, no original en cada llamada.

> **Por qué `response_format: json_object`:** fuerza a la IA a devolver JSON válido sin texto libre, lo que evita tener que parsear respuestas con markdown fences o texto previo.

---

## 10. Respuesta esperada de la IA (JSON)

La IA debe devolver exactamente esta estructura:

```json
{
  "editorial": {
    "score": 85,
    "razon": "Emergencia urbana de alto impacto, audiencia local directamente afectada",
    "redes_prioritarias": ["x", "instagram", "facebook"]
  },
  "instagram": {
    "score": 72,
    "urgencia": "INMEDIATO",
    "formato": "FOTO + TEXTO",
    "copy": "Colapso en San Antonio Abad. Personas atrapadas. Equipos de rescate en el lugar. Sigue la cobertura en vivo.",
    "hashtags": ["#CDMX", "#Rescate", "#Emergencia"],
    "razon": "Foto impactante del lugar con copy urgente genera engagement alto en IG"
  },
  "x": {
    "score": 80,
    "urgencia": "INMEDIATO",
    "formato": "TWEET + IMAGEN",
    "copy": "🚨 URGENTE: Colapso de estructura en San Antonio Abad, CDMX. Personas atrapadas. Equipos de rescate trabajan en el lugar.",
    "hashtags": ["#ColapsoSanAntonioAbad", "#CDMX", "#Rescate"],
    "razon": "Breaking news en X: minuto a minuto, texto directo"
  },
  "facebook": {
    "score": 78,
    "urgencia": "INMEDIATO",
    "formato": "FOTO + TEXTO",
    "copy": "Autoridades atienden el colapso de un edificio en la colonia San Antonio Abad. Sigue la cobertura en vivo.",
    "hashtags": ["#CDMX", "#Emergencia", "#Rescate"],
    "razon": "Contexto narrativo para audiencia adulta de Facebook"
  },
  "tiktok": {
    "score": 25,
    "urgencia": "NO APLICA",
    "formato": "NO APLICA",
    "copy": "",
    "hashtags": [],
    "razon": "Nota urgente — para cuando termines el video la nota ya caducó"
  },
  "resumen": {
    "prioridad": "ALTA",
    "mejor_red": "x",
    "trending": 65,
    "insight": "Nota en tendencia nacional, publicar en X de inmediato y coordinar cobertura en IG con foto desde el lugar"
  }
}
```

### Procesamiento post-respuesta

Después de recibir el JSON, el sistema aplica estos pasos de limpieza:

1. **Fix de surrogates Unicode:** convertir pares surrogate mal codificados (`\uD83D\uDEA8`) al emoji UTF-8 real antes del `json_decode`
2. **`clean_text()`:** normalizar comillas tipográficas, eliminar secuencias de escape residuales, decodificar entidades HTML
3. **Merge con scores del algoritmo:** los scores del JSON de la IA se ignoran (se usan los calculados por el Scorer), solo se usa el `editorial.score` como uno de los factores

---

## 11. El panel (dashboard)

### Vista principal

El dashboard muestra las notas del CMS en una tabla con las cuatro redes como columnas. Cada celda tiene dos zonas:

```
┌─────────────────────────────┐
│ ZONA A — Decisión           │
│  🟡 CORTA  (caducidad)      │
│  ✅ PUBLICAR    ⚡ AHORA    │
│  🧠 85  Impacto social alto │
├─────────────────────────────┤
│ ZONA B — Detalle            │
│  CONTENIDO  ████░░  72      │
│  MOMENTO    █████░  83      │
│  FOTO+TEXTO  📄  📅         │
└─────────────────────────────┘
```

**Zona A** muestra:
- Badge de caducidad (INMEDIATA / CORTA / NORMAL / EVERGREEN)
- Acción recomendada (PUBLICAR / CONSIDERAR / ESPERAR / NO PUBLICAR)
- Hora sugerida (AHORA / 15:00 / 12:00 etc.)
- Badge de evaluación editorial de la IA con su justificación

**Zona B** muestra:
- Barra de progreso del Score de Contenido
- Barra de progreso del Score de Momento
- Formato recomendado para esa red

### Interacciones

- **Analizar:** lanza el proceso completo (Scorer + Trends + IA) para esa nota
- **Ver copy (📄):** abre un modal con el copy listo para copiar, hashtags, desglose del score y justificación del IA
- **Agendar (📅):** registra la nota en la parrilla para la hora sugerida
- **Re-analizar:** re-lanza el análisis (útil si han pasado varias horas o cambió el trending)

### Modal de detalle

Al abrir el modal de una red, el desglose del score muestra:

```
CONTENIDO
  Tema para esta red     ████░░░    22/35
  Relevancia IA (Groq)   ██████░    26/30
  Trending MX/Mundial    ░░░░░░░     0/20
  Formato / contexto     ███████    15/15

MOMENTO
  Peak de audiencia      ████████   60/60
  Día de semana          █████████  25/25
  Slot disponible        ░░░░░░░░    0/15
```

### Barras de trending en el header

```
📈 TRENDING MX    [chip1]  [chip2]  [chip3]  ...
🌍 TRENDING MUNDIAL  [chip1]  [chip2]  ...
```

Los chips en rojo oscuro = Google Trends, posiciones 1–5. Los chips de trending mundial aparecen en azul claro para diferenciarse visualmente.

---

## 12. La parrilla de publicación

Una vista de grilla que muestra las 4 redes × los horarios del día (05:00–23:00):

| | Instagram | X / Twitter | Facebook | TikTok |
|---|---|---|---|---|
| 06:00 | 🟢 Libre | 🟢 Libre | 🟢 Libre | 🔴 Peak |
| 09:00 | 🟢 Libre | 🟢 Libre | 🔴 Peak | 🟢 Libre |
| 12:00 | 🔴 Peak | 🟠 2 notas | 🟢 Libre | 🟠 1 nota |

**Colores:**
- 🟢 Verde: slot libre
- 🟠 Naranja: 2 notas agendadas (próximo a saturarse)
- 🔴 Rojo: 3+ notas (saturado) o peak de audiencia sin notas

Los peaks históricos se resaltan automáticamente para facilitar la decisión editorial.

---

## 13. Flujo completo: clic en Analizar

```
Editor hace clic en "Analizar"
        │
        ▼
1. Scorer.calculate(titulo, contenido)
   ├── Detectar categoría (keyword matching)
   ├── Detectar señales (breaking, video, conductor, análisis)
   ├── Detectar caducidad (INMEDIATA / CORTA / NORMAL / EVERGREEN)
   ├── Calcular Score de Contenido provisional (sin editorial score)
   ├── Calcular Score de Momento (hora + día + parrilla)
   └── Calcular hora sugerida por red
        │
        ▼
2. Trends.score_trending_combined(titulo, excerpt)
   ├── Obtener trending MX (caché 15 min) → Google Trends RSS
   ├── Obtener trending Mundial (caché 15 min)
   ├── Calcular coincidencias (exact match: +30 / partial: +10)
   └── Combinar pesos (local 70/30, internacional 40/60)
        │
        ▼
3. Analyzer.build_prompt(...)
   ├── Insertar datos de la nota (título, resumen, tags)
   ├── Insertar contexto temporal (hora CDMX, día semana)
   ├── Insertar scores del algoritmo (fijos, la IA no los cambia)
   ├── Insertar trending keywords
   └── Insertar formato recomendado por red
        │
        ▼
4. API call → Groq / OpenAI / Claude
   ├── model: llama-3.3-70b-versatile (u otro)
   ├── temperature: 0.1
   ├── response_format: json_object
   └── timeout: 45 seg
        │
        ▼
5. Procesar respuesta
   ├── Fix surrogates Unicode
   ├── json_decode()
   ├── clean_text() en todos los campos de texto
   └── Extraer editorial.score
        │
        ▼
6. Scorer.recalculate_with_editorial(editorial_score)
   ├── Recalcular Score de Contenido (ahora incluye los 30 pts del editorial de IA)
   └── La recomendación final puede cambiar vs. el cálculo provisional
        │
        ▼
7. Guardar resultado en base de datos / metadatos del CMS
        │
        ▼
8. Dashboard renderiza la celda con:
   ├── Score de Contenido (con barra)
   ├── Score de Momento (con barra)
   ├── Acción recomendada
   ├── Hora sugerida
   ├── Badge editorial con justificación de la IA
   └── Botones: Ver copy / Agendar
```

---

## 14. Proveedores de IA y costos

### Consumo por petición

Cada llamada al API consume aproximadamente:
- **Input:** ~800 tokens (prompt completo con contexto de la nota)
- **Output:** ~400 tokens (JSON con copy para 4 redes + editorial + resumen)
- **Total:** ~1,200 tokens por análisis

### Tabla de costos comparativa (100 peticiones)

| Proveedor / Modelo | Input /1M tokens | Output /1M tokens | Costo 100 peticiones |
|-------------------|-----------------|------------------|--------------------|
| **Groq — Llama 3.3 70B** (plan gratuito) | $0.00 | $0.00 | **$0.00** |
| Groq — Llama 3.3 70B (plan de pago) | $0.59 | $0.79 | $0.08 |
| OpenAI — GPT-4o mini | $0.15 | $0.60 | $0.04 |
| OpenAI — GPT-4o | $2.50 | $10.00 | $0.60 |
| OpenAI — GPT-4.1 | $2.00 | $8.00 | $0.48 |
| Claude — Haiku 4.5 | $1.00 | $5.00 | $0.28 |
| Claude — Sonnet 4.6 | $3.00 | $15.00 | $0.84 |
| Claude — Opus 4.6 | $5.00 | $25.00 | $1.40 |

*Precios a marzo 2026. Todos en USD.*

### Límites del plan gratuito de Groq

- ~6,000 tokens por minuto
- ~500,000 tokens por día → equivale a **400–600 análisis diarios**
- Sin tarjeta de crédito requerida

### Recomendación de modelo por caso de uso

| Caso | Modelo recomendado | Razón |
|------|-------------------|-------|
| Prototipo / desarrollo | Groq (gratuito) | Sin costo, velocidad máxima |
| Producción estándar | Groq o GPT-4o mini | Suficiente calidad, costo mínimo |
| Alta calidad editorial | Claude Sonnet 4.6 | Mejor copy en español, razonamiento editorial superior |
| Máxima calidad | Claude Opus 4.6 | Reservar para notas de gran impacto |

---

## 15. Implementación de referencia (WordPress)

La primera implementación fue un plugin de WordPress con esta estructura:

```
social-intelligence-plugin/
├── social-intelligence.php          ← punto de entrada, registro de menú y AJAX
├── includes/
│   ├── class-scorer.php             ← algoritmo de scoring (sin IA)
│   ├── class-analyzer.php           ← prompt builder + llamada a API
│   ├── class-trends.php             ← trending MX y mundial
│   ├── class-calendar.php           ← parrilla de publicación
│   ├── class-settings.php           ← configuración (API key, etc.)
│   └── class-api.php                ← endpoints AJAX
├── assets/
│   ├── js/dashboard.js              ← lógica del dashboard en jQuery
│   └── css/dashboard.css            ← estilos del panel
└── views/
    └── dashboard.php                ← template HTML del panel
```

### Tabla de base de datos para la parrilla

```sql
CREATE TABLE {prefix}social_calendar (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id         BIGINT UNSIGNED NOT NULL,
    network         VARCHAR(20) NOT NULL,      -- instagram | x | facebook | tiktok
    scheduled_time  DATETIME NOT NULL,         -- en UTC
    status          VARCHAR(20) DEFAULT 'scheduled',
    created_at      DATETIME DEFAULT NOW()
);
```

### AJAX endpoints

| Action | Descripción |
|--------|-------------|
| `si_get_posts` | Carga las notas recientes del CMS |
| `si_analyze_post` | Lanza el análisis completo de una nota |
| `si_get_trends` | Devuelve trending MX + mundial actuales |
| `si_schedule` | Agrega una nota a la parrilla |
| `si_unschedule` | Elimina una nota de la parrilla |
| `si_get_grid` | Devuelve el estado actual de la parrilla |

---

## 16. Cómo portar a otro sistema

El sistema es agnóstico al CMS. Lo único que se necesita es:

### 1. Fuente de notas

Cualquier fuente que devuelva:
- `id` — identificador único
- `title` — título de la nota
- `excerpt` / `content` — resumen o cuerpo (se usan los primeros 400 caracteres)
- `tags` / `categories` — palabras clave asociadas
- `published_at` — fecha de publicación

### 2. Módulo Scorer

Puede implementarse en cualquier lenguaje. Solo requiere:
- La tabla de `category_weights` (array de keywords → [ig, x, fb, tt])
- Los datos de `hour_peaks` y `day_multipliers`
- Los `net_profile` (tiempos de producción)
- La lógica de `detect_caducidad()`, `calculate()`, `get_recommendation()`

### 3. Módulo Trends

Fetch al RSS de Google Trends + feeds de respaldo. Funciona igual en cualquier lenguaje con HTTP client y parser XML/RSS.

### 4. Módulo Analyzer

Una función que:
1. Recibe el resultado del Scorer + datos de la nota
2. Construye el prompt (ver sección 9)
3. Hace el HTTP POST al API de la IA elegida
4. Parsea y limpia la respuesta JSON

### 5. Almacenamiento

Solo necesitas guardar el resultado del análisis por `post_id` y la tabla de la parrilla. Compatible con cualquier base de datos relacional o incluso NoSQL.

---

## 17. Variables a adaptar por marca

Cuando se implemente para un nuevo medio, estos son los valores que deben actualizarse:

### En el Scorer

```python
# 1. Pesos por categoría
#    Reemplazar con el histórico propio del medio
#    Estructura: keyword → [ig_score, x_score, fb_score, tt_score]
category_weights = {
    'sismo': [95, 95, 95, 95],
    # ... según el tipo de contenido del medio
}

# 2. Peaks de audiencia (0.0 – 1.0)
#    Obtener del histórico de analytics del medio
hour_peaks = {
    'instagram': { 0: 0.15, ..., 12: 1.00, ... },
    # ...
}

# 3. Multiplicadores por día
day_multipliers = {
    'instagram': [0.75, 1.00, 0.98, 1.00, 0.96, 0.88, 0.70],  # dom–sab
    # ...
}
```

### En el Prompt

```
# Línea 1 del prompt — identidad del medio
"Eres el editor de redes sociales de {NOMBRE_MEDIO}, {DESCRIPCION_MEDIO}."

# Ejemplo Enfoque:
"Eres el editor de redes sociales de Enfoque Noticias (100.1 FM CDMX),
estación de radio de noticias y música electrónica para audiencia adulta urbana en México."

# Ejemplo para otro medio:
"Eres el editor de redes sociales de El Diario del Norte,
periódico regional líder en noticias de Monterrey y el noreste de México."
```

### En el Módulo de Trending

```python
# Señales de localización (para el peso MX vs Mundial)
local_signals = [
    # Reemplazar con las ciudades / estados / entidades del área de cobertura del medio
    'cdmx', 'ciudad de mexico', 'alcaldía',  # para un medio capitalino
    'monterrey', 'nuevo leon', 'regio',       # para un medio regiomontano
    # ...
]
```

---

## Notas finales

Este sistema fue diseñado desde el principio para que el **algoritmo sea el núcleo de confianza** y la **IA sea un amplificador**, no el árbitro. Los scores los calcula el algoritmo con datos propios del medio; la IA aporta la capa de lenguaje natural (copy) y el juicio editorial que sería difícil de codificar en reglas.

La separación entre Score de Contenido y Score de Momento fue una decisión deliberada: el contenido es el activo, el momento es la táctica. Una nota excelente en un mal horario sigue siendo excelente — solo necesita esperar.

---

*Documentación generada en marzo 2026. Versión de referencia: plugin WordPress v1.7.3 (Enfoque Noticias).*
