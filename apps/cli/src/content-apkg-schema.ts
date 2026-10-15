/** Legacy deck-package database layout; every output starts as an empty artifact. */
export const CONTENT_APKG_SCHEMA = `
  CREATE TABLE col (id INTEGER PRIMARY KEY, crt INTEGER NOT NULL, mod INTEGER NOT NULL,
    scm INTEGER NOT NULL, ver INTEGER NOT NULL, dty INTEGER NOT NULL, usn INTEGER NOT NULL,
    ls INTEGER NOT NULL, conf TEXT NOT NULL, models TEXT NOT NULL, decks TEXT NOT NULL,
    dconf TEXT NOT NULL, tags TEXT NOT NULL);
  CREATE TABLE notes (id INTEGER PRIMARY KEY, guid TEXT NOT NULL, mid INTEGER NOT NULL,
    mod INTEGER NOT NULL, usn INTEGER NOT NULL, tags TEXT NOT NULL, flds TEXT NOT NULL,
    sfld INTEGER NOT NULL, csum INTEGER NOT NULL, flags INTEGER NOT NULL, data TEXT NOT NULL);
  CREATE TABLE cards (id INTEGER PRIMARY KEY, nid INTEGER NOT NULL, did INTEGER NOT NULL,
    ord INTEGER NOT NULL, mod INTEGER NOT NULL, usn INTEGER NOT NULL, type INTEGER NOT NULL,
    queue INTEGER NOT NULL, due INTEGER NOT NULL, ivl INTEGER NOT NULL, factor INTEGER NOT NULL,
    reps INTEGER NOT NULL, lapses INTEGER NOT NULL, left INTEGER NOT NULL, odue INTEGER NOT NULL,
    odid INTEGER NOT NULL, flags INTEGER NOT NULL, data TEXT NOT NULL);
  CREATE TABLE revlog (id INTEGER PRIMARY KEY, cid INTEGER NOT NULL, usn INTEGER NOT NULL,
    ease INTEGER NOT NULL, ivl INTEGER NOT NULL, lastIvl INTEGER NOT NULL, factor INTEGER NOT NULL,
    time INTEGER NOT NULL, type INTEGER NOT NULL);
  CREATE TABLE graves (usn INTEGER NOT NULL, oid INTEGER NOT NULL, type INTEGER NOT NULL);
  CREATE INDEX ix_notes_usn ON notes(usn);
  CREATE INDEX ix_cards_usn ON cards(usn);
  CREATE INDEX ix_revlog_usn ON revlog(usn);
  CREATE INDEX ix_cards_nid ON cards(nid);
  CREATE INDEX ix_cards_sched ON cards(did, queue, due);
  CREATE INDEX ix_revlog_cid ON revlog(cid);
  CREATE INDEX ix_notes_csum ON notes(csum);
`;

export function contentDeck(id: number, name: string, modified: number) {
  return {
    id,
    name,
    mod: modified,
    usn: -1,
    dyn: 0,
    conf: 1,
    desc: '',
    collapsed: false,
    extendNew: 0,
    extendRev: 0,
    newToday: [0, 0],
    lrnToday: [0, 0],
    revToday: [0, 0],
    timeToday: [0, 0],
  };
}
