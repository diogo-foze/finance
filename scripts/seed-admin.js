const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Erro: MONGODB_URI não encontrada no .env.local");
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado ao MongoDB...");

    const email = "admin@finansys.com";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const UserSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: { type: String },
      provider: { type: String, default: "credentials" },
      role: { type: String, default: "user" }
    });

    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.role = "admin";
      await existingUser.save();
      console.log("Papel do usuário administrador atualizado para 'admin'.");
    } else {
      await User.create({
        name: "Administrador",
        email: email,
        password: hashedPassword,
        provider: "credentials",
        role: "admin"
      });
      console.log("Usuário administrador criado com sucesso!");
      console.log(`Email: ${email}`);
      console.log(`Senha: ${password}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    process.exit(1);
  }
}

seed();
