"use client"

import { useCreateApprovalRequest } from "@/utils/hooks/tanstack-query/mutate-hook/order/use-create-aproval-request"
import { useGetTableValidationFromPhoneNTable } from "@/utils/hooks/tanstack-query/query-hook/customer/use-get-table-validation-by-phone-n-number"
import { useGetTables } from "@/utils/hooks/tanstack-query/query-hook/table/use-get-tables"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { MessageSquare } from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SessionCheckDataType {
  phone_number: string
  table_number: number
}

type PageState = "idle" | "recover" | "waiting" | "approved" | "not_found"

const DEFAULT_PHONE = "9800000000"

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

  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [tableNumber, setTableNumber] = useState<number>(0)
  const [pageState, setPageState] = useState<PageState>("idle")
  const [pollingEnabled, setPollingEnabled] = useState<boolean>(false)
  const [formError, setFormError] = useState("")
  const [dots, setDots] = useState(1)
  const dotsRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: tablesData, isLoading: tablesLoading } = useGetTables()
  const emptyTables = tablesData?.tables?.filter((t) => t.status === "empty") ?? []

  const { mutate: createApprovalRequest, isPending: isSubmitting } = useCreateApprovalRequest()

  const { data: validationData, error: validationError } =
    useGetTableValidationFromPhoneNTable(phoneNumber, tableNumber, pollingEnabled)

  useEffect(() => {
    if (emptyTables.length > 0 && tableNumber === 0 && (pageState === "idle" || pageState === "recover")) {
      setTableNumber(emptyTables[0].table_number)
    }
  }, [emptyTables, tableNumber, pageState])

  useEffect(() => {
    const stored = readStorage()
    if (!stored) return
    setPhoneNumber(stored.phone_number)
    setTableNumber(stored.table_number)
    setPageState("waiting")
    setPollingEnabled(true)
  }, [])

  useEffect(() => {
    if (!pollingEnabled || !validationData) return
    const status = validationData.status as "approved" | "not_approved" | "pending"
    if (status === "approved") {
      setPollingEnabled(false)
      clearStorage()
      setPageState("approved")
      setTimeout(() => router.push("/menu-items"), 1200)
    }
  }, [validationData, pollingEnabled, router])

  useEffect(() => {
    if (!pollingEnabled || !validationError) return
    setPollingEnabled(false)
    const msg = validationError instanceof Error ? validationError.message.toLowerCase() : ""
    const isNetworkError =
      msg.includes("network") || msg.includes("fetch") ||
      msg.includes("econnrefused") || msg.includes("timeout") || msg.includes("connection")
    if (isNetworkError) {
      setFormError("Connection lost. Please refresh and try again.")
      setPageState("idle")
    } else {
      setPageState("not_found")
    }
  }, [validationError, pollingEnabled])

  useEffect(() => {
    if (pageState === "waiting") {
      dotsRef.current = setInterval(() => setDots((d) => (d % 3) + 1), 550)
    } else {
      if (dotsRef.current) clearInterval(dotsRef.current)
    }
    return () => { if (dotsRef.current) clearInterval(dotsRef.current) }
  }, [pageState])

  const startPolling = (phone: string, table: number) => {
    writeStorage({ phone_number: phone, table_number: table })
    setPhoneNumber(phone)
    setTableNumber(table)
    setPollingEnabled(true)
    setPageState("waiting")
    setFormError("")
  }

  const handleSubmit = (resolvedPhone: string) => {
    if (!tableNumber) return setFormError("Please select a table.")
    setFormError("")
    const phone = resolvedPhone.trim() || DEFAULT_PHONE
    createApprovalRequest(
      { phone_number: phone, table_number: tableNumber },
      {
        onSuccess: () => startPolling(phone, tableNumber),
        onError: (err: unknown) => {
          setFormError(err instanceof Error ? err.message : "Failed to send request.")
        },
      }
    )
  }

  const handleRecover = (resolvedPhone: string) => {
    if (!tableNumber) return setFormError("Please select a table.")
    setFormError("")
    const phone = resolvedPhone.trim() || DEFAULT_PHONE
    startPolling(phone, tableNumber)
  }

  const handleReset = () => {
    setPollingEnabled(false)
    clearStorage()
    setPhoneNumber("")
    setTableNumber(0)
    setFormError("")
    setPageState("idle")
  }

  // ── Feedback button — shown in the middle section below the card ──────────
  const FeedbackButton = () => (
    <button
      onClick={() => router.push("/feedbacks")}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-muted/30 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:border-border/80 transition-all duration-150"
    >
      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
      Share feedback
    </button>
  )

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">

      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--accent)/10%,transparent_65%)] blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--accent)/6%,transparent_70%)] blur-2xl" />
        <div className="absolute top-1/2 -right-20 h-48 w-48 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--accent)/5%,transparent_70%)] blur-2xl" />
      </div>

      {/* Decorative rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[360, 520, 680, 840].map((size) => (
          <div key={size} style={{ width: size, height: size }} className="absolute rounded-full border border-border/20" />
        ))}
      </div>

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      <div className="relative z-10 w-full max-w-[400px]">

        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 rounded-2xl border border-border/30 scale-110 opacity-60" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card shadow-md text-xl ring-1 ring-border/60">
              🍜
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">Table Service</p>
            <div className="h-px w-10 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
          </div>
        </div>

        {/* Main card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,var(--accent)/8%,transparent_70%)]" />

          <div className="relative p-7">

            {/* IDLE */}
            {pageState === "idle" && (
              <RequestForm
                title="Request approval"
                subtitle="A waiter will confirm your table before you order."
                tableNumber={tableNumber}
                formError={formError}
                isSubmitting={isSubmitting}
                emptyTables={emptyTables}
                tablesLoading={tablesLoading}
                setTableNumber={setTableNumber}
                onSubmit={handleSubmit}
                submitLabel="Send Request"
                footer={
                  <button
                    onClick={() => { setFormError(""); setPageState("recover") }}
                    className="mt-5 w-full text-center text-[11px] font-medium text-muted-foreground/50 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline"
                  >
                    Already requested? Track your status →
                  </button>
                }
              />
            )}

            {/* RECOVER */}
            {pageState === "recover" && (
              <RecoverForm
                title="Track Your Request"
                subtitle="Re-enter the same details you used earlier to check your approval status."
                phoneNumber={phoneNumber}
                tableNumber={tableNumber}
                formError={formError}
                setPhoneNumber={setPhoneNumber}
                setTableNumber={setTableNumber}
                onSubmit={handleRecover}
                submitLabel="Check Status"
                footer={
                  <button
                    onClick={() => { setFormError(""); setPageState("idle") }}
                    className="mt-5 w-full text-center text-[11px] font-medium text-muted-foreground/50 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline"
                  >
                    ← Submit a new request instead
                  </button>
                }
              />
            )}

            {/* WAITING */}
            {pageState === "waiting" && (
              <div className="flex flex-col items-center py-3 text-center">
                <PulseRing />
                <h2 className="mt-5 text-[15px] font-semibold tracking-tight text-foreground">
                  Waiting for approval{".".repeat(dots)}
                </h2>
                <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                  Table {tableNumber} · {phoneNumber === DEFAULT_PHONE ? "Guest" : phoneNumber}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground/60 max-w-[240px]">
                  <span className="shrink-0 text-accent opacity-70">ℹ</span>
                  You can safely close this tab — your request will still be tracked when you return.
                </div>
                <button
                  onClick={handleReset}
                  className="mt-6 text-[11px] font-medium text-muted-foreground/40 underline-offset-2 transition-colors hover:text-destructive hover:underline"
                >
                  Cancel request
                </button>
              </div>
            )}

            {/* APPROVED */}
            {pageState === "approved" && (
              <StatusScreen
                icon="✓"
                iconClass="text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                outerRingClass="border-emerald-500/10"
                title="You're Approved!"
                message="Taking you to the menu in a moment…"
              />
            )}

            {/* NOT FOUND */}
            {pageState === "not_found" && (
              <StatusScreen
                icon="?"
                iconClass="text-amber-500 bg-amber-500/10 border-amber-500/20"
                outerRingClass="border-amber-500/10"
                title="No Record Found"
                message="We couldn't find a request matching these details. Check your phone number and table number, or submit a new request."
                action={
                  <div className="mt-5 flex w-full flex-col gap-2">
                    <button
                      onClick={() => { setFormError(""); setPageState("recover") }}
                      className="w-full rounded-xl border border-border bg-muted/30 px-5 py-2.5 text-[11px] font-medium text-foreground/70 transition-colors hover:bg-muted/60 hover:text-foreground"
                    >
                      Try different details
                    </button>
                    <button
                      onClick={handleReset}
                      className="text-[11px] font-medium text-muted-foreground/40 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline"
                    >
                      Submit a new request
                    </button>
                  </div>
                }
              />
            )}
          </div>

          {/* Card footer strip */}
          <div className="mx-7 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="flex items-center justify-between px-7 py-3.5">
            <span className="text-[10px] tracking-[0.08em] text-muted-foreground/30 uppercase">Secure Session</span>
            <span className="text-[10px] tracking-[0.06em] text-accent/40 uppercase">Table Service</span>
          </div>
        </div>

        {/* ── Middle section: feedback button, centered below card ── */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <FeedbackButton />
          <p className="text-center text-[10px] tracking-wide text-muted-foreground/30">
            Secure · Powered by Table Service
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.10em] text-muted-foreground/60">
      {children}
    </label>
  )
}

