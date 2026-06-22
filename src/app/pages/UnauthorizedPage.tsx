import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Meta } from "@/shared/components/meta";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const dashboardPath = role === "admin" ? "/admin" : "/dashboard";

  return (
    <>
      <Meta
        noindex
        title="403 - Akses Ditolak"
        description="Anda tidak memiliki izin untuk mengakses halaman ini."
      />
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full rounded-2xl shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-bold">403</CardTitle>
            <p className="text-muted-foreground mt-1">Akses Ditolak</p>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            {user && (
              <div className="p-3 rounded-xl bg-muted/50 text-sm text-left">
                <p className="text-muted-foreground">
                  Login sebagai:{" "}
                  <span className="font-medium text-foreground">
                    {user.email || user.nama}
                  </span>
                </p>
                {role && (
                  <p className="text-muted-foreground">
                    Role:{" "}
                    <span className="font-medium text-foreground capitalize">
                      {role}
                    </span>
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2">
              {user && (
                <Button
                  onClick={() => navigate(dashboardPath)}
                  className="w-full gap-2 rounded-xl"
                >
                  <Home className="h-4 w-4" /> Ke Dashboard
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="w-full gap-2 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
