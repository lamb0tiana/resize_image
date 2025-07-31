const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

async function resizeTrancheImagesInPlace(baseFolder, size = { width: 1200, height: 800 }) {
    /**
     * Redimensionne récursivement toutes les images se terminant par "tranche.jpg" 
     * et les sauvegarde dans leurs dossiers respectifs en gardant l'arborescence
     * 
     * @param {string} baseFolder - Dossier racine à parcourir récursivement
     * @param {object} size - Taille de sortie {width, height}
     */
    
    let processed = 0;
    let errors = 0;
    let totalFound = 0;
    
    console.log(`Recherche récursive des images se terminant par "tranche.jpg" dans ${baseFolder}...\n`);
    
    // Fonction récursive pour parcourir les dossiers
    async function processDirectory(currentPath, relativePath = '') {
        try {
            const items = await fs.readdir(currentPath);
            
            for (const item of items) {
                const itemPath = path.join(currentPath, item);
                const stats = await fs.stat(itemPath);
                
                if (stats.isDirectory()) {
                    // C'est un dossier, parcourir récursivement
                    const newRelativePath = relativePath ? path.join(relativePath, item) : item;
                    await processDirectory(itemPath, newRelativePath);
                } else if (stats.isFile() && item.toLowerCase().endsWith('tranche.jpg')) {
                    // C'est un fichier tranche.jpg
                    totalFound++;
                    
                    try {
                        // Créer le nom du fichier redimensionné dans le même dossier
                        const baseName = path.parse(item).name; // nom sans extension
                        const outputFilename = `${baseName}_800x800.jpg`;
                        const outputPath = path.join(currentPath, outputFilename); // même dossier
                        
                        // Redimensionner l'image avec Sharp
                        await sharp(itemPath)
                            .resize(size.width, size.height, {
                                fit: 'cover',
                                position: 'center'
                            })
                            .jpeg({ quality: 90 })
                            .toFile(outputPath);
                        
                        const displayPath = relativePath ? path.join(relativePath, item) : item;
                        const displayOutput = relativePath ? path.join(relativePath, outputFilename) : outputFilename;
                        console.log(`✓ ${displayPath} → ${displayOutput}`);
                        processed++;
                        
                    } catch (error) {
                        const displayPath = relativePath ? path.join(relativePath, item) : item;
                        console.error(`✗ Erreur avec ${displayPath}:`, error.message);
                        errors++;
                    }
                }
            }
            
        } catch (error) {
            console.error(`Erreur lors du parcours de ${currentPath}:`, error.message);
            errors++;
        }
    }
    
    // Démarrer le parcours récursif
    await processDirectory(baseFolder);
    
    console.log(`\n=== Résumé ===`);
    console.log(`Images "tranche.jpg" trouvées: ${totalFound}`);
    console.log(`Images traitées: ${processed}`);
    console.log(`Erreurs: ${errors}`);
    console.log(`Les images redimensionnées sont dans leurs dossiers respectifs`);
}



// Utilisation
if (require.main === module) {
    const baseFolder = process.argv[2] || '.'; // Dossier racine à parcourir
    
    console.log('Démarrage du redimensionnement in-place des images "tranche.jpg"...');
    console.log(`Dossier de base: ${baseFolder}`);
    console.log(`Les images redimensionnées seront créées dans leurs dossiers respectifs\n`);
    
    resizeTrancheImagesInPlace(baseFolder)
        .then(() => console.log('\n🎉 Terminé!'))
        .catch(error => console.error('Erreur:', error));
}

module.exports = { resizeTrancheImagesInPlace };
