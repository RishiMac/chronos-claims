export default function ShareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 min-h-dvh overflow-y-auto overscroll-y-contain bg-slate-100/60">
      {children}
    </div>
  );
}
