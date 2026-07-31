import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Por defecto, Next.js trata los "loading boundaries" (loading.tsx)
    // como reusables durante `static` (5 min) aunque la página sea
    // dinámica — así que volver a una ruta ya visitada podía mostrar
    // datos viejos. En una app de finanzas, preferimos siempre datos
    // frescos aunque se pierda algo de la sensación de instantáneo.
    staleTimes: { dynamic: 0, static: 0 },
  },
};

export default nextConfig;
