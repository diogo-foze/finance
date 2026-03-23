import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Receita from "@/models/Receita";
import Despesa from "@/models/Despesa";
import User from "@/models/User";
import mongoose from "mongoose";
import { startOfMonth, subMonths, format, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);

    if (!session || !session.user) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const userId = session.user.id;
    
    // Validate if userId is a standard 24-char hex ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`[Dashboard API] Invalid userId format: ${userId}`);
      return NextResponse.json({ error: "Sessão inválida" }, { status: 400 });
    }

    const mongooseUserId = new mongoose.Types.ObjectId(userId);

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // 1. Summary Totals (All time consolidated)
    const summaryResults = await Promise.all([
      Receita.aggregate([{ $match: { userId: mongooseUserId, status: "Consolidado" } }, { $group: { _id: null, total: { $sum: { $ifNull: ["$valorConsolidado", "$valor"] } } } }]),
      Despesa.aggregate([{ $match: { userId: mongooseUserId, status: "Consolidado" } }, { $group: { _id: null, total: { $sum: { $ifNull: ["$valorConsolidado", "$valor"] } } } }]),
      // Current Month Stats for Progress Bar
      Receita.aggregate([
        { $match: { userId: mongooseUserId, dataRecebimento: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
        { 
          $group: { 
            _id: null, 
            totalPlanejado: { $sum: "$valor" },
            totalConsolidado: { $sum: { 
              $cond: [
                { $eq: ["$status", "Consolidado"] },
                { $ifNull: ["$valorConsolidado", "$valor"] },
                0
              ]
            } },
            quebraCaixa: { 
              $sum: { 
                $cond: [
                  { $eq: ["$status", "Consolidado"] },
                  { $max: [0, { $subtract: ["$valor", { $ifNull: ["$valorConsolidado", "$valor"] }] }] },
                  0
                ]
              }
            }
          } 
        }
      ]),
      Despesa.aggregate([
        { $match: { userId: mongooseUserId, dataVencimento: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
        { 
          $group: { 
            _id: null, 
            totalPlanejado: { $sum: "$valor" },
            totalConsolidado: { $sum: { 
              $cond: [
                { $eq: ["$status", "Consolidado"] },
                { $ifNull: ["$valorConsolidado", "$valor"] },
                0
              ]
            } },
            imprevistos: { 
              $sum: { 
                $cond: [
                  { $eq: ["$status", "Consolidado"] },
                  { $max: [0, { $subtract: [{ $ifNull: ["$valorConsolidado", "$valor"] }, "$valor"] }] },
                  0
                ]
              }
            }
          } 
        }
      ]),
      // Delays (Past date AND not consolidated)
      Receita.aggregate([
        { $match: { userId: mongooseUserId, dataRecebimento: { $lt: now }, status: "Planejado" } },
        { $group: { _id: null, total: { $sum: "$valor" } } }
      ]),
      Despesa.aggregate([
        { $match: { userId: mongooseUserId, dataVencimento: { $lt: now }, status: "Planejado" } },
        { $group: { _id: null, total: { $sum: "$valor" } } }
      ])
    ]);

    const totalReceitas = summaryResults[0][0]?.total || 0;
    const totalDespesas = summaryResults[1][0]?.total || 0;
    
    const receitaStats = summaryResults[2][0] || { totalPlanejado: 0, totalConsolidado: 0, quebraCaixa: 0 };
    const despesaStats = summaryResults[3][0] || { totalPlanejado: 0, totalConsolidado: 0, imprevistos: 0 };
    
    const atrasosReceita = summaryResults[4][0]?.total || 0;
    const atrasosDespesa = summaryResults[5][0]?.total || 0;

    // 2. Chart Data (Last 6 months - ONLY Consolidated)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const [rec, des] = await Promise.all([
        Receita.aggregate([
          { $match: { userId: mongooseUserId, dataRecebimento: { $gte: start, $lte: end }, status: "Consolidado" } }, 
          { $group: { _id: null, total: { $sum: { $ifNull: ["$valorConsolidado", "$valor"] } } } }
        ]),
        Despesa.aggregate([
          { $match: { userId: mongooseUserId, dataVencimento: { $gte: start, $lte: end }, status: "Consolidado" } }, 
          { $group: { _id: null, total: { $sum: { $ifNull: ["$valorConsolidado", "$valor"] } } } }
        ])
      ]);

      chartData.push({
        name: format(monthDate, "MMM", { locale: ptBR }),
        receita: rec[0]?.total || 0,
        despesa: des[0]?.total || 0
      });
    }

    // 3. User Statistics (If admin)
    // First, update the current user's activity
    if (userId) {
      await User.findByIdAndUpdate(userId, { lastActive: new Date() });
      console.log(`[Dashboard API] Updated lastActive for user: ${userId}`);
    }

    let userStats = null;
    if (session.user.role === "admin") {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const [totalCount, onlineCount] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ lastActive: { $gte: fiveMinutesAgo } })
      ]);
      console.log(`[Dashboard API] Stats - Total: ${totalCount}, Online: ${onlineCount}`);
      userStats = { totalUsers: totalCount, onlineUsers: onlineCount };
    }

    // 4. Recent Transactions
    const [lastReceitasRaw, lastDespesas] = await Promise.all([
      Receita.find({ userId: mongooseUserId }).sort({ dataRecebimento: -1 }).limit(5).lean(),
      Despesa.find({ userId: mongooseUserId }).sort({ dataVencimento: -1 }).limit(5).lean()
    ]);

    // Populate links for receitas
    const ReceitaCliente = (await import("@/models/ReceitaCliente")).default;
    const links = await ReceitaCliente.find({
      userId: mongooseUserId,
      receitaId: { $in: lastReceitasRaw.map(r => r._id) }
    }).populate("clienteId", "nome cpf").lean();

    const lastReceitas = lastReceitasRaw.map(r => {
      const link = links.find(l => l.receitaId.toString() === r._id.toString());
      return {
        ...r,
        clienteId: link ? link.clienteId : undefined
      };
    });

    const recentTransactions = [
      ...lastReceitas.map((r: any) => ({ ...r, type: "Receita", data: r.dataRecebimento })),
      ...lastDespesas.map((d: any) => ({ ...d, type: "Despesa", data: d.dataVencimento }))
    ]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        saldo: totalReceitas - totalDespesas,
        receitas: receitaStats.totalPlanejado,
        despesas: despesaStats.totalPlanejado,
        receitasConsolidado: receitaStats.totalConsolidado,
        despesasConsolidado: despesaStats.totalConsolidado,
        quebraCaixa: receitaStats.quebraCaixa,
        imprevistos: despesaStats.imprevistos,
        atrasosReceita,
        atrasosDespesa
      },
      chartData,
      recentTransactions,
      userStats
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
