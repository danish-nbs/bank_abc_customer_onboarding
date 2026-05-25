export default function BankHeader() {
  return (
    <header className="bg-surface-bright px-stack-lg py-stack-md border-b border-outline-variant flex flex-col items-center">
      <div className="w-12 h-12 bg-primary-container text-on-primary rounded-full flex items-center justify-center mb-stack-sm shadow-level-2">
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          shield_lock
        </span>
      </div>
      <h1 className="font-headline-md text-headline-md text-primary">
        Bank ABC Onboarding Platform
      </h1>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-unit">
        Secure Enterprise Verification
      </p>
    </header>
  )
}
