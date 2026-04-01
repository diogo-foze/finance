import mongoose, { Schema, model, models } from "mongoose";

const FornecedorSchema = new Schema(
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
      validate: {
        validator: function(v: string) {
          // Aceita CPF (11) ou CNPJ (14) - apenas números
          return /^\d{11}$|^\d{14}$/.test(v);
        },
        message: (props: any) => `${props.value} não é um CPF ou CNPJ válido! O documento deve conter 11 (CPF) ou 14 (CNPJ) dígitos numéricos.`
      }
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
FornecedorSchema.index({ userId: 1, cpf: 1 }, { unique: true });
FornecedorSchema.index({ userId: 1, nome: 1 });

const Fornecedor = models.Fornecedor || model("Fornecedor", FornecedorSchema);

export default Fornecedor;
