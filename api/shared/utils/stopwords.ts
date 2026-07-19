/**
 * Stopwords removed from FTS queries before submitting to NATURAL LANGUAGE MODE.
 *
 * Spanish: prepositions, articles, contractions (a, ante, bajo, con, contra, de, desde,
 * en, entre, hacia, hasta, para, por, según, sin, sobre, tras, el, la, los, las, un, una,
 * unos, unas, lo, al, del).
 *
 * English: prepositions, articles, common conjunctions (the, a, an, of, in, on, at, to,
 * for, with, from, by, and, or, but, if, then, else, when, up, down, out, over, under,
 * into, onto).
 *
 * These are function words that produce false positives in ngram FTS — a 3-gram "de "
 * would match every record containing any word boundary before "de".
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  // Spanish prepositions
  'a',
  'ante',
  'bajo',
  'con',
  'contra',
  'de',
  'desde',
  'en',
  'entre',
  'hacia',
  'hasta',
  'para',
  'por',
  'según',
  'sin',
  'sobre',
  'tras',
  // Spanish articles and contractions
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'unos',
  'unas',
  'lo',
  'al',
  'del',
  // English prepositions and articles
  'the',
  'a',
  'an',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'from',
  'by',
  // English conjunctions and common noise words
  'and',
  'or',
  'but',
  'if',
  'then',
  'else',
  'when',
  'up',
  'down',
  'out',
  'over',
  'under',
  'into',
  'onto',
]);
