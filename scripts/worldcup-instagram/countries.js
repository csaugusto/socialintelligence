'use strict';

// Equipos del Mundial 2026 — código FIFA → { nombre en español, emoji de bandera, color principal }
// Los códigos de 3 letras corresponden a los códigos FIFA usados por Datafactory.
const PAISES = {
  // Anfitriones
  USA: { nombre: 'Estados Unidos', bandera: '🇺🇸', color: '#002868' },
  CAN: { nombre: 'Canadá',         bandera: '🇨🇦', color: '#FF0000' },
  MEX: { nombre: 'México',         bandera: '🇲🇽', color: '#006847' },

  // CONMEBOL
  ARG: { nombre: 'Argentina',      bandera: '🇦🇷', color: '#74ACDF' },
  BRA: { nombre: 'Brasil',         bandera: '🇧🇷', color: '#009C3B' },
  COL: { nombre: 'Colombia',       bandera: '🇨🇴', color: '#FCD116' },
  URU: { nombre: 'Uruguay',        bandera: '🇺🇾', color: '#0038A8' },
  ECU: { nombre: 'Ecuador',        bandera: '🇪🇨', color: '#FFD100' },
  VEN: { nombre: 'Venezuela',      bandera: '🇻🇪', color: '#CF142B' },
  PAR: { nombre: 'Paraguay',       bandera: '🇵🇾', color: '#D52B1E' },
  BOL: { nombre: 'Bolivia',        bandera: '🇧🇴', color: '#D52B1E' },
  PER: { nombre: 'Perú',           bandera: '🇵🇪', color: '#D91023' },
  CHI: { nombre: 'Chile',          bandera: '🇨🇱', color: '#D52B1E' },

  // UEFA
  FRA: { nombre: 'Francia',        bandera: '🇫🇷', color: '#002395' },
  GER: { nombre: 'Alemania',       bandera: '🇩🇪', color: '#000000' },
  ESP: { nombre: 'España',         bandera: '🇪🇸', color: '#AA151B' },
  ENG: { nombre: 'Inglaterra',     bandera: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#CF091F' },
  POR: { nombre: 'Portugal',       bandera: '🇵🇹', color: '#006600' },
  NED: { nombre: 'Países Bajos',   bandera: '🇳🇱', color: '#FF6600' },
  ITA: { nombre: 'Italia',         bandera: '🇮🇹', color: '#003399' },
  BEL: { nombre: 'Bélgica',        bandera: '🇧🇪', color: '#EF3340' },
  CRO: { nombre: 'Croacia',        bandera: '🇭🇷', color: '#FF0000' },
  DEN: { nombre: 'Dinamarca',      bandera: '🇩🇰', color: '#C60C30' },
  AUT: { nombre: 'Austria',        bandera: '🇦🇹', color: '#ED2939' },
  SUI: { nombre: 'Suiza',          bandera: '🇨🇭', color: '#FF0000' },
  SRB: { nombre: 'Serbia',         bandera: '🇷🇸', color: '#C6363C' },
  SCO: { nombre: 'Escocia',        bandera: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', color: '#003080' },
  TUR: { nombre: 'Turquía',        bandera: '🇹🇷', color: '#E30A17' },
  ALB: { nombre: 'Albania',        bandera: '🇦🇱', color: '#E41E20' },
  HUN: { nombre: 'Hungría',        bandera: '🇭🇺', color: '#CE2939' },
  UKR: { nombre: 'Ucrania',        bandera: '🇺🇦', color: '#005BBB' },
  GEO: { nombre: 'Georgia',        bandera: '🇬🇪', color: '#DA121A' },
  POL: { nombre: 'Polonia',        bandera: '🇵🇱', color: '#DC143C' },
  SVK: { nombre: 'Eslovaquia',     bandera: '🇸🇰', color: '#003DA5' },
  SVN: { nombre: 'Eslovenia',      bandera: '🇸🇮', color: '#003DA5' },
  ROU: { nombre: 'Rumania',        bandera: '🇷🇴', color: '#002B7F' },
  WAL: { nombre: 'Gales',          bandera: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', color: '#00A651' },

  // AFC
  JPN: { nombre: 'Japón',          bandera: '🇯🇵', color: '#BC002D' },
  KOR: { nombre: 'Corea del Sur',  bandera: '🇰🇷', color: '#003478' },
  IRN: { nombre: 'Irán',           bandera: '🇮🇷', color: '#239F40' },
  AUS: { nombre: 'Australia',      bandera: '🇦🇺', color: '#00008B' },
  KSA: { nombre: 'Arabia Saudí',   bandera: '🇸🇦', color: '#006C35' },
  JOR: { nombre: 'Jordania',       bandera: '🇯🇴', color: '#007A3D' },
  UZB: { nombre: 'Uzbekistán',     bandera: '🇺🇿', color: '#1EB53A' },
  IRQ: { nombre: 'Irak',           bandera: '🇮🇶', color: '#007A3D' },
  QAT: { nombre: 'Qatar',          bandera: '🇶🇦', color: '#8D153A' },
  UAE: { nombre: 'Emiratos Árabes',bandera: '🇦🇪', color: '#009A44' },

  // CAF
  MAR: { nombre: 'Marruecos',      bandera: '🇲🇦', color: '#C1272D' },
  SEN: { nombre: 'Senegal',        bandera: '🇸🇳', color: '#00853F' },
  NGA: { nombre: 'Nigeria',        bandera: '🇳🇬', color: '#008751' },
  EGY: { nombre: 'Egipto',         bandera: '🇪🇬', color: '#CE1126' },
  CMR: { nombre: 'Camerún',        bandera: '🇨🇲', color: '#007A5E' },
  CIV: { nombre: 'Costa de Marfil',bandera: '🇨🇮', color: '#F77F00' },
  COD: { nombre: 'DR Congo',       bandera: '🇨🇩', color: '#007FFF' },
  MLI: { nombre: 'Mali',           bandera: '🇲🇱', color: '#14B53A' },
  ZAF: { nombre: 'Sudáfrica',      bandera: '🇿🇦', color: '#007A4D' },
  TUN: { nombre: 'Túnez',          bandera: '🇹🇳', color: '#E70013' },
  GHA: { nombre: 'Ghana',          bandera: '🇬🇭', color: '#006B3F' },

  // CONCACAF (no anfitriones)
  PAN: { nombre: 'Panamá',         bandera: '🇵🇦', color: '#DA121A' },
  CRC: { nombre: 'Costa Rica',     bandera: '🇨🇷', color: '#002B7F' },
  HON: { nombre: 'Honduras',       bandera: '🇭🇳', color: '#0073CF' },
  JAM: { nombre: 'Jamaica',        bandera: '🇯🇲', color: '#000000' },

  // OFC
  NZL: { nombre: 'Nueva Zelanda',  bandera: '🇳🇿', color: '#00247D' },
};

function getPais(codigo) {
  if (!codigo) return null;
  const key = codigo.toUpperCase();
  return PAISES[key] || { nombre: codigo, bandera: '🏳️', color: '#555555' };
}

module.exports = { PAISES, getPais };
