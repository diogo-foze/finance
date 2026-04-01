import mongoose, { Schema, model, models } from "mongoose";

const DespesaFornecedorSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    despesaId: {
      type: Schema.Types.ObjectId,
      ref: "Despesa",
      required: true,
    },
    fornecedorId: {
      type: Schema.Types.ObjectId,
      ref: "Fornecedor",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for performance
DespesaFornecedorSchema.index({ userId: 1, despesaId: 1 }, { unique: true });

const DespesaFornecedor = models.DespesaFornecedor || model("DespesaFornecedor", DespesaFornecedorSchema);

export default DespesaFornecedor;
