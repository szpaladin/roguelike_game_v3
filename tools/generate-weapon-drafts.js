import path from 'path';
import { fileURLToPath } from 'url';
import { generateDraftFiles } from './weapon-draft-generator.js';

export function runDraftGeneration(options = {}) {
    return generateDraftFiles(options);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (invokedFile && path.resolve(currentFile) === invokedFile) {
    const result = runDraftGeneration();
    console.log(`Generated ${result.fusionCount} fusion drafts and ${result.evolutionCount} evolution drafts.`);
}
