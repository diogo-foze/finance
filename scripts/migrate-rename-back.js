const mongoose = require("mongoose");

const MONGODB_URI = "mongodb://localhost:27017/finansys";

async function migrateRenameBack() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado ao MongoDB.");

    const db = mongoose.connection.db;
    const collection = db.collection("clientes");

    const sample = await collection.findOne({});
    console.log("Amostra encontrada:", JSON.stringify(sample, null, 2));

    // Renomear o campo status de volta para ativo
    const result = await collection.updateMany(
      { status: { $exists: true } },
      { 
        $rename: { "status": "ativo" }
      }
    );

    console.log(`${result.modifiedCount} clientes atualizados: campo 'status' renomeado de volta para 'ativo'`);

    await mongoose.disconnect();
    console.log("Desconectado.");
  } catch (error) {
    console.error("Erro na migração:", error);
    process.exit(1);
  }
}

migrateRenameBack();
