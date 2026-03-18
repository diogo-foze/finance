
import connectToDatabase from "./src/lib/mongodb";
import User from "./src/models/User";
import Receita from "./src/models/Receita";
import Despesa from "./src/models/Despesa";
import Message from "./src/models/Message";
import Config from "./src/models/Config";
import fs from "fs";
import path from "path";

async function backup() {
  // Manual .env.local parsing
  if (fs.existsSync(".env.local")) {
    const envFile = fs.readFileSync(".env.local", "utf8");
    envFile.split("\n").forEach(line => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, '');
      }
    });
  }

  await connectToDatabase();
  console.log("Conectado ao MongoDB para backup...");

  const data = {
    users: await User.find({}),
    receitas: await Receita.find({}),
    despesas: await Despesa.find({}),
    messages: await Message.find({}),
    configs: await Config.find({})
  };

  const outputDir = path.join(process.cwd(), "docker-init");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Generate a MongoDB Shell JS script for initialization
  let script = "db = db.getSiblingDB('finansys');\n\n";

  for (const [collection, docs] of Object.entries(data)) {
    if (docs.length > 0) {
      let docsJson = JSON.stringify(docs, null, 2);
      
      // Convert string hex IDs to ObjectId()
      docsJson = docsJson.replace(/"_id": "([a-f0-9]{24})"/g, '"_id": ObjectId("$1")');
      docsJson = docsJson.replace(/"userId": "([a-f0-9]{24})"/g, '"userId": ObjectId("$1")');
      docsJson = docsJson.replace(/"senderId": "([a-f0-9]{24})"/g, '"senderId": ObjectId("$1")');
      docsJson = docsJson.replace(/"receiverId": "([a-f0-9]{24})"/g, '"receiverId": ObjectId("$1")');
      
      // Convert date strings to new Date()
      docsJson = docsJson.replace(/"(createdAt|updatedAt|lastActive|dataRecebimento|dataVencimento)": "([^"]+)"/g, '"$1": new Date("$2")');

      script += `db.${collection}.insertMany(${docsJson});\n\n`;
    }
  }

  fs.writeFileSync(path.join(outputDir, "init-db.js"), script);
  console.log("Backup concluído em ./docker-init/init-db.js");
  process.exit(0);
}

backup().catch(err => {
  console.error("Erro no backup:", err);
  process.exit(1);
});
