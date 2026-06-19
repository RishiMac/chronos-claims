import { SharePackagePageClient } from "@/components/SharePackagePageClient";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  return <SharePackagePageClient token={token} />;
}
