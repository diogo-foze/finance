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

    // 1. Summary Totals (Same logic as before but optimized)
    const now = new Date();
    const currentMonthStart = startOfMonth(now);

    const summaryResults = await Promise.all([
      Receita.aggregate([{ $match: { userId: mongooseUserId } }, { $group: { _id: null, total: { $sum: "$valor" } } }]),
      Despesa.aggregate([{ $match: { userId: mongooseUserId } }, { $group: { _id: null, total: { $sum: "$valor" } } }]),
      Receita.aggregate([{ $match: { userId: mongooseUserId, dataRecebimento: { $gte: currentMonthStart } } }, { $group: { _id: null, total: { $sum: "$valor" } } }]),
      Despesa.aggregate([{ $match: { userId: mongooseUserId, dataVencimento: { $gte: currentMonthStart } } }, { $group: { _id: null, total: { $sum: "$valor" } } }])
    ]);

    const totalReceitas = summaryResults[0][0]?.total || 0;
    const totalDespesas = summaryResults[1][0]?.total || 0;

    // 2. Chart Data (Last 6 months)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const [rec, des] = await Promise.all([
        Receita.aggregate([{ $match: { userId: mongooseUserId, dataRecebimento: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: "$valor" } } }]),
        Despesa.aggregate([{ $match: { userId: mongooseUserId, dataVencimento: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: "$valor" } } }])
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
    const [lastReceitas, lastDespesas] = await Promise.all([
      Receita.find({ userId: mongooseUserId }).sort({ dataRecebimento: -1 }).limit(5).lean(),
      Despesa.find({ userId: mongooseUserId }).sort({ dataVencimento: -1 }).limit(5).lean()
    ]);

    const recentTransactions = [
      ...lastReceitas.map((r: any) => ({ ...r, type: "Receita", data: r.dataRecebimento })),
      ...lastDespesas.map((d: any) => ({ ...d, type: "Despesa", data: d.dataVencimento }))
    ]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        saldo: totalReceitas - totalDespesas,
        receitas: summaryResults[2][0]?.total || 0,
        despesas: summaryResults[3][0]?.total || 0
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
