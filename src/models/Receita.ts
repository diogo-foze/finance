import mongoose, { Schema, model, models } from "mongoose";

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
  },
  { timestamps: true }
);

const Receita = models.Receita || model("Receita", ReceitaSchema);

export default Receita;
