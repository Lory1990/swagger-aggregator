import fs from 'fs-extra';

const srcDir = './src/public';
const destDir = './dist/public';

async function copyDirectory(source, destination) {
  try {
    await fs.ensureDir(destination); // Assicura che la cartella di destinazione esista
    await fs.copy(source, destination, { overwrite: true });
    console.log('Cartella copiata con successo!');
  } catch (err) {
    console.error('Errore durante la copia:', err);
  }
}

copyDirectory(srcDir, destDir);