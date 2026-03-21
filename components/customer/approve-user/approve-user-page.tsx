"use client"

import { useCreateApprovalRequest } from "@/utils/hooks/tanstack-query/mutate-hook/order/use-create-aproval-request"
import { useGetTableValidationFromPhoneNTable } from "@/utils/hooks/tanstack-query/query-hook/customer/use-get-table-validation-by-phone-n-number"
import { useGetTables } from "@/utils/hooks/tanstack-query/query-hook/table/use-get-tables"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SessionCheckDataType {
  phone_number: string
  table_number: number
}

/**
 * idle         → fresh visit, no localStorage data, show the request form
 * recover      → user clicked "Already requested?" — re-enter details to poll
 * waiting      → polling in progress, approval pending
 * approved     → server approved, redirect underway
 * not_approved → waiter declined, show message + retry option
 * not_found    → phone+table combo not in DB, show error + correction options
 */
type PageState = "idle" | "recover" | "waiting" | "approved" | "not_found"

// ─── localStorage helpers ───────────────────────────────────────────────────────

const LS_KEY = "session-check"

function readStorage(): SessionCheckDataType | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const d: SessionCheckDataType = JSON.parse(raw)
    if (!d.phone_number || !d.table_number) return null
    return d
  } catch {
    return null
  }
}

function writeStorage(d: SessionCheckDataType) {
  localStorage.setItem(LS_KEY, JSON.stringify(d))
}

