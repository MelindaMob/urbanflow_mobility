export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-mobility-green">
            UrbanFlow
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Votre mobilité urbaine, unifiée
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
