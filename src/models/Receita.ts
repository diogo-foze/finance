import mongoose, { Schema, model, models } from "mongoose";
import "./Cliente"; // Ensure Cliente model is registered

const ReceitaSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    descricao: {
      type: String,
      required: true,
    },
    valor: {
      type: Number,
      required: true,
    },
    dataRecebimento: {
      type: Date,
      required: true,
    },
    categoria: {
      type: String,
      required: true,
    },
    tipoMovimentacao: {
      type: String,
      enum: ["Fixo", "Variável"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Planejado", "Consolidado"],
      default: "Planejado",
    },
    valorConsolidado: {
      type: Number,
    },
    dataConsolidacao: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Receita = models.Receita || model("Receita", ReceitaSchema);

export default Receita;
