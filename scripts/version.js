#!/usr/bin/env node
/**
 * Writes version.json at the repo root with the current build's commit
 * hash and timestamp. Run by Vercel's buildCommand on every deploy.
 *
 * Falls back to "local" when not running on Vercel, so local builds
 * still produce a valid file.
 */
const fs = require('fs');
const path = require('path');

const sha = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);
const now = new Date();
const iso = now.toISOString();

const data = {
  commit: sha,
  date: iso.slice(0, 10),
  time: iso.slice(11, 16),
  built: iso,
};

const out = path.join(__dirname, '..', 'version.json');
fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
console.log(`Stamped version: v${data.commit} (${data.date} ${data.time}Z)`);
