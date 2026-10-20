import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from '@/components/ui/image';

export default function CaseImage({ uri, className = "" }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let active = true;
    if (!uri) { setUrl(null); return; }
    (async () => {
      try {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
        if (active) setUrl(signed_url);
      } catch {
        if (active) setUrl(null);
      }
    })();
    return () => { active = false; };
  }, [uri]);
  if (!uri) return null;
  if (!url) return <div className={`bg-muted animate-pulse rounded ${className}`} />;
  return <Image src={url} alt="case visual" className={`rounded object-cover ${className}`} />;
}