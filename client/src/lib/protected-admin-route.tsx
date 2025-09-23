import { useAdminAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Permission, Role } from "@shared/schema";

export function ProtectedAdminRoute({
  path,
  component: Component,
  requiredRole,
  requiredPermission,
  requiredAnyPermissions,
  requiredAllPermissions,
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRole?: Role;
  requiredPermission?: Permission;
  requiredAnyPermissions?: Permission[];
  requiredAllPermissions?: Permission[];
}) {
  const { user, isLoading, canAccessAdmin, hasRole, hasPermission, hasAnyPermission, hasAllPermissions } = useAdminAuth();
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

  // Check if user has required access
  let hasRequiredAccess = canAccessAdmin;
  let accessDeniedMessage = "Você não possui permissões para acessar esta área.";

  if (hasRequiredAccess && requiredRole) {
    hasRequiredAccess = hasRole(requiredRole);
    accessDeniedMessage = `É necessário ter o papel de ${requiredRole}.`;
  }

  if (hasRequiredAccess && requiredPermission) {
    hasRequiredAccess = hasPermission(requiredPermission);
    accessDeniedMessage = `É necessária a permissão: ${requiredPermission}.`;
  }

  if (hasRequiredAccess && requiredAnyPermissions) {
    hasRequiredAccess = hasAnyPermission(requiredAnyPermissions);
    accessDeniedMessage = `É necessária uma das permissões: ${requiredAnyPermissions.join(', ')}.`;
  }

  if (hasRequiredAccess && requiredAllPermissions) {
    hasRequiredAccess = hasAllPermissions(requiredAllPermissions);
    accessDeniedMessage = `São necessárias todas as permissões: ${requiredAllPermissions.join(', ')}.`;
  }

  if (!hasRequiredAccess) {
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
                {accessDeniedMessage}
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