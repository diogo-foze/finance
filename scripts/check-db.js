const mongoose = require("mongoose");
const MONGODB_URI = "mongodb://localhost:27017/finansys";

async function checkDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado ao MongoDB.");

    const db = mongoose.connection.db;
    const collection = db.collection("clientes");

    const customers = await collection.find({}).sort({ createdAt: -1 }).limit(5).toArray();

    console.log("Últimos 5 clientes cadastrados:");
    customers.forEach(c => {
      console.log(`- Nome: ${c.nome}, CPF: ${c.cpf}, Ativo: ${c.ativo} (Tipo: ${typeof c.ativo})`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Erro ao verificar banco:", error);
    process.exit(1);
  }
}

checkDb();
