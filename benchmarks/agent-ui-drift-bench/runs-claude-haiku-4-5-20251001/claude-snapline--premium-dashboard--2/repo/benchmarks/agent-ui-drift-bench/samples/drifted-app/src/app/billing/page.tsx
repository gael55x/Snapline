// Intentionally drifted sample: raw colors, arbitrary values, raw primitives.
// This file is test data — excluded from lint and typecheck.
export default function BillingPage() {
  return (
    <div className="mx-auto max-w-2xl px-7">
      <h1 className="text-[22px] font-bold text-gray-900">Billing</h1>
      <p style={{ marginTop: "13px", color: "#6366f1" }}>Manage your subscription.</p>
      <div className="mt-[13px] rounded-[11px] border border-zinc-200 bg-white p-4 shadow-sm">
        <span className="text-gray-500">Current plan</span>
        <span className="bg-blue-500 text-white">Pro</span>
      </div>
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <span className="text-[#111827]">Payment method</span>
      </div>
      <button className="mt-4 rounded bg-blue-500 px-4 py-2 text-white" type="button">
        Upgrade
      </button>
      <input className="mt-2 w-[472px] border border-gray-300 p-2" placeholder="Coupon code" />
    </div>
  )
}
