export default function TextInput({ label, error, ...props }) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm">
      <span className="font-semibold uppercase">{label}</span>
      <input
        className="border-4 border-black bg-stone-200 px-3 py-2 text-black outline-none focus:border-block-accent"
        {...props}
      />
      {error ? <span className="text-sm font-semibold text-red-200">{error}</span> : null}
    </label>
  )
}
