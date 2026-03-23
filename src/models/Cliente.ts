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
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Add index for faster queries by user and uniqueness per user
ClienteSchema.index({ userId: 1, cpf: 1 }, { unique: true });
ClienteSchema.index({ userId: 1, nome: 1 });

const Cliente = models.Cliente || model("Cliente", ClienteSchema);

export default Cliente;
