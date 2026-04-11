export default function Card({ children, className = '' }) {
  return (
    <section className={`border-4 border-black bg-block-panel p-4 shadow-block ${className}`}>
      {children}
    </section>
  )
}
