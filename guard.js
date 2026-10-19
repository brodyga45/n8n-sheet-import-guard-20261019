// Paste into an n8n Code node: JavaScript, Run Once for All Items.
// Use strings for IDs. Numeric IDs and surrounding whitespace are rejected.
const KEY_FIELDS = ['source', 'record_id'];
const OUTPUT_KEY = 'import_key';
const MAX_ITEMS = 10000;

const items = $input.all();
if (items.length > MAX_ITEMS) throw new Error(`Batch exceeds ${MAX_ITEMS} rows; split upstream.`);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (typeof value === 'object' && value !== null) {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  throw new Error('Input must contain only JSON values.');
}
const seen = new Map();
const result = [];
const failures = [];
items.forEach((item, i) => {
  const row = item.json;
  const rowNumber = i + 1;
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    failures.push(`row ${rowNumber}: expected an object`); return;
  }
  if (own(row, OUTPUT_KEY)) {
    failures.push(`row ${rowNumber}: reserved output field ${OUTPUT_KEY} already exists`); return;
  }
  if (!KEY_FIELDS.every(k => own(row, k) && typeof row[k] === 'string' && row[k].length > 0 && row[k] === row[k].trim())) {
    failures.push(`row ${rowNumber}: keys must be nonempty strings without surrounding whitespace`); return;
  }
  // JSON tuples avoid delimiter collisions: ["a|b","c"] differs from ["a","b|c"].
  const key = JSON.stringify(KEY_FIELDS.map(k => row[k]));
  const signature = canonical(row);
  const previous = seen.get(key);
  if (previous) {
    if (previous.signature !== signature) failures.push(`rows ${previous.rowNumber} and ${rowNumber}: same key, conflicting payload`);
    return;
  }
  seen.set(key, {signature, rowNumber});
  result.push({json: {...row, [OUTPUT_KEY]: key}, pairedItem: {item: i}});
});
if (failures.length) {
  // Row positions only: do not put private input values in exception logs.
  throw new Error(`Import blocked (${failures.length} issue(s)). ${failures.slice(0, 20).join('; ')}${failures.length > 20 ? '; more issues omitted' : ''}`);
}
return result;
