#!/usr/bin/env node
/**
 * list-functions.js
 * 
 * Lists all available functions in the tools.ts file
 */

import { tools } from '../src/tools.js';

console.log('Available Amped Finance Functions:');
console.log('==================================\n');

tools.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool.name}`);
    console.log(`   ${tool.description}`);
    console.log(`   Required params: ${tool.required.join(', ')}`);
    console.log('');
});

console.log(`Total functions: ${tools.length}`);