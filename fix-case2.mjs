import fs from 'fs';

const file = fs.readFileSync('src/story/case.ts', 'utf8');
const lines = file.split('\n');

const idx = lines.findIndex((l) => l.includes('kicked behind the desk'));
if (idx === -1) {
  console.error('matchbox line not found');
  process.exit(1);
}

const newLine =
  "      'A bar matchbox kicked behind the desk. Inside the flap, in pencil: " +
  '\\u0022' +
  'clock ' +
  '\\u00b7' +
  ' book ' +
  '\\u00b7' +
  ' shelf' +
  '\\u0022' +
  ' ' +
  '\\u2014' +
  ' not a code, an order. Vera scattered the suitcase digits around the room and left herself only the sequence to read them back. The Blue Room is a quiet bar across town. Not her neighborhood.';

lines[idx] = newLine + "',";
fs.writeFileSync('src/story/case.ts', lines.join('\n'));

// sanity: ensure old digits text is gone
if (file.includes('4 \\u00b7 7 \\u00b7 2 \\u00b7 9')) {
  console.log('WARN: old digit text still present (was in a different line)');
}
console.log('matchbox entry updated (line ' + (idx + 1) + ')');
