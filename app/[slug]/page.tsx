"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPageBySlug } from "@/services/pageService";
import { HomenagemRenderer } from "@/components/HomenagemRenderer";

export default function Page() {
  const params = useParams();
  const router = useRouter();

  const slug = params?.slug as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    async function fetchData() {
      try {
        console.log("[slug/page] Buscando página com slug:", slug);

        const response = await getPageBySlug(slug);

        if (!response) {
          console.log("[slug/page] Página não encontrada:", slug);
          router.push("/404"); // simula notFound() no client
          return;
        }

        console.log("[slug/page] Página encontrada:", {
          id: response.id,
          title: response.title,
          is_paid: response.is_paid,
          slug: response.slug,
        });

        setData(response);
      } catch (err) {
        console.error("[slug/page] Erro ao buscar página:", err);
        router.push("/404");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug, router]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!data) {
    return null; // já redirecionou
  }

  return <HomenagemRenderer data={data} isPreviewMode={false} />;
}