function clearStorage() {
  localStorage.removeItem(LS_KEY)
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ApproveUserPage() {
  const router = useRouter()

  // ── State — always initialise to SSR-safe defaults ───────────────────────────
  //
  // The server has no localStorage, so every useState must start with the same
  // value the server would produce. We then read localStorage ONCE after mount
  // (in the hydration useEffect below) and jump to the correct state.
  //
  // This guarantees server HTML == first client render == no hydration error.

  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [tableNumber, setTableNumber] = useState<number>(1)
  const [pageState, setPageState] = useState<PageState>("idle")
  const [pollingEnabled, setPollingEnabled] = useState<boolean>(false)

  // ── Hydration effect — runs once after mount, client-only ─────────────────────
  //
  // Safe to read localStorage here because this never runs on the server.
  // If there is stored data we jump straight into polling (returning visitor).

  useEffect(() => {
    const stored = readStorage()
    if (!stored) return                      // fresh visit — stay idle
    setPhoneNumber(stored.phone_number)
    setTableNumber(stored.table_number)
    setPageState("waiting")
    setPollingEnabled(true)                  // kick off polling immediately
  }, [])

  const [formError, setFormError] = useState("")
  const [dots, setDots] = useState(1)
  const dotsRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Data hooks ────────────────────────────────────────────────────────────────

  const { data: tablesData, isLoading: tablesLoading } = useGetTables()
  const emptyTables = tablesData?.tables?.filter((t) => t.status === "empty") ?? []

  const { mutate: createApprovalRequest, isPending: isSubmitting } = useCreateApprovalRequest()

  // POLLING HOOK
  //
  // The hook must internally honour:
  //   enabled:         pollingEnabled
  //   refetchInterval: pollingEnabled ? 5000 : false
  //
  // Because of the lazy initialisers, on Scenario A this already has the right
  // queryKey and enabled:true on the very first render — no stale fetch.
  //
  // What the server action returns / throws:
  //   • status "approved"     → { success:true,  status:"approved",     message }  (cookie already set)
  //   • status "not_approved" → { success:false,  status:"not_approved", message }
  //   • status "not_found"    → throws Error  (server action throws for not_found)
  //   • network error         → throws Error
  //
  // TanStack Query exposes thrown errors via `error`; returned data via `data`.

  const {
    data: validationData,
    error: validationError,
  } = useGetTableValidationFromPhoneNTable(phoneNumber, tableNumber, pollingEnabled)

  // ── Handle successful poll response ──────────────────────────────────────────

  useEffect(() => {
    if (!pollingEnabled || !validationData) return

    const status = validationData.status as "approved" | "not_approved" | "pending"

    if (status === "approved") {
      // Cookie already set server-side. Stop polling, clear LS, redirect.
      setPollingEnabled(false)
      clearStorage()
      setPageState("approved")
      setTimeout(() => router.push("/menu-items"), 1200)
      return
    }

    if (status === "not_approved") {
      // Not approved yet — keep polling and stay on waiting UI.
      // Do NOT stop polling, do NOT clear localStorage.
      return
    }

    // status === "pending" → keep polling; do nothing
  }, [validationData, pollingEnabled, router])

  // ── Handle poll errors (not_found + network errors) ──────────────────────────
  //
  // Your server action throws for TWO reasons:
  //   1. No record found  → throws new Error(data?.error || "failed to get reqeusts")
  //   2. Network failure  → axios throws, caught and re-thrown via getErrorMessage
  //
  // We tell them apart by checking for true network-level keywords.
  // Everything else the server action throws is a business-logic rejection
  // (not_found / invalid payload) → show "no such request", NOT "connection lost".

  useEffect(() => {
    if (!pollingEnabled || !validationError) return

    setPollingEnabled(false)

    const msg = validationError instanceof Error
      ? validationError.message.toLowerCase()
      : ""

    const isNetworkError =
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("econnrefused") ||
      msg.includes("timeout") ||
      msg.includes("connection")

    if (isNetworkError) {
      // True connectivity failure — let user retry from idle
      setFormError("Connection lost. Please refresh and try again.")
      setPageState("idle")
    } else {
      // Server responded but found no matching record.
      // Do NOT clear localStorage — user may have mistyped and needs to correct.
      setPageState("not_found")
    }
  }, [validationError, pollingEnabled])

  // ── Dot animation (waiting screen) ───────────────────────────────────────────

  useEffect(() => {
    if (pageState === "waiting") {
      dotsRef.current = setInterval(() => setDots((d) => (d % 3) + 1), 550)
    } else {
      if (dotsRef.current) clearInterval(dotsRef.current)
    }
    return () => {
      if (dotsRef.current) clearInterval(dotsRef.current)
    }
  }, [pageState])

  // ── Shared helper: persist to LS and start polling ───────────────────────────

  const startPolling = (phone: string, table: number) => {
    writeStorage({ phone_number: phone, table_number: table })
    setPhoneNumber(phone)
    setTableNumber(table)
    setPollingEnabled(true)
    setPageState("waiting")
    setFormError("")
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────

  /**
   * CASE 1 — fresh approval request.
   * Validate → call createApprovalRequest API → on success persist LS + poll.
   */
  const handleSubmit = () => {
    if (!phoneNumber.trim()) return setFormError("Phone number is required.")
    if (!tableNumber) return setFormError("Please select a table.")
    setFormError("")

    createApprovalRequest(
      { phone_number: phoneNumber.trim(), table_number: tableNumber },
      {
        onSuccess: () => startPolling(phoneNumber.trim(), tableNumber),
        onError: (err: unknown) => {
          setFormError(err instanceof Error ? err.message : "Failed to send request.")
        },
      }
    )
  }

  /**
   * CASE 3 — localStorage was cleared (private browsing, manual clear, new tab).
   * User re-enters their ORIGINAL details. We do NOT create a new request —
   * we just start polling and let the server tell us the current status.
   *
   * If the server returns not_found, we show that screen without clearing LS
   * so the user can correct their details and retry.
   * If the server returns data, we also update LS to keep it in sync.
   */
  const handleRecover = () => {
    if (!phoneNumber.trim()) return setFormError("Phone number is required.")
    if (!tableNumber) return setFormError("Please select a table.")
    setFormError("")
    // startPolling writes the (possibly corrected) details to localStorage
    startPolling(phoneNumber.trim(), tableNumber)
  }

  /** Reset everything — go back to the blank request form. */
  const handleReset = () => {
    setPollingEnabled(false)
    clearStorage()
    setPhoneNumber("")
    setTableNumber(emptyTables[0]?.table_number ?? 1)
    setFormError("")
    setPageState("idle")
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0d0d0d] px-4 py-12">

      {/* Ambient rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[280, 420, 560, 700].map((size) => (
          <div
            key={size}
            style={{ width: size, height: size }}
            className="absolute rounded-full border border-white/[0.04]"
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[360px]">

        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
            🍜
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/25">
            Table service
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
          <div className="p-7">

            {/* ── IDLE — fresh request form ── */}
            {pageState === "idle" && (
              <RequestForm
                title="Request approval"
                subtitle="A waiter will confirm your table before you order."
                phoneNumber={phoneNumber}
                tableNumber={tableNumber}
                formError={formError}
                isSubmitting={isSubmitting}
                emptyTables={emptyTables}
                tablesLoading={tablesLoading}
                setPhoneNumber={setPhoneNumber}
                setTableNumber={setTableNumber}
                onSubmit={handleSubmit}
                submitLabel="Send request"
                footer={
                  <button
                    onClick={() => { setFormError(""); setPageState("recover") }}
                    className="mt-4 w-full text-center text-xs text-white/20 underline-offset-2 hover:text-white/45 hover:underline"
                  >
                    Already requested? Track your status →
                  </button>
                }
              />
            )}

            {/* ── RECOVER — Case 3, re-enter details without creating a new request ── */}
            {pageState === "recover" && (
              <RequestForm
                title="Track your request"
                subtitle="Re-enter the same details you used earlier to check your approval status."
                phoneNumber={phoneNumber}
                tableNumber={tableNumber}
                formError={formError}
                isSubmitting={false}
                emptyTables={emptyTables}
                tablesLoading={tablesLoading}
                setPhoneNumber={setPhoneNumber}
                setTableNumber={setTableNumber}
                onSubmit={handleRecover}
                submitLabel="Check status"
                footer={
                  <button
                    onClick={() => { setFormError(""); setPageState("idle") }}
                    className="mt-4 w-full text-center text-xs text-white/20 underline-offset-2 hover:text-white/45 hover:underline"
                  >
                    ← Submit a new request instead
                  </button>
                }
              />
            )}

            {/* ── WAITING — polling in progress ── */}
            {pageState === "waiting" && (
              <div className="flex flex-col items-center py-2 text-center">
                <PulseRing />
                <h2 className="mt-5 text-[15px] font-medium text-white/90">
                  Waiting for approval{".".repeat(dots)}
                </h2>
                <p className="mt-1.5 text-xs text-white/30">
                  Table {tableNumber} · {phoneNumber}
                </p>
                <p className="mt-4 max-w-[240px] text-xs leading-relaxed text-white/20">
                  You can safely close this tab — your request will still be tracked when you return.
                </p>
                <button
                  onClick={handleReset}
                  className="mt-6 text-xs text-white/15 underline-offset-2 hover:text-white/40 hover:underline"
                >
                  Cancel request
                </button>
              </div>
            )}

            {/* ── APPROVED — redirect in progress ── */}
            {pageState === "approved" && (
              <StatusScreen
                icon="✓"
                iconClass="text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                title="You're approved!"
                message="Taking you to the menu…"
              />
            )}

            {/* ── NOT FOUND — no matching record, let user correct details ── */}
            {pageState === "not_found" && (
              <StatusScreen
                icon="?"
                iconClass="text-amber-400 bg-amber-400/10 border-amber-400/20"
                title="No such record exists"
                message="We couldn't find a request matching these details. Check your phone number and table number, or submit a new request."
                action={
                  <div className="mt-5 flex flex-col gap-2">
                    <button
                      onClick={() => { setFormError(""); setPageState("recover") }}
                      className="rounded-lg border border-white/10 px-5 py-2 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70"
                    >
                      Try different details
                    </button>
                    <button
                      onClick={handleReset}
                      className="text-xs text-white/15 underline-offset-2 hover:text-white/35 hover:underline"
                    >
                      Submit a new request
                    </button>
                  </div>
                }
              />
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface RequestFormProps {
  title: string
  subtitle: string
  phoneNumber: string
  tableNumber: number
  formError: string
  isSubmitting: boolean
  emptyTables: { table_number: number; id: string }[]
  tablesLoading: boolean
  setPhoneNumber: (v: string) => void
  setTableNumber: (v: number) => void
  onSubmit: () => void
  submitLabel: string
  footer?: React.ReactNode
}

function RequestForm({
  title, subtitle, phoneNumber, tableNumber, formError,
  isSubmitting, emptyTables, tablesLoading,
  setPhoneNumber, setTableNumber, onSubmit, submitLabel, footer,
}: RequestFormProps) {
  return (
    <>
      <h1 className="text-[17px] font-semibold text-white/90">{title}</h1>
      <p className="mt-1 text-xs leading-relaxed text-white/30">{subtitle}</p>

      <div className="mt-6 space-y-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-white/25">
            Phone number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 555 000 0000"
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white/80 placeholder-white/15 outline-none transition focus:border-white/20 focus:bg-white/[0.07]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-white/25">
            Table number
          </label>
          {tablesLoading ? (
            <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
          ) : (
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(Number(e.target.value))}
              className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white/80 outline-none transition focus:border-white/20"
            >
              {emptyTables.length === 0 && (
                <option value="">No tables available</option>
              )}
              {emptyTables.map((t) => (
                <option key={t.id} value={t.table_number}>
                  Table {t.table_number}
                </option>
              ))}
            </select>
          )}
        </div>

        {formError && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {formError}
          </p>
        )}

        <button
          onClick={onSubmit}
          disabled={isSubmitting || tablesLoading || emptyTables.length === 0}
          className="mt-1 w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black transition hover:bg-white/90 active:scale-[0.98] disabled:opacity-40"
        >
          {isSubmitting ? "Please wait…" : submitLabel}
        </button>
      </div>

      {footer}
    </>
  )
}

function PulseRing() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/10" />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl">
        🍜
      </span>
    </div>
  )
}

interface StatusScreenProps {
  icon: string
  iconClass: string
  title: string
  message: string
  action?: React.ReactNode
}

function StatusScreen({ icon, iconClass, title, message, action }: StatusScreenProps) {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border text-lg font-semibold ${iconClass}`}
      >
        {icon}
      </div>
      <h2 className="mt-4 text-[15px] font-medium text-white/90">{title}</h2>
      <p className="mt-2 max-w-[260px] text-xs leading-relaxed text-white/30">{message}</p>
      {action}
    </div>
  )
}