const inputCls =
  "h-9 w-full rounded-xl border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-ring/50 focus:bg-background focus:ring-1 focus:ring-ring/30"

// ─── RequestForm ───────────────────────────────────────────────────────────────

interface RequestFormProps {
  title: string
  subtitle: string
  tableNumber: number
  formError: string
  isSubmitting: boolean
  emptyTables: { table_number: number; id: string }[]
  tablesLoading: boolean
  setTableNumber: (v: number) => void
  onSubmit: (phone: string) => void
  submitLabel: string
  footer?: React.ReactNode
}

function RequestForm({
  title, subtitle, tableNumber, formError,
  isSubmitting, emptyTables, tablesLoading,
  setTableNumber, onSubmit, submitLabel, footer,
}: RequestFormProps) {
  const [phoneEnabled, setPhoneEnabled] = useState(false)
  const [localPhone, setLocalPhone] = useState("")

  return (
    <>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-block h-4 w-1 rounded-full bg-accent opacity-80" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">New Request</span>
        </div>
        <h1 className="text-[17px] font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70">{subtitle}</p>
      </div>

      <div className="space-y-3">
        <div>
          <FieldLabel>Table Number</FieldLabel>
          {tablesLoading ? (
            <div className="h-9 animate-pulse rounded-xl bg-muted" />
          ) : (
            <div className="relative">
              <select value={tableNumber || ""} onChange={(e) => setTableNumber(Number(e.target.value))} className={inputCls}>
                {emptyTables.length === 0 && <option value="">No tables available</option>}
                {emptyTables.map((t) => (
                  <option key={t.id} value={t.table_number}>Table {t.table_number}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {!phoneEnabled ? (
          <button
            type="button"
            onClick={() => setPhoneEnabled(true)}
            className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2.5 text-left transition-all hover:border-accent/40 hover:bg-muted/40"
          >
            <span className="text-base">🎁</span>
            <span className="text-xs leading-snug text-muted-foreground/60">
              Add phone number to unlock{" "}
              <span className="font-semibold text-accent/80">rewards &amp; discounts</span>
            </span>
            <span className="ml-auto shrink-0 rounded-lg border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground/50">+ Add</span>
          </button>
        ) : (
          <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-[0.10em] text-accent/70">Phone Number</label>
              <button type="button" onClick={() => { setPhoneEnabled(false); setLocalPhone("") }} className="text-[10px] text-muted-foreground/40 transition-colors hover:text-muted-foreground">
                ✕ Remove
              </button>
            </div>
            <input type="tel" autoFocus value={localPhone} onChange={(e) => setLocalPhone(e.target.value)} placeholder="+1 555 000 0000" className={inputCls} />
            <p className="mt-1.5 text-[10px] text-muted-foreground/40">Used to track rewards. Optional — you can skip this.</p>
          </div>
        )}

        {formError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/[0.08] px-3 py-2">
            <span className="shrink-0 text-[10px] text-destructive">⚠</span>
            <p className="text-[11px] font-medium text-destructive">{formError}</p>
          </div>
        )}

        <button
          onClick={() => onSubmit(phoneEnabled ? localPhone : "")}
          disabled={isSubmitting || tablesLoading || emptyTables.length === 0}
          className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Please wait…
            </>
          ) : submitLabel}
        </button>
      </div>

      {footer}
    </>
  )
}

// ─── RecoverForm ───────────────────────────────────────────────────────────────

interface RecoverFormProps {
  title: string
  subtitle: string
  phoneNumber: string
  tableNumber: number
  formError: string
  setPhoneNumber: (v: string) => void
  setTableNumber: (v: number) => void
  onSubmit: (phone: string) => void
  submitLabel: string
  footer?: React.ReactNode
}

function RecoverForm({
  title, subtitle, phoneNumber, tableNumber, formError,
  setPhoneNumber, setTableNumber, onSubmit, submitLabel, footer,
}: RecoverFormProps) {
  return (
    <>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-block h-4 w-1 rounded-full bg-accent opacity-80" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">Track Request</span>
        </div>
        <h1 className="text-[17px] font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70">{subtitle}</p>
      </div>

      <div className="space-y-3">
        <div>
          <FieldLabel>Phone Number</FieldLabel>
          <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Leave blank if you didn't add one" className={inputCls} />
          <p className="mt-1 text-[10px] text-muted-foreground/40">Leave blank if you didn't add a phone number.</p>
        </div>
        <div>
          <FieldLabel>Table Number</FieldLabel>
          <input type="number" min={1} value={tableNumber || ""} onChange={(e) => setTableNumber(Number(e.target.value))} placeholder="e.g. 4" className={inputCls} />
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/[0.08] px-3 py-2">
            <span className="shrink-0 text-[10px] text-destructive">⚠</span>
            <p className="text-[11px] font-medium text-destructive">{formError}</p>
          </div>
        )}

        <button
          onClick={() => onSubmit(phoneNumber)}
          className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>

      {footer}
    </>
  )
}

// ─── PulseRing ─────────────────────────────────────────────────────────────────

function PulseRing() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/10" />
      <span className="absolute h-14 w-14 rounded-full border border-accent/20 bg-accent/5" />
      <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card shadow-sm ring-1 ring-border/50 text-lg">
        🍜
      </span>
    </div>
  )
}

// ─── StatusScreen ──────────────────────────────────────────────────────────────

interface StatusScreenProps {
  icon: string
  iconClass: string
  outerRingClass: string
  title: string
  message: string
  action?: React.ReactNode
}

function StatusScreen({ icon, iconClass, outerRingClass, title, message, action }: StatusScreenProps) {
  return (
    <div className="flex flex-col items-center py-3 text-center">
      <div className="relative flex items-center justify-center">
        <div className={`absolute h-20 w-20 rounded-full border scale-110 ${outerRingClass}`} />
        <div className={`relative flex h-14 w-14 items-center justify-center rounded-3xl border text-lg font-semibold shadow-sm ${iconClass}`}>
          {icon}
        </div>
      </div>
      <h2 className="mt-5 text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-[260px] text-[11px] leading-relaxed text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}