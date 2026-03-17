import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Config from "@/models/Config";

export async function GET() {
  try {
    await connectToDatabase();
    const configs = await Config.find({ isPublic: true }).select("key value -_id");
    
    // Transform to simple key-value object
    const configMap = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(configMap);
  } catch (error) {
    console.error("Erro ao buscar configurações públicas:", error);
    return NextResponse.json({}, { status: 200 }); // Graceful failure
  }
}
