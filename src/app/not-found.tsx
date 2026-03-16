import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6 text-foreground">Página não encontrada</h2>
      <p className="text-muted-foreground mb-8 max-w-md text-center">
        Desculpe, não conseguimos encontrar a página que você está procurando. Ela pode ter sido movida ou não existe.
      </p>
      <Link href="/">
        <Button>
          Voltar para o Início
        </Button>
      </Link>
    </div>
  );
}
