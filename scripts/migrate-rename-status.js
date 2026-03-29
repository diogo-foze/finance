const mongoose = require("mongoose");

const MONGODB_URI = "mongodb://localhost:27017/finansys";

async function migrateRename() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado ao MongoDB.");

    const db = mongoose.connection.db;
    const collection = db.collection("clientes");

    const sample = await collection.findOne({});
    console.log("Amostra encontrada:", JSON.stringify(sample, null, 2));

    // Renomear o campo ativo para status
    const result = await collection.updateMany(
      { ativo: { $exists: true } },
      { 
        $rename: { "ativo": "status" }
      }
    );

    console.log(`${result.modifiedCount} clientes atualizados: campo 'ativo' renomeado para 'status'`);

    await mongoose.disconnect();
    console.log("Desconectado.");
  } catch (error) {
    console.error("Erro na migração:", error);
    process.exit(1);
  }
}

migrateRename();
