import mongoose, { Schema, model, models } from "mongoose";

const ClienteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nome: {
      type: String,
      required: true,
    },
    cpf: {
      type: String,
      required: true,
    },
    dataNascimento: {
      type: Date,
    },
    email: {
      type: String,
    },
    telefone: {
      type: String,
      required: true,
    },
    limiteCredito: {
      type: Number,
      default: 0,
    },
    ativo: {
      type: Number,
      default: 1,
      required: true,
    },
  },
  { timestamps: true }
);

// Add index for faster queries by user and uniqueness per user
ClienteSchema.index({ userId: 1, cpf: 1 }, { unique: true });
ClienteSchema.index({ userId: 1, nome: 1 });

if (mongoose.models.Cliente) {
  delete mongoose.models.Cliente;
}
const Cliente = model("Cliente", ClienteSchema);

export default Cliente;
