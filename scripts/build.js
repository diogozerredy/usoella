const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");

console.log("Iniciando o script de construção...");

// CORREÇÃO: Removida a referência à pasta 'usoella'
const dataPath = path.join(__dirname, "..", "data");
const productsSourceDir = path.join(dataPath, "produtos");
const categoriesSourceDir = path.join(dataPath, "categorias");

const productsOutputFile = path.join(dataPath, "produtos.json");
const categoriesOutputFile = path.join(dataPath, "categorias.json");

// (O resto do arquivo continua exatamente o mesmo)

async function consolidateJson(sourceDir, outputFile, wrapperKey) {
  try {
    const files = await glob.sync(path.join(sourceDir, "**/*.json"));
    console.log(`Encontrados ${files.length} arquivos em ${sourceDir}`);

    let allData = [];
    for (const file of files) {
      try {
        const content = await fs.readJson(file);
        if (!content.id) {
          content.id = path.basename(file, ".json");
        }
        allData.push(content);
      } catch (err) {
        console.error(`Erro ao ler o arquivo JSON: ${file}`, err);
      }
    }

    const outputData = { [wrapperKey]: allData };
    await fs.writeJson(outputFile, outputData, { spaces: 2 });
    console.log(`Dados consolidados com sucesso em ${outputFile}`);
  } catch (err) {
    console.error(`Erro ao consolidar dados de ${sourceDir}:`, err);
    process.exit(1);
  }
}

async function runBuild() {
  await fs.ensureDir(dataPath);
  await consolidateJson(
    categoriesSourceDir,
    categoriesOutputFile,
    "categorias"
  );
  await consolidateJson(productsSourceDir, productsOutputFile, "produtos");
  console.log("Script de construção finalizado com sucesso!");
}

runBuild();
