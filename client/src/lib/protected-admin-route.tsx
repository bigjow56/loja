import { useAdminAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProtectedAdminRoute({
  path,
  component: Component,
  requiredRole = "admin",
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRole?: "admin" | "super_admin";
}) {
  const { user, isLoading, canAccessAdmin, hasRole } = useAdminAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (!canAccessAdmin || !hasRole(requiredRole)) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Acesso Negado</CardTitle>
              <CardDescription>
                Você não possui permissões para acessar esta área. 
                {requiredRole === "super_admin" ? " É necessário ter permissões de super administrador." : " É necessário ter permissões administrativas."}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Role atual: <span className="font-medium">{user.role}</span>
              </p>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/")}
                data-testid="button-home"
              >
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>
        </div>
      </Route>
    );
  }

  return <Route path={path}><Component /></Route>;
}