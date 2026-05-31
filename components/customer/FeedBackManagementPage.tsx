"use client"
import { useGetAllFeedbacks } from '@/utils/hooks/tanstack-query/query-hook/customer/use-get-all-feedbacks'
import React, { useState } from 'react'
import { TableValidationType } from './new-menu-items'
import { useQueryClient } from '@tanstack/react-query'
import { Star, Send, MessageSquare, User, Phone, Loader2, UtensilsCrossed, ChevronRight, ArrowRight } from 'lucide-react'
import { CreateCustomerFeedback, CustomerFeedback } from '@/utils/types/user.types'
import { createFeedBack } from '@/utils/actions/customer/customer.get'
import { useRouter } from 'next/navigation'

function FeedBackManagementPage({ table }: { table?: TableValidationType }) {
  const [phone, setPhone] = useState(table?.phone_number || "")
  const [name, setName] = useState("")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [text, setText] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useGetAllFeedbacks()

  const feedbacks: CustomerFeedback[] = data?.feedbacks || []

  const handleSubmit = async () => {
    if (rating === 0) {
      setSubmitError("Please select a rating before submitting.")
      return
    }
    if (!text.trim()) {
      setSubmitError("Please write your feedback before submitting.")
      return
    }
    setIsSubmitting(true)
    setSubmitError("")
    const payload: CreateCustomerFeedback = {
      name: name.trim() || "Unknown",
      text: text.trim(),
      rating,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    }
    const result = await createFeedBack(payload)
    if (result.success) {
      setSubmitSuccess(true)
      setName("")
      setText("")
      setRating(0)
      setHoveredRating(0)
      queryClient.invalidateQueries({ queryKey: ["get-all-feedbacks"] })
      setTimeout(() => setSubmitSuccess(false), 3500)
    } else {
      setSubmitError(result.error || "Something went wrong. Please try again.")
    }
    setIsSubmitting(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const averageRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : null

  const ratingLabel = ["", "Poor", "Fair", "Good", "Great", "Excellent"]

  return (
    <div className="fb-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        /* ─── Reset ─── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ─── Light theme (default) ─── */
        :root {
          --fb-bg:           #f8f5f0;
          --fb-surface:      #ffffff;
          --fb-surface-alt:  #f2ede5;
          --fb-border:       #e0d8cc;
          --fb-border-focus: #c4a96a;
          --fb-gold:         #c4853a;
          --fb-gold-dark:    #a86c28;
          --fb-gold-light:   #f0d9b5;
          --fb-text-primary: #1a1208;
          --fb-text-secondary: #6b5c3e;
          --fb-text-muted:   #9c8a6a;
          --fb-text-on-gold: #ffffff;
          --fb-success:      #2d7a4f;
          --fb-success-bg:   #eaf5ee;
          --fb-error:        #b83232;
          --fb-error-bg:     #fdf0f0;
          --fb-star-filled:  #c4853a;
          --fb-star-empty:   #d8cfc2;
          --fb-review-hover: #faf6f0;
          --fb-banner-bg:    #ffffff;
          --fb-shadow:       0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06);
          --fb-shadow-sm:    0 1px 3px rgba(0,0,0,0.06);
        }

        /* ─── Dark theme ─── */
        @media (prefers-color-scheme: dark) {
          :root {
            --fb-bg:           #0f0d09;
            --fb-surface:      #1a1710;
            --fb-surface-alt:  #141108;
            --fb-border:       #2e2818;
            --fb-border-focus: #c4853a;
            --fb-gold:         #d4985a;
            --fb-gold-dark:    #e8b070;
            --fb-gold-light:   #3a2810;
            --fb-text-primary: #f0ead8;
            --fb-text-secondary: #b09a72;
            --fb-text-muted:   #7a6848;
            --fb-text-on-gold: #0f0d09;
            --fb-success:      #5ab87a;
            --fb-success-bg:   #0a2018;
            --fb-error:        #e87070;
            --fb-error-bg:     #200808;
            --fb-star-filled:  #d4985a;
            --fb-star-empty:   #2e2818;
            --fb-review-hover: #1e1a10;
            --fb-banner-bg:    #1a1710;
            --fb-shadow:       0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3);
            --fb-shadow-sm:    0 1px 3px rgba(0,0,0,0.3);
          }
        }

        /* ─── Page base ─── */
        .fb-page {
          min-height: 100vh;
          background: var(--fb-bg);
          color: var(--fb-text-primary);
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 15px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        /* ─── Banner ─── */
        .fb-banner {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--fb-banner-bg);
          border-bottom: 1px solid var(--fb-border);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: var(--fb-shadow-sm);
        }
        .fb-banner-text {
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--fb-text-muted);
        }
        .fb-banner-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--fb-gold);
          color: var(--fb-text-on-gold);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 9px 16px;
          transition: background 0.18s, transform 0.12s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .fb-banner-btn:hover { background: var(--fb-gold-dark); transform: translateY(-1px); }
        .fb-banner-btn:active { transform: translateY(0); }

        /* ─── Inner ─── */
        .fb-inner {
          max-width: 860px;
          margin: 0 auto;
          padding: 48px 20px 80px;
        }

        /* ─── Header ─── */
        .fb-header { margin-bottom: 44px; }

        .fb-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--fb-gold);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .fb-eyebrow::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, var(--fb-border), transparent);
        }

        .fb-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.2rem, 6vw, 3.4rem);
          font-weight: 400;
          line-height: 1.1;
          color: var(--fb-text-primary);
          letter-spacing: -0.01em;
          margin-bottom: 20px;
        }
        .fb-title em {
          color: var(--fb-gold);
          font-style: italic;
        }

        .fb-avg-badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: var(--fb-surface);
          border: 1px solid var(--fb-border);
          border-radius: 10px;
          padding: 12px 18px;
          box-shadow: var(--fb-shadow-sm);
        }
        .fb-avg-num {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2rem;
          font-weight: 500;
          color: var(--fb-gold);
          line-height: 1;
        }
        .fb-avg-stars { display: flex; gap: 3px; margin-bottom: 3px; }
        .fb-avg-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: var(--fb-text-muted);
          line-height: 1.8;
        }

        /* ─── Grid ─── */
        .fb-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 680px) {
          .fb-grid { grid-template-columns: 1fr; gap: 24px; }
        }

        /* ─── Form panel ─── */
        .fb-form-panel {
          background: var(--fb-surface);
          border: 1px solid var(--fb-border);
          border-radius: 14px;
          padding: 28px 24px;
          box-shadow: var(--fb-shadow);
        }

        .fb-panel-title {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--fb-text-muted);
          margin-bottom: 24px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--fb-border);
        }

        /* ─── Fields ─── */
        .fb-field { margin-bottom: 20px; }

        .fb-label {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--fb-text-secondary);
          margin-bottom: 7px;
        }
        .fb-label-opt {
          color: var(--fb-text-muted);
          font-size: 0.58rem;
          margin-left: 4px;
        }

        .fb-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .fb-input-icon {
          position: absolute;
          left: 12px;
          color: var(--fb-text-muted);
          pointer-events: none;
          flex-shrink: 0;
        }
        .fb-input {
          width: 100%;
          background: var(--fb-surface-alt);
          border: 1.5px solid var(--fb-border);
          border-radius: 8px;
          color: var(--fb-text-primary);
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.95rem;
          padding: 10px 12px 10px 36px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
          -webkit-appearance: none;
        }
        .fb-input:focus {
          border-color: var(--fb-border-focus);
          box-shadow: 0 0 0 3px var(--fb-gold-light);
        }
        .fb-input::placeholder { color: var(--fb-text-muted); }

        .fb-textarea {
          width: 100%;
          background: var(--fb-surface-alt);
          border: 1.5px solid var(--fb-border);
          border-radius: 8px;
          color: var(--fb-text-primary);
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 0.95rem;
          padding: 12px 14px;
          outline: none;
          resize: vertical;
          min-height: 110px;
          transition: border-color 0.18s, box-shadow 0.18s;
          line-height: 1.65;
          -webkit-appearance: none;
        }
        .fb-textarea:focus {
          border-color: var(--fb-border-focus);
          box-shadow: 0 0 0 3px var(--fb-gold-light);
        }
        .fb-textarea::placeholder { color: var(--fb-text-muted); }

        /* ─── Stars ─── */
        .fb-star-row { display: flex; gap: 2px; align-items: center; flex-wrap: wrap; }
        .fb-star-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          transition: transform 0.1s ease;
          display: flex;
          align-items: center;
          border-radius: 4px;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .fb-star-btn:hover { transform: scale(1.2); }
        .fb-star-btn:active { transform: scale(0.88); }
        .fb-star-desc {
          font-family: 'DM Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.06em;
          color: var(--fb-gold);
          margin-left: 6px;
          font-weight: 500;
        }

        /* ─── Submit button ─── */
        .fb-submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--fb-gold);
          color: var(--fb-text-on-gold);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 14px 20px;
          margin-top: 22px;
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .fb-submit-btn:hover:not(:disabled) {
          background: var(--fb-gold-dark);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(196, 133, 58, 0.3);
        }
        .fb-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .fb-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ─── Secondary CTA ─── */
        .fb-menu-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          color: var(--fb-gold);
          border: 1.5px solid var(--fb-border);
          border-radius: 8px;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px 20px;
          margin-top: 10px;
          transition: border-color 0.18s, background 0.18s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .fb-menu-btn:hover {
          border-color: var(--fb-gold);
          background: var(--fb-gold-light);
        }

        /* ─── Feedback messages ─── */
        .fb-msg-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 12px;
          padding: 10px 14px;
          background: var(--fb-error-bg);
          border: 1px solid var(--fb-error);
          border-radius: 7px;
          font-size: 0.82rem;
          color: var(--fb-error);
          line-height: 1.5;
        }
        .fb-msg-success {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 12px;
          padding: 10px 14px;
          background: var(--fb-success-bg);
          border: 1px solid var(--fb-success);
          border-radius: 7px;
          font-size: 0.82rem;
          color: var(--fb-success);
          animation: fb-fade-in 0.3s ease;
          line-height: 1.5;
        }

        @keyframes fb-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fb-spin {
          to { transform: rotate(360deg); }
        }
        .fb-spin { animation: fb-spin 0.9s linear infinite; }

        /* ─── Reviews panel ─── */
        .fb-reviews-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          gap: 12px;
        }
        .fb-reviews-count {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: var(--fb-gold);
          background: var(--fb-gold-light);
          border: 1px solid var(--fb-border);
          border-radius: 20px;
          padding: 3px 12px;
        }

        .fb-reviews-scroll {
          max-height: 560px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1px;
          border: 1px solid var(--fb-border);
          border-radius: 12px;
          overflow: hidden;
          background: var(--fb-border);
          box-shadow: var(--fb-shadow-sm);
        }
        /* Mobile: don't constrain height */
        @media (max-width: 680px) {
          .fb-reviews-scroll { max-height: none; }
        }
        .fb-reviews-scroll::-webkit-scrollbar { width: 4px; }
        .fb-reviews-scroll::-webkit-scrollbar-track { background: transparent; }
        .fb-reviews-scroll::-webkit-scrollbar-thumb { background: var(--fb-border); border-radius: 4px; }

        /* ─── Review card ─── */
        .fb-review-card {
          background: var(--fb-surface);
          padding: 18px 20px;
          transition: background 0.15s;
        }
        .fb-review-card:hover { background: var(--fb-review-hover); }

        .fb-review-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
        }
        .fb-reviewer-info { flex: 1; min-width: 0; }
        .fb-reviewer-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--fb-gold-light);
          border: 1.5px solid var(--fb-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: 'Playfair Display', serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--fb-gold);
          margin-bottom: 2px;
        }
        .fb-reviewer-name {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--fb-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fb-reviewer-phone {
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          color: var(--fb-text-muted);
          margin-top: 1px;
        }

        .fb-review-meta { text-align: right; flex-shrink: 0; }
        .fb-review-stars { display: flex; gap: 2px; justify-content: flex-end; margin-bottom: 4px; }
        .fb-review-date {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          color: var(--fb-text-muted);
          letter-spacing: 0.04em;
        }

        .fb-review-text {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          color: var(--fb-text-secondary);
          font-size: 0.93rem;
          line-height: 1.7;
        }
        .fb-review-text::before { content: open-quote; color: var(--fb-gold); }
        .fb-review-text::after  { content: close-quote; color: var(--fb-gold); }

        /* ─── Empty / loading ─── */
        .fb-empty {
          padding: 48px 20px;
          text-align: center;
          background: var(--fb-surface);
          border: 1px solid var(--fb-border);
          border-radius: 12px;
        }
        .fb-empty-icon {
          color: var(--fb-border);
          margin-bottom: 14px;
        }
        .fb-empty-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--fb-text-muted);
          line-height: 1.8;
        }

        .fb-loading {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 28px 0;
          color: var(--fb-text-muted);
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
        }

        /* ─── Mobile touch targets ─── */
        @media (max-width: 480px) {
          .fb-inner { padding: 32px 16px 64px; }
          .fb-form-panel { padding: 22px 18px; }
          .fb-title { font-size: 2rem; }
          .fb-submit-btn, .fb-menu-btn { padding: 16px 20px; font-size: 0.78rem; }
          .fb-star-btn { padding: 6px; }
          .fb-banner { padding: 10px 16px; }
          .fb-banner-btn { padding: 10px 14px; font-size: 0.68rem; }
          .fb-input, .fb-textarea { font-size: 16px; } /* Prevents iOS zoom */
        }
      `}</style>

      {/* ── Sticky Banner ── */}
      <div className="fb-banner">
        <span className="fb-banner-text">Hungry? Order now</span>
        <button className="fb-banner-btn" onClick={() => router.push('/menu-items')}>
          <UtensilsCrossed size={13} />
          View Menu
          <ChevronRight size={13} />
        </button>
      </div>

      <div className="fb-inner">

        {/* ── Header ── */}
        <div className="fb-header">
          <p className="fb-eyebrow">Guest Experience</p>
          <h1 className="fb-title">
            Your Voice<br /><em>Matters</em>
          </h1>
          {averageRating && (
            <div className="fb-avg-badge">
              <span className="fb-avg-num">{averageRating}</span>
              <div>
                <div className="fb-avg-stars">
                  {[1,2,3,4,5].map(s => (
                    <Star
                      key={s}
                      size={13}
                      fill={s <= Math.round(Number(averageRating)) ? "var(--fb-star-filled)" : "none"}
                      stroke="var(--fb-star-filled)"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <p className="fb-avg-label">
                  Average rating · {feedbacks.length} review{feedbacks.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Two Column Grid ── */}
        <div className="fb-grid">

          {/* ── Left: Form ── */}
          <div className="fb-form-panel">
            <p className="fb-panel-title">Leave a Review</p>

            <div className="fb-field">
              <label className="fb-label">
                Name <span className="fb-label-opt">(optional)</span>
              </label>
              <div className="fb-input-wrap">
                <User size={14} className="fb-input-icon" />
                <input
                  className="fb-input"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">
                Phone <span className="fb-label-opt">(optional)</span>
              </label>
              <div className="fb-input-wrap">
                <Phone size={14} className="fb-input-icon" />
                <input
                  className="fb-input"
                  type="tel"
                  placeholder="+977-98XXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">Rating</label>
              <div className="fb-star-row">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    className="fb-star-btn"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                    type="button"
                  >
                    <Star
                      size={30}
                      fill={(hoveredRating || rating) >= star ? "var(--fb-star-filled)" : "var(--fb-star-empty)"}
                      stroke={(hoveredRating || rating) >= star ? "var(--fb-star-filled)" : "var(--fb-star-empty)"}
                      strokeWidth={1}
                    />
                  </button>
                ))}
                {(hoveredRating || rating) > 0 && (
                  <span className="fb-star-desc">
                    {ratingLabel[hoveredRating || rating]}
                  </span>
                )}
              </div>
            </div>

            <div className="fb-field" style={{ marginBottom: 0 }}>
              <label className="fb-label">Your experience</label>
              <textarea
                className="fb-textarea"
                rows={4}
                placeholder="Tell us about your visit…"
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </div>

            {submitError && (
              <div className="fb-msg-error" role="alert">
                <span>⚠</span>
                <span>{submitError}</span>
              </div>
            )}
            {submitSuccess && (
              <div className="fb-msg-success" role="status">
                <span>✓</span>
                <span>Thank you — your feedback was submitted!</span>
              </div>
            )}

            <button
              className="fb-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting
                ? <><Loader2 size={14} className="fb-spin" /> Submitting…</>
                : <><Send size={14} /> Submit Feedback</>}
            </button>

            <button
              className="fb-menu-btn"
              onClick={() => router.push('/menu-items')}
              type="button"
            >
              <UtensilsCrossed size={13} />
              Order from Menu
              <ArrowRight size={13} />
            </button>
          </div>

          {/* ── Right: Reviews ── */}
          <div>
            <div className="fb-reviews-header">
              <p className="fb-panel-title" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
                All Reviews
              </p>
              {feedbacks.length > 0 && (
                <span className="fb-reviews-count">{feedbacks.length} total</span>
              )}
            </div>

            {isLoading && (
              <div className="fb-loading">
                <Loader2 size={15} className="fb-spin" />
                Loading reviews…
              </div>
            )}

            {isError && (
              <div className="fb-msg-error" role="alert">
                <span>⚠</span>
                <span>Unable to load reviews. Please refresh.</span>
              </div>
            )}

            {!isLoading && !isError && feedbacks.length === 0 && (
              <div className="fb-empty">
                <div className="fb-empty-icon">
                  <MessageSquare size={32} />
                </div>
                <p className="fb-empty-label">
                  No reviews yet.<br />Be the first to share!
                </p>
              </div>
            )}

            {!isLoading && feedbacks.length > 0 && (
              <div className="fb-reviews-scroll">
                {feedbacks.map(fb => {
                  const initials = fb.name
                    .split(" ")
                    .slice(0, 2)
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()

                  return (
                    <div key={fb.id} className="fb-review-card">
                      <div className="fb-review-top">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <div className="fb-reviewer-avatar">{initials || "?"}</div>
                          <div className="fb-reviewer-info">
                            <p className="fb-reviewer-name">{fb.name}</p>
                            {fb.phone && <p className="fb-reviewer-phone">{fb.phone}</p>}
                          </div>
                        </div>
                        <div className="fb-review-meta">
                          <div className="fb-review-stars">
                            {[1,2,3,4,5].map(s => (
                              <Star
                                key={s}
                                size={11}
                                fill={s <= fb.rating ? "var(--fb-star-filled)" : "var(--fb-star-empty)"}
                                stroke={s <= fb.rating ? "var(--fb-star-filled)" : "var(--fb-star-empty)"}
                                strokeWidth={1}
                              />
                            ))}
                          </div>
                          <p className="fb-review-date">{formatDate(fb.created_at)}</p>
                        </div>
                      </div>
                      <p className="fb-review-text">{fb.text}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedBackManagementPage