import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Meta } from "@/shared/components/meta";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <>
      <Meta
        noindex
        title="404 - Halaman Tidak Ditemukan"
        description="Maaf, halaman yang Anda cari tidak ditemukan di SiHuni. Kembali ke beranda untuk melanjutkan."
      />
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">
            Ups! Halaman tidak ditemukan
          </p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </>
  );
};

export default NotFound;
