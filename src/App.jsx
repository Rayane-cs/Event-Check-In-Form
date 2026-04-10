import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const EVENT_NAME = import.meta.env.VITE_EVENT_NAME || "Event presence";
const STORAGE_PREFIX = "event_eci_day_";

function sanitize(str, max) {
  if (!str) return "";
  return String(str)
    .replace(/[<>"';\\]/g, "")
    .trim()
    .slice(0, max);
}

function localDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function storageKey() {
  return STORAGE_PREFIX + localDateKey();
}

export default function App() {
  const [fullName, setFullName] = useState("");
  const [level, setLevel] = useState("");
  const [specialityKey, setSpecialityKey] = useState("");
  const [specialityOther, setSpecialityOther] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successName, setSuccessName] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data && data.name) {
        setSuccessName(data.name);
      }
    } catch {
      // ignore
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedName = sanitize(fullName, 255);
    const trimmedLevel = (level || "").trim();
    const trimmedSpecialityOther = sanitize(specialityOther, 500);
    const trimmedFeedback = sanitize(feedback, 4000);

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }
    if (!trimmedLevel) {
      setError("Please select your level.");
      return;
    }
    if (!specialityKey) {
      setError("Please select a speciality.");
      return;
    }
    if (specialityKey === "autre" && !trimmedSpecialityOther) {
      setError("Please type your speciality.");
      return;
    }
    if (!API_BASE) {
      setError("Missing API: set VITE_API_BASE in .env.");
      return;
    }

    const body = {
      full_name: trimmedName,
      level: trimmedLevel,
      speciality_key: specialityKey,
      speciality_other: specialityKey === "autre" ? trimmedSpecialityOther : "",
      feedback: trimmedFeedback || undefined,
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        localStorage.setItem(storageKey(), JSON.stringify({ name: trimmedName, at: new Date().toISOString() }));
        setSuccessName(trimmedName);
        return;
      }
      if (res.status === 409) {
        setError(data.error || "You have already checked in today with these details.");
        return;
      }
      if (res.status === 403) {
        setError(data.error || "Check-in is not open today.");
        return;
      }
      setError(data.error || "Something went wrong. Please try again.");
    } catch (err) {
      console.error(err);
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const showOther = specialityKey === "autre";
  const hasSuccess = Boolean(successName);

  if (hasSuccess) {
    return (
      <div id="success-layer" className="success-overlay" aria-hidden="false">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2>You're checked in</h2>
          <p>
            Thank you, <strong>{successName}</strong>, for participating in {EVENT_NAME}. Your presence matters.
          </p>
          <p className="mono">See you at the event!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="logo-row">
        <h1>Event Presence Check-in</h1>
        <p>{EVENT_NAME} — quick presence & feedback</p>
      </div>

      <div id="main-card">
        <form id="checkin-form" noValidate onSubmit={handleSubmit}>
          <div id="form-error" role="alert" className={error ? "is-visible" : ""}>{error}</div>

          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="speciality">Speciality</label>
            <select id="speciality" name="speciality" required value={specialityKey} onChange={(e) => setSpecialityKey(e.target.value)}>
              <option value="">Select speciality</option>
              <option value="informatique">Informatique</option>
              <option value="mathematique">Mathématiques</option>
              <option value="physique">Physique</option>
              <option value="autre">Other</option>
            </select>
            <div id="other-wrap" className={showOther ? "is-visible" : ""}>
              <label htmlFor="speciality_other" style={{ marginTop: "12px" }}>Your speciality</label>
              <input
                id="speciality_other"
                type="text"
                placeholder="Type your speciality"
                autoComplete="off"
                value={specialityOther}
                onChange={(e) => setSpecialityOther(e.target.value)}
                required={showOther}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="level">Level</label>
            <select id="level" name="level" required value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Select level</option>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
              <option value="M1">M1</option>
              <option value="M2">M2</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="feedback">Feedback <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
            <textarea id="feedback" name="feedback" placeholder="Share your thoughts…" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>

          <button type="submit" className="btn-submit" id="submit-btn" disabled={loading}>
            <span className="btn-inner">
              <span className={loading ? "spinner is-active" : "spinner"} aria-hidden="true"></span>
              <span id="submit-label">{loading ? "Sending…" : "Submit check-in"}</span>
            </span>
          </button>
        </form>
      </div>

      <footer>One check-in per day · Thank you for participating</footer>
    </div>
  );
}
