import mongoose, { Schema, model, models } from "mongoose";

const DespesaSchema = new Schema(
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
    dataVencimento: {
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

const Despesa = models.Despesa || model("Despesa", DespesaSchema);

export default Despesa;
