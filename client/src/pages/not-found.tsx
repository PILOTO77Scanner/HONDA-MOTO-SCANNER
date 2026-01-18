import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card/50 border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <h1 className="text-2xl font-bold">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-muted-foreground text-sm">
             O recurso solicitado não foi encontrado no sistema.
          </p>

          <div className="mt-8">
            <Link href="/" className="text-primary hover:text-primary/80 underline underline-offset-4">
              Retornar ao Painel
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
