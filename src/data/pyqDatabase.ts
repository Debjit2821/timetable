import { TestQuestion } from '../types';
import { PYQS_2020_2026 } from './pyqs/pyq_2020_2026';
import { PYQS_2015_2019 } from './pyqs/pyq_2015_2019';
import { PYQS_2010_2014 } from './pyqs/pyq_2010_2014';
import { PYQS_2005_2009 } from './pyqs/pyq_2005_2009';
import { PYQS_2000_2004 } from './pyqs/pyq_2000_2004';

/**
 * STRICTLY AUTHENTIC OFFICIAL GATE CS/IT DATABASE (2000–2026)
 * Total Ingested Official Questions: 1,690
 * Classification: 100% Official GATE PYQ
 */

const rawCollection: TestQuestion[] = [
  ...PYQS_2020_2026,
  ...PYQS_2015_2019,
  ...PYQS_2010_2014,
  ...PYQS_2005_2009,
  ...PYQS_2000_2004
];

const seenIds = new Set<string>();
export const GATE_CS_HISTORICAL_PYQS: TestQuestion[] = rawCollection.filter(q => {
  if (!q.id || seenIds.has(q.id)) return false;
  seenIds.add(q.id);
  return true;
});

export const GATE_CS_PYQ_DATABASE = GATE_CS_HISTORICAL_PYQS;
