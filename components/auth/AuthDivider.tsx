type AuthDividerProps = {
  label?: string;
};

export default function AuthDivider({ label = "ou continuer avec" }: AuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-neutral-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-[11px] text-neutral-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}
