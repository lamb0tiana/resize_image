const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");

async function resizeImagesInPlace(
  baseFolder,
  size = { width: 1200, height: 800 },
  endWith = "tranche.jpg"
) {
  let processed = 0;
  let errors = 0;
  let totalFound = 0;

  const { width, height } = size;

  console.log(
    `Recherche récursive des images se terminant par "${endWith}" dans ${baseFolder}...\n`
  );

  async function processDirectory(currentPath, relativePath = "") {
    try {
      const items = await fs.readdir(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          const newRelativePath = relativePath
            ? path.join(relativePath, item)
            : item;
          await processDirectory(itemPath, newRelativePath);
        } else if (
          stats.isFile() &&
          item.toLowerCase().endsWith(endWith.toLowerCase())
        ) {
          totalFound++;

          try {
            const baseName = path.parse(item).name;
            const outputFilename = `${baseName}-${width}x${height}.jpg`;
            const outputPath = path.join(currentPath, outputFilename);

            await sharp(itemPath)
              .resize(width, height, {
                fit: "cover",
                position: "center",
              })
              .jpeg({ quality: 90 })
              .toFile(outputPath);

            const displayPath = relativePath
              ? path.join(relativePath, item)
              : item;
            const displayOutput = relativePath
              ? path.join(relativePath, outputFilename)
              : outputFilename;

            console.log(`✓ ${displayPath} → ${displayOutput}`);
            processed++;
          } catch (error) {
            const displayPath = relativePath
              ? path.join(relativePath, item)
              : item;
            console.error(`✗ Erreur avec ${displayPath}:`, error.message);
            errors++;
          }
        }
      }
    } catch (error) {
      console.error(
        `Erreur lors du parcours de ${currentPath}:`,
        error.message
      );
      errors++;
    }
  }

  await processDirectory(baseFolder);

  console.log(`\n=== Résumé ===`);
  console.log(`Images "${endWith}" trouvées: ${totalFound}`);
  console.log(`Images traitées: ${processed}`);
  console.log(`Erreurs: ${errors}`);
  console.log(`Les images redimensionnées sont dans leurs dossiers respectifs`);
}

// Utilisation CLI
if (require.main === module) {
  const baseFolder = process.argv[2] || ".";
  const width = parseInt(process.argv[3]) || 1200;
  const height = parseInt(process.argv[4]) || 800;
  const endWith = process.argv[5] || "tranche.jpg";

  console.log(
    `Démarrage du redimensionnement in-place des images se terminant par "${endWith}"...`
  );
  console.log(`Dossier de base: ${baseFolder}`);
  console.log(`Taille: ${width}x${height}`);
  console.log(`Suffixe ciblé: "${endWith}"\n`);

  resizeImagesInPlace(baseFolder, { width, height }, endWith)
    .then(() => console.log("\n🎉 Terminé!"))
    .catch((error) => console.error("Erreur:", error));
}

module.exports = { resizeImagesInPlace };
