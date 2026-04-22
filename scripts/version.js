#!/usr/bin/env node
/**
 * Build-time versioning:
 *   1. Writes /version.json with the current commit hash + timestamp.
 *   2. Stamps every index.html with window.APP_VERSION = "<hash>" so
 *      each running page knows its own build version at runtime and
 *      can compare against the live /version.json to force a reload
 *      when it has gone stale.
 *
 * Run by Vercel's buildCommand on every deploy.
 */
const fs = require('fs');
const path = require('path');

const sha = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);
const now = new Date();
const iso = now.toISOString();

const version = {
  commit: sha,
  date: iso.slice(0, 10),
  time: iso.slice(11, 16),
  built: iso,
};

const root = path.join(__dirname, '..');
fs.writeFileSync(path.join(root, 'version.json'), JSON.stringify(version, null, 2) + '\n');

// Stamp every index.html by rewriting `window.APP_VERSION = "anything"`
// to the fresh hash. Idempotent — runs cleanly on both unstamped files
// (with the placeholder) and previously-stamped files.
const stampPattern = /window\.APP_VERSION\s*=\s*"[^"]*"/g;
const stampReplacement = `window.APP_VERSION = "${sha}"`;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'scripts') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html') {
      let content = fs.readFileSync(full, 'utf8');
      if (stampPattern.test(content)) {
        const updated = content.replace(stampPattern, stampReplacement);
        if (updated !== content) fs.writeFileSync(full, updated);
      }
    }
  }
}
walk(root);

console.log(`Stamped version: v${sha} (${version.date} ${version.time}Z)`);
