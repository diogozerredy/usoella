const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const matter = require("gray-matter"); // Nova ferramenta para ler .md

console.log("Iniciando o script de construção...");

const dataPath = path.join(__dirname, "..", "data");
const productsSourceDir = path.join(dataPath, "produtos");
const categoriesSourceDir = path.join(dataPath, "categorias");

const productsOutputFile = path.join(dataPath, "produtos.json");
const categoriesOutputFile = path.join(dataPath, "categorias.json");

// Função para consolidar dados de uma pasta para um arquivo
async function consolidateData(sourceDir, outputFile, wrapperKey) {
  try {
    // CORREÇÃO: Procura por arquivos .json E .md
    const files = await glob.sync(path.join(sourceDir, "**/*.{json,md}"));
    console.log(`Encontrados ${files.length} arquivos em ${sourceDir}`);

    let allData = [];
    for (const file of files) {
      try {
        const fileContent = await fs.readFile(file, "utf-8");
        let content;

        // Se for markdown, extrai os dados do "cabeçalho" (front matter)
        if (path.extname(file) === ".md") {
          content = matter(fileContent).data;
        } else {
          content = JSON.parse(fileContent);
        }

        if (!content.id) {
          content.id = path.basename(file, path.extname(file));
        }
        allData.push(content);
      } catch (err) {
        console.error(`Erro ao processar o arquivo: ${file}`, err);
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
  await consolidateData(
    categoriesSourceDir,
    categoriesOutputFile,
    "categorias"
  );
  await consolidateData(productsSourceDir, productsOutputFile, "produtos");
  console.log("Script de construção finalizado com sucesso!");
}

runBuild();
