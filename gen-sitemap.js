#!/usr/bin/env node
/**
 * gen-sitemap.js — alex-miller
 * Wrapper around kg-site-builder/lib/gen-sitemap.js.
 * Run manually: node gen-sitemap.js
 * Also called automatically by node build.js.
 */
const path = require('path');
const { generateSitemap } = require('C:\\Users\\KillerGrowth\\.openclaw\\workspace\\tools\\kg-site-builder\\lib\\gen-sitemap');
const result = generateSitemap({ distDir: path.join(__dirname, 'dist'), siteRoot: __dirname, domain: 'amauctionsandrealestate.com' });
console.log('sitemap.xml generated — ' + result.count + ' URLs (amauctionsandrealestate.com)');
