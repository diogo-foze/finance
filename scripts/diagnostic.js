const mongoose = require("mongoose");

const MONGODB_URI = "mongodb://localhost:27017/finansys";

async function diagnostic() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado ao MongoDB.");

    const db = mongoose.connection.db;
    const collection = db.collection("clientes");

    const customer = await collection.findOne({});
    console.log("Amostra de Cliente:");
    console.log(JSON.stringify(customer, null, 2));
    
    // Check types
    if (customer) {
        console.log("Tipos:");
        console.log("_id type:", typeof customer._id, "(constructor:", customer._id.constructor.name, ")");
        console.log("userId type:", typeof customer.userId, "(constructor:", customer.userId?.constructor?.name, ")");
        console.log("ativo type:", typeof customer.ativo);
    }

    await mongoose.disconnect();
    console.log("Desconectado.");
  } catch (error) {
    console.error("Erro no diagnóstico:", error);
    process.exit(1);
  }
}

diagnostic();
