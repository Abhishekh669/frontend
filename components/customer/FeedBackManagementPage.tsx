"use client"
import { useGetAllFeedbacks } from '@/utils/hooks/tanstack-query/query-hook/customer/use-get-all-feedbacks'
import React, { useState } from 'react'
import { TableValidationType } from './new-menu-items'
import { useQueryClient } from '@tanstack/react-query'
import { Star, Send, MessageSquare, User, Phone, Loader2, UtensilsCrossed, ArrowRight, ChevronRight } from 'lucide-react'
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
    <div style={{ minHeight: "100vh", background: "#0a0908", color: "#ede8df", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Syne+Mono&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Noise overlay ── */
        #fb-root::before {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0;
        }

        /* ── Accent line top ── */
        #fb-root::after {
          content: '';
          position: fixed; top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #b8924a 30%, #e2bb72 50%, #b8924a 70%, transparent);
          z-index: 10;
        }

        #fb-root { position: relative; }

        /* ── Order CTA Banner ── */
        .order-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 28px;
          background: linear-gradient(135deg, #1a1410 0%, #221c14 100%);
          border-bottom: 1px solid #2c2418;
          position: sticky; top: 0; z-index: 9;
          backdrop-filter: blur(12px);
          gap: 16px;
        }
        .order-banner-text {
          font-family: 'Syne Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8a7a60;
        }
        .order-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #b8924a;
          color: #0a0908;
          border: none;
          cursor: pointer;
          font-family: 'Syne Mono', monospace;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 9px 18px;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .order-btn:hover { background: #c9a35a; transform: translateX(2px); }
        .order-btn:active { transform: translateX(0); }

        /* ── Layout ── */
        .fb-inner {
          max-width: 780px;
          margin: 0 auto;
          padding: 56px 28px 80px;
          position: relative; z-index: 1;
        }

        /* ── Header ── */
        .fb-header { margin-bottom: 52px; }
        .fb-eyebrow {
          font-family: 'Syne Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #b8924a;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .fb-eyebrow::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, #2c2418, transparent);
        }
        .fb-title {
          font-size: clamp(2.6rem, 6vw, 4rem);
          font-weight: 300;
          line-height: 1.05;
          color: #ede8df;
          letter-spacing: -0.01em;
        }
        .fb-title em { color: #b8924a; font-style: italic; font-weight: 300; }
        .fb-avg {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          padding: 12px 18px;
          background: #110f0c;
          border: 1px solid #2c2418;
          width: fit-content;
        }
        .fb-avg-num {
          font-size: 1.8rem;
          font-weight: 300;
          color: #b8924a;
          line-height: 1;
        }
        .fb-avg-meta {
          font-family: 'Syne Mono', monospace;
          font-size: 0.62rem;
          color: #6a6050;
          letter-spacing: 0.1em;
          line-height: 1.8;
        }

        /* ── Two-column layout ── */
        .fb-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 640px) { .fb-grid { grid-template-columns: 1fr; gap: 32px; } }

        /* ── Form panel ── */
        .form-panel {
          background: #0f0d0a;
          border: 1px solid #1e1a14;
          padding: 32px 28px;
        }

        .panel-title {
          font-family: 'Syne Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #6a6050;
          margin-bottom: 28px;
          padding-bottom: 14px;
          border-bottom: 1px solid #1e1a14;
        }

        /* ── Fields ── */
        .field-group { margin-bottom: 22px; }
        .field-label {
          font-family: 'Syne Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6a6050;
          margin-bottom: 8px;
          display: block;
        }
        .field-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .field-icon {
          position: absolute;
          left: 0;
          color: #4a4035;
          pointer-events: none;
        }
        .fb-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid #2c2418;
          color: #ede8df;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1rem;
          padding: 8px 0 8px 20px;
          outline: none;
          transition: border-color 0.2s;
        }
        .fb-input:focus { border-bottom-color: #b8924a; }
        .fb-input::placeholder { color: #3a3028; }

        .fb-textarea {
          width: 100%;
          background: #080706;
          border: 1px solid #1e1a14;
          color: #ede8df;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1rem;
          padding: 12px 14px;
          outline: none;
          resize: none;
          min-height: 110px;
          transition: border-color 0.2s;
          line-height: 1.6;
        }
        .fb-textarea:focus { border-color: #b8924a; }
        .fb-textarea::placeholder { color: #3a3028; }

        /* ── Stars ── */
        .star-row { display: flex; gap: 4px; align-items: center; }
        .star-btn {
          background: none; border: none; cursor: pointer; padding: 3px;
          transition: transform 0.12s ease;
          display: flex; align-items: center;
        }
        .star-btn:hover { transform: scale(1.2); }
        .star-btn:active { transform: scale(0.92); }
        .star-desc {
          font-family: 'Syne Mono', monospace;
          font-size: 0.62rem;
          color: #8a7a60;
          letter-spacing: 0.1em;
          margin-left: 8px;
        }

        /* ── Submit ── */
        .submit-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: #b8924a;
          color: #0a0908;
          border: none;
          cursor: pointer;
          font-family: 'Syne Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 14px;
          margin-top: 24px;
          transition: all 0.22s ease;
        }
        .submit-btn:hover:not(:disabled) { background: #c9a35a; }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .msg-error {
          font-family: 'Syne Mono', monospace;
          font-size: 0.62rem;
          color: #b85a4a;
          letter-spacing: 0.06em;
          margin-top: 10px;
        }
        .msg-success {
          font-family: 'Syne Mono', monospace;
          font-size: 0.62rem;
          color: #6ab88a;
          letter-spacing: 0.06em;
          margin-top: 10px;
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Reviews panel ── */
        .reviews-panel { display: flex; flex-direction: column; gap: 0; }

        .reviews-scroll {
          max-height: 600px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #1e1a14 transparent;
          display: flex; flex-direction: column; gap: 1px;
          background: #1a1510;
          border: 1px solid #1e1a14;
        }
        .reviews-scroll::-webkit-scrollbar { width: 3px; }
        .reviews-scroll::-webkit-scrollbar-thumb { background: #2c2418; }

        .review-card {
          background: #0d0b08;
          padding: 20px 22px;
          transition: background 0.15s;
        }
        .review-card:hover { background: #100e0a; }

        .review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 12px; }
        .review-name { font-size: 1rem; font-weight: 500; color: #ede8df; }
        .review-phone { font-family: 'Syne Mono', monospace; font-size: 0.58rem; color: #4a4035; margin-top: 2px; }
        .review-meta { text-align: right; flex-shrink: 0; }
        .review-date { font-family: 'Syne Mono', monospace; font-size: 0.58rem; color: #4a4035; margin-top: 4px; }
        .review-text { font-style: italic; color: #8a7a60; font-size: 0.95rem; line-height: 1.7; }

        .empty-state {
          padding: 52px 24px;
          text-align: center;
          color: #2c2418;
          border: 1px solid #1a1510;
        }
        .empty-label {
          font-family: 'Syne Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-top: 14px;
        }

        .loading-state {
          display: flex; align-items: center; gap: 10px;
          padding: 32px 0;
          color: #4a4035;
          font-family: 'Syne Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        .divider-gold {
          height: 1px;
          background: linear-gradient(90deg, transparent, #2c2418 20%, #2c2418 80%, transparent);
          margin: 52px 0;
        }
      `}</style>

      <div id="fb-root">

        {/* ── Sticky Order Banner ── */}
        <div className="order-banner">
          <span className="order-banner-text">Ready to order something?</span>
          <button className="order-btn" onClick={() => router.push('/menu-items')}>
            <UtensilsCrossed size={12} />
            Go to Menu
            <ChevronRight size={12} />
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
              <div className="fb-avg">
                <span className="fb-avg-num">{averageRating}</span>
                <div>
                  <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={11}
                        fill={s <= Math.round(Number(averageRating)) ? "#b8924a" : "none"}
                        stroke="#b8924a" strokeWidth={1.5} />
                    ))}
                  </div>
                  <p className="fb-avg-meta">
                    Average rating<br />
                    {feedbacks.length} review{feedbacks.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Two Column Grid ── */}
          <div className="fb-grid">

            {/* Left — Form */}
            <div className="form-panel">
              <p className="panel-title">Leave a Review</p>

              <div className="field-group">
                <label className="field-label">Name <span style={{ color: "#3a3028" }}>(optional)</span></label>
                <div className="field-wrap">
                  <User size={12} className="field-icon" />
                  <input className="fb-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Phone <span style={{ color: "#3a3028" }}>(optional)</span></label>
                <div className="field-wrap">
                  <Phone size={12} className="field-icon" />
                  <input className="fb-input" placeholder="+977-98XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Rating</label>
                <div className="star-row">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} className="star-btn"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star}`}>
                      <Star size={26}
                        fill={(hoveredRating || rating) >= star ? "#b8924a" : "none"}
                        stroke={(hoveredRating || rating) >= star ? "#b8924a" : "#2c2418"}
                        strokeWidth={1.5} />
                    </button>
                  ))}
                  {(hoveredRating || rating) > 0 && (
                    <span className="star-desc">{ratingLabel[hoveredRating || rating]}</span>
                  )}
                </div>
              </div>

              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label">Your experience</label>
                <textarea className="fb-textarea" rows={4}
                  placeholder="Tell us what you think…"
                  value={text} onChange={e => setText(e.target.value)} />
              </div>

              {submitError && <p className="msg-error">⚠ {submitError}</p>}
              {submitSuccess && <p className="msg-success">✓ Thank you — submitted successfully.</p>}

              <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting
                  ? <><Loader2 size={13} className="spin" /> Submitting…</>
                  : <><Send size={13} /> Submit Feedback</>}
              </button>

              {/* Order CTA inside form too */}
              <button
                onClick={() => router.push('/menu-items')}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "transparent",
                  color: "#b8924a",
                  border: "1px solid #2c2418",
                  cursor: "pointer",
                  fontFamily: "'Syne Mono', monospace",
                  fontSize: "0.68rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "12px",
                  marginTop: "10px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#b8924a";
                  (e.currentTarget as HTMLButtonElement).style.background = "#110f0c";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#2c2418";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <UtensilsCrossed size={12} />
                Order from Menu
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Right — Reviews */}
            <div className="reviews-panel">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p className="panel-title" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
                  All Reviews
                </p>
                {feedbacks.length > 0 && (
                  <span style={{
                    fontFamily: "'Syne Mono', monospace",
                    fontSize: "0.58rem",
                    letterSpacing: "0.12em",
                    padding: "3px 10px",
                    border: "1px solid #2c2418",
                    color: "#b8924a",
                  }}>
                    {feedbacks.length} total
                  </span>
                )}
              </div>

              {isLoading && (
                <div className="loading-state">
                  <Loader2 size={14} className="spin" />
                  Loading reviews…
                </div>
              )}

              {isError && (
                <p style={{ fontFamily: "'Syne Mono', monospace", fontSize: "0.62rem", color: "#b85a4a" }}>
                  ⚠ Unable to load reviews.
                </p>
              )}

              {!isLoading && !isError && feedbacks.length === 0 && (
                <div className="empty-state">
                  <MessageSquare size={28} />
                  <p className="empty-label">No reviews yet.<br />Be the first.</p>
                </div>
              )}

              {!isLoading && feedbacks.length > 0 && (
                <div className="reviews-scroll">
                  {feedbacks.map(fb => (
                    <div key={fb.id} className="review-card">
                      <div className="review-header">
                        <div>
                          <p className="review-name">{fb.name}</p>
                          {fb.phone && <p className="review-phone">{fb.phone}</p>}
                        </div>
                        <div className="review-meta">
                          <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={10}
                                fill={s <= fb.rating ? "#b8924a" : "none"}
                                stroke={s <= fb.rating ? "#b8924a" : "#2c2418"}
                                strokeWidth={1.5} />
                            ))}
                          </div>
                          <p className="review-date">{formatDate(fb.created_at)}</p>
                        </div>
                      </div>
                      <p className="review-text">"{fb.text}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedBackManagementPage