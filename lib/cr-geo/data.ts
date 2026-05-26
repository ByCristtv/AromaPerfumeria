import type { Canton, Province } from "./types";

/**
 * Costa Rican provinces (7). Codes follow the official INEC encoding.
 */
export const PROVINCES: readonly Province[] = [
  { code: "1", name: "San José" },
  { code: "2", name: "Alajuela" },
  { code: "3", name: "Cartago" },
  { code: "4", name: "Heredia" },
  { code: "5", name: "Guanacaste" },
  { code: "6", name: "Puntarenas" },
  { code: "7", name: "Limón" },
] as const;

/**
 * Costa Rican cantones (84 as of 2024 — includes Monteverde, added 2020,
 * and Puerto Jiménez, added 2022).
 *
 * Code format: <province_digit><2-digit_canton>. provinceCode is encoded
 * in the first character of `code` and duplicated for filtering convenience.
 *
 * Names are official UTF-8 with accents preserved (matches what the
 * place_order RPC snapshots into orders.shipping_canton).
 */
export const CANTONES: readonly Canton[] = [
  // ───── San José (20) ─────
  { code: "101", name: "San José",               provinceCode: "1" },
  { code: "102", name: "Escazú",                 provinceCode: "1" },
  { code: "103", name: "Desamparados",           provinceCode: "1" },
  { code: "104", name: "Puriscal",               provinceCode: "1" },
  { code: "105", name: "Tarrazú",                provinceCode: "1" },
  { code: "106", name: "Aserrí",                 provinceCode: "1" },
  { code: "107", name: "Mora",                   provinceCode: "1" },
  { code: "108", name: "Goicoechea",             provinceCode: "1" },
  { code: "109", name: "Santa Ana",              provinceCode: "1" },
  { code: "110", name: "Alajuelita",             provinceCode: "1" },
  { code: "111", name: "Vázquez de Coronado",    provinceCode: "1" },
  { code: "112", name: "Acosta",                 provinceCode: "1" },
  { code: "113", name: "Tibás",                  provinceCode: "1" },
  { code: "114", name: "Moravia",                provinceCode: "1" },
  { code: "115", name: "Montes de Oca",          provinceCode: "1" },
  { code: "116", name: "Turrubares",             provinceCode: "1" },
  { code: "117", name: "Dota",                   provinceCode: "1" },
  { code: "118", name: "Curridabat",             provinceCode: "1" },
  { code: "119", name: "Pérez Zeledón",          provinceCode: "1" },
  { code: "120", name: "León Cortés Castro",     provinceCode: "1" },

  // ───── Alajuela (16) ─────
  { code: "201", name: "Alajuela",               provinceCode: "2" },
  { code: "202", name: "San Ramón",              provinceCode: "2" },
  { code: "203", name: "Grecia",                 provinceCode: "2" },
  { code: "204", name: "San Mateo",              provinceCode: "2" },
  { code: "205", name: "Atenas",                 provinceCode: "2" },
  { code: "206", name: "Naranjo",                provinceCode: "2" },
  { code: "207", name: "Palmares",               provinceCode: "2" },
  { code: "208", name: "Poás",                   provinceCode: "2" },
  { code: "209", name: "Orotina",                provinceCode: "2" },
  { code: "210", name: "San Carlos",             provinceCode: "2" },
  { code: "211", name: "Zarcero",                provinceCode: "2" },
  { code: "212", name: "Sarchí",                 provinceCode: "2" },
  { code: "213", name: "Upala",                  provinceCode: "2" },
  { code: "214", name: "Los Chiles",             provinceCode: "2" },
  { code: "215", name: "Guatuso",                provinceCode: "2" },
  { code: "216", name: "Río Cuarto",             provinceCode: "2" },

  // ───── Cartago (8) ─────
  { code: "301", name: "Cartago",                provinceCode: "3" },
  { code: "302", name: "Paraíso",                provinceCode: "3" },
  { code: "303", name: "La Unión",               provinceCode: "3" },
  { code: "304", name: "Jiménez",                provinceCode: "3" },
  { code: "305", name: "Turrialba",              provinceCode: "3" },
  { code: "306", name: "Alvarado",               provinceCode: "3" },
  { code: "307", name: "Oreamuno",               provinceCode: "3" },
  { code: "308", name: "El Guarco",              provinceCode: "3" },

  // ───── Heredia (10) ─────
  { code: "401", name: "Heredia",                provinceCode: "4" },
  { code: "402", name: "Barva",                  provinceCode: "4" },
  { code: "403", name: "Santo Domingo",          provinceCode: "4" },
  { code: "404", name: "Santa Bárbara",          provinceCode: "4" },
  { code: "405", name: "San Rafael",             provinceCode: "4" },
  { code: "406", name: "San Isidro",             provinceCode: "4" },
  { code: "407", name: "Belén",                  provinceCode: "4" },
  { code: "408", name: "Flores",                 provinceCode: "4" },
  { code: "409", name: "San Pablo",              provinceCode: "4" },
  { code: "410", name: "Sarapiquí",              provinceCode: "4" },

  // ───── Guanacaste (11) ─────
  { code: "501", name: "Liberia",                provinceCode: "5" },
  { code: "502", name: "Nicoya",                 provinceCode: "5" },
  { code: "503", name: "Santa Cruz",             provinceCode: "5" },
  { code: "504", name: "Bagaces",                provinceCode: "5" },
  { code: "505", name: "Carrillo",               provinceCode: "5" },
  { code: "506", name: "Cañas",                  provinceCode: "5" },
  { code: "507", name: "Abangares",              provinceCode: "5" },
  { code: "508", name: "Tilarán",                provinceCode: "5" },
  { code: "509", name: "Nandayure",              provinceCode: "5" },
  { code: "510", name: "La Cruz",                provinceCode: "5" },
  { code: "511", name: "Hojancha",               provinceCode: "5" },

  // ───── Puntarenas (13 — includes Monteverde and Puerto Jiménez) ─────
  { code: "601", name: "Puntarenas",             provinceCode: "6" },
  { code: "602", name: "Esparza",                provinceCode: "6" },
  { code: "603", name: "Buenos Aires",           provinceCode: "6" },
  { code: "604", name: "Montes de Oro",          provinceCode: "6" },
  { code: "605", name: "Osa",                    provinceCode: "6" },
  { code: "606", name: "Quepos",                 provinceCode: "6" },
  { code: "607", name: "Golfito",                provinceCode: "6" },
  { code: "608", name: "Coto Brus",              provinceCode: "6" },
  { code: "609", name: "Parrita",                provinceCode: "6" },
  { code: "610", name: "Corredores",             provinceCode: "6" },
  { code: "611", name: "Garabito",               provinceCode: "6" },
  { code: "612", name: "Monteverde",             provinceCode: "6" },
  { code: "613", name: "Puerto Jiménez",         provinceCode: "6" },

  // ───── Limón (6) ─────
  { code: "701", name: "Limón",                  provinceCode: "7" },
  { code: "702", name: "Pococí",                 provinceCode: "7" },
  { code: "703", name: "Siquirres",              provinceCode: "7" },
  { code: "704", name: "Talamanca",              provinceCode: "7" },
  { code: "705", name: "Matina",                 provinceCode: "7" },
  { code: "706", name: "Guácimo",                provinceCode: "7" },
] as const;
