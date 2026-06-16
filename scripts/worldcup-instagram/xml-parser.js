'use strict';

const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  // Forzar arrays para elementos que pueden aparecer en singular o plural
  isArray: (name) => ['Event', 'Evento', 'Match', 'Partido', 'Tournament', 'Torneo'].includes(name),
});

// IDs de eventos ya procesados — evita postear el mismo gol dos veces
// cuando Datafactory reenvía el XML completo del partido tras cada cambio.
const eventosYaProcesados = new Set();

const TIPO_GOL = process.env.XML_GOAL_TYPE || 'goal';

/**
 * Parsea el XML recibido de Datafactory y retorna los goles nuevos encontrados.
 *
 * Estructura esperada (Datafactory estándar):
 * <Sports>
 *   <Tournament id="WC2026">
 *     <Match id="..." status="InProgress">
 *       <LocalTeam  id="..." shortname="ARG" name="Argentina" score="1"/>
 *       <VisitorTeam id="..." shortname="FRA" name="Francia"  score="0"/>
 *       <Events>
 *         <Event id="1" type="goal" minute="23" extra="0">
 *           <Player id="100" name="Messi, Lionel" team="10"/>
 *           <AssistPlayer id="101" name="De Paul, Rodrigo" team="10"/>
 *         </Event>
 *       </Events>
 *     </Match>
 *   </Tournament>
 * </Sports>
 *
 * Si tu feed usa atributos distintos, ajusta los accessors a continuación.
 */
function detectarGoles(xmlString) {
  let doc;
  try {
    doc = parser.parse(xmlString);
  } catch (err) {
    console.error('[xml-parser] Error al parsear XML:', err.message);
    return [];
  }

  const golesNuevos = [];

  const sports = doc.Sports || doc.Feed || doc;
  const tournaments = toArray(sports.Tournament || sports.Torneo);

  for (const torneo of tournaments) {
    const matches = toArray(torneo.Match || torneo.Partido);

    for (const partido of matches) {
      const matchId = partido['@_id'] || partido['@_matchId'];
      const local    = partido.LocalTeam    || partido.HomeTeam  || {};
      const visitante= partido.VisitorTeam  || partido.AwayTeam  || {};
      // Events puede ser un objeto o, si hay múltiples, un array — normalizar
      const contenedorEventos = toArray(partido.Events || partido.Eventos)[0] || {};
      const eventos = toArray(contenedorEventos.Event || contenedorEventos.Evento);

      for (const evento of eventos) {
        const tipo    = evento['@_type'] || evento['@_tipo'] || '';
        const eventoId = String(evento['@_id'] || evento['@_eventId'] || '');

        if (tipo.toLowerCase() !== TIPO_GOL.toLowerCase()) continue;
        if (eventosYaProcesados.has(eventoId)) continue;

        eventosYaProcesados.add(eventoId);

        const jugador = evento.Player || evento.Jugador || {};
        const asistencia = evento.AssistPlayer || evento.Asistencia || null;

        // Determinar qué equipo anotó por el team id del jugador
        const jugadorTeamId = String(jugador['@_team'] || jugador['@_teamId'] || '');
        const localId       = String(local['@_id'] || '');
        const equipoGol     = jugadorTeamId === localId ? 'local' : 'visitante';

        golesNuevos.push({
          matchId:        String(matchId || ''),
          eventoId,
          minuto:         evento['@_minute'] || evento['@_minuto'] || '?',
          extra:          evento['@_extra']  || 0,
          equipoGol,
          goleador:       jugador['@_name']  || jugador['@_nombre'] || 'Jugador desconocido',
          asistencia:     asistencia ? (asistencia['@_name'] || asistencia['@_nombre'] || null) : null,
          local: {
            nombre:   local['@_name']       || local['@_nombre']    || local['@_shortname'] || '',
            codigo:   local['@_shortname']  || local['@_code']      || local['@_countryCode'] || '',
            goles:    Number(local['@_score']  || 0),
          },
          visitante: {
            nombre:   visitante['@_name']     || visitante['@_nombre']    || visitante['@_shortname'] || '',
            codigo:   visitante['@_shortname']|| visitante['@_code']      || visitante['@_countryCode'] || '',
            goles:    Number(visitante['@_score'] || 0),
          },
        });
      }
    }
  }

  return golesNuevos;
}

function toArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

module.exports = { detectarGoles };
