// Sample drift: duplicate dialog component plus a hand-rolled overlay.
export function BaseModal({ children }: { children: unknown }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div role="dialog" style={{ padding: "18px" }} className="rounded-[14px] bg-white">
        {children as never}
      </div>
    </div>
  )
}
