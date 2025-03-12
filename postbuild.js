import fs from 'fs-extra';

const srcDir = './src/public';
const destDir = './dist/public';

const filesToCopy = ["src/openapi-configuration.json"];
const filesToCopyDestDir = './dist';

async function copyDirectory(source, destination) {
  try {
    await fs.ensureDir(destination); 
    await fs.copy(source, destination, { overwrite: true });
    console.log('Folder copied with success');
  } catch (err) {
    console.error('Error during copy:', err);
  }
}

async function copyFiles() {
   try {
     for (const file of filesToCopy) {
       const srcFilePath = `./${file}`;
       const destFilePath = `${filesToCopyDestDir}/${file}`;
       await fs.copy(srcFilePath, destFilePath);
       console.log(`Copied ${file} to ${filesToCopyDestDir}`);
     }
   } catch (err) {
     console.error('Error during file copy:', err);
   }
 }

copyDirectory(srcDir, destDir);
copyFiles();
