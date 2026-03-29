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
      validate: {
        validator: function(v: string) {
          // Simple regex for format and length
          return /^\d{11}$/.test(v);
        },
        message: (props: any) => `${props.value} não é um CPF válido! O CPF deve conter 11 dígitos numéricos.`
      }
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

const Cliente = mongoose.models.Cliente || mongoose.model("Cliente", ClienteSchema);

export default Cliente;
