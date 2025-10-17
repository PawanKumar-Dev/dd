const fs = require('fs');

// Read the file
const content = fs.readFileSync('/home/rsa-key-20250926/dd/lib/resellerclub.ts', 'utf8');

// Find the TLD mapping object
const lines = content.split('\n');
let inMapping = false;
let mappingStart = -1;
let mappingEnd = -1;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('TLD_MAPPING') && line.includes('=')) {
    inMapping = true;
    mappingStart = i;
    braceCount = 0;
  }

  if (inMapping) {
    // Count braces to find the end of the object
    for (const char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }

    if (braceCount === 0 && line.includes('}')) {
      mappingEnd = i;
      break;
    }
  }
}

if (mappingStart !== -1 && mappingEnd !== -1) {
  // Extract the mapping section
  const mappingLines = lines.slice(mappingStart, mappingEnd + 1);
  const mappingContent = mappingLines.join('\n');

  // Parse and deduplicate
  const seen = new Set();
  const deduplicatedLines = [];

  for (const line of mappingLines) {
    const match = line.match(/^\s*([a-z]+):\s*"[^"]+",?\s*$/);
    if (match) {
      const key = match[1];
      if (seen.has(key)) {
        console.log(`Removing duplicate: ${key}`);
        continue; // Skip duplicate
      }
      seen.add(key);
    }
    deduplicatedLines.push(line);
  }

  // Replace the mapping section
  const newContent = [
    ...lines.slice(0, mappingStart),
    ...deduplicatedLines,
    ...lines.slice(mappingEnd + 1)
  ].join('\n');

  fs.writeFileSync('/home/rsa-key-20250926/dd/lib/resellerclub.ts', newContent);
  console.log('Fixed duplicates in resellerclub.ts');
} else {
  console.log('Could not find TLD_MAPPING object');
}
