import mongoose, { Schema, model, models } from "mongoose";
import "./Receita";
import "./Cliente";

const ReceitaClienteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receitaId: {
      type: Schema.Types.ObjectId,
      ref: "Receita",
      required: true,
    },
    clienteId: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for performance
ReceitaClienteSchema.index({ userId: 1, receitaId: 1 }, { unique: true });

const ReceitaCliente = models.ReceitaCliente || model("ReceitaCliente", ReceitaClienteSchema);

export default ReceitaCliente;
