export default function CardShell({ children }) {
  return (
    <main className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant shadow-level-3 rounded-lg overflow-hidden flex flex-col">
      {children}
    </main>
  )
}
