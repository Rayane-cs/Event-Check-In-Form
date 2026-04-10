import { useState, useEffect } from "react";
import { useLang } from "./contexts/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

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
  const { t } = useLang();
  const [fullName, setFullName] = useState("");
  const [level, setLevel] = useState("");
  const [specialityKey, setSpecialityKey] = useState("");
  const [specialityOther, setSpecialityOther] = useState("");
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
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
    setFormError("");
    setFieldErrors({});

    const trimmedName = sanitize(fullName, 255);
    const trimmedLevel = (level || "").trim();
    const trimmedSpecialityOther = sanitize(specialityOther, 500);
    const trimmedFeedback = sanitize(feedback, 4000);

    const newFieldErrors = {};

    if (!trimmedName) {
      newFieldErrors.fullName = t.presence.required;
    }
    if (!specialityKey) {
      newFieldErrors.specialityKey = t.presence.required;
    }
    if (specialityKey === "autre" && !trimmedSpecialityOther) {
      newFieldErrors.specialityOther = t.presence.required;
    }
    if (!trimmedLevel) {
      newFieldErrors.level = t.presence.required;
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }
    if (!API_BASE) {
      setFormError("Missing API: set VITE_API_BASE in .env.");
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
        setFormError(data.error || "You have already checked in today with these details.");
        return;
      }
      if (res.status === 403) {
        setFormError(data.error || "Check-in is not open today.");
        return;
      }
      setFormError(data.error || t.presence.error);
    } catch (err) {
      console.error(err);
      setFormError("Network error — please try again.");
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
          <h2>{t.presence.success}</h2>
          <p>
            Thank you, <strong>{successName}</strong>, for participating in {EVENT_NAME}. Your presence matters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LanguageSwitcher />
      <div className="wrap">
        <div className="logo-row">
          <img src="/club-logo.webp" alt="Club Logo" className="club-logo" />
          <h1>{t.presence.title}</h1>
          <p>{t.presence.subtitle}</p>
        </div>

        <div id="main-card">
          <form id="checkin-form" noValidate onSubmit={handleSubmit}>
            <div id="form-error" role="alert" className={formError ? "is-visible" : ""}>{formError}</div>

            <div className={`field ${fieldErrors.fullName ? "has-error" : ""}`}>
              <label htmlFor="full_name">{t.presence.fullName}</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                placeholder={t.presence.fullNamePh}
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFieldErrors(prev => ({...prev, fullName: ""})) }}
              />
              {fieldErrors.fullName && <div className="field-error-msg">{fieldErrors.fullName}</div>}
            </div>

            <div className={`field ${fieldErrors.specialityKey ? "has-error" : ""}`}>
              <label htmlFor="speciality">{t.presence.speciality}</label>
              <select id="speciality" name="speciality" required value={specialityKey} onChange={(e) => { setSpecialityKey(e.target.value); setFieldErrors(prev => ({...prev, specialityKey: ""})) }}>
                <option value="">{t.presence.specialityPh}</option>
                {t.presence.specialities.slice(0, -1).map((spec, i) => {
                  const keys = ["informatique", "physique", "mathematique"];
                  return <option key={i} value={keys[i]}>{spec}</option>;
                })}
                <option value="autre">{t.presence.specialities[t.presence.specialities.length - 1]}</option>
              </select>
              {fieldErrors.specialityKey && <div className="field-error-msg">{fieldErrors.specialityKey}</div>}
              <div id="other-wrap" className={`sub-field ${showOther ? "is-visible" : ""} ${fieldErrors.specialityOther ? "has-error" : ""}`}>
                <label htmlFor="speciality_other" style={{ marginTop: "12px" }}>{t.presence.speciality}</label>
                <input
                  id="speciality_other"
                  type="text"
                  placeholder={t.presence.specialityPh}
                  autoComplete="off"
                  value={specialityOther}
                  onChange={(e) => { setSpecialityOther(e.target.value); setFieldErrors(prev => ({...prev, specialityOther: ""})) }}
                  required={showOther}
                />
                {fieldErrors.specialityOther && <div className="field-error-msg">{fieldErrors.specialityOther}</div>}
              </div>
            </div>

            <div className={`field ${fieldErrors.level ? "has-error" : ""}`}>
              <label htmlFor="level">{t.presence.level}</label>
              <select id="level" name="level" required value={level} onChange={(e) => { setLevel(e.target.value); setFieldErrors(prev => ({...prev, level: ""})) }}>
                <option value="">{t.presence.levelPh}</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
              </select>
              {fieldErrors.level && <div className="field-error-msg">{fieldErrors.level}</div>}
            </div>

            <div className="field">
              <label htmlFor="feedback">{t.presence.feedback}</label>
              <textarea id="feedback" name="feedback" placeholder={t.presence.feedbackPh} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>

            <button type="submit" className="btn-submit" id="submit-btn" disabled={loading}>
              <span className="btn-inner">
                <span className={loading ? "spinner is-active" : "spinner"} aria-hidden="true"></span>
                <span id="submit-label">{loading ? t.presence.submitting : t.presence.submit}</span>
              </span>
            </button>
          </form>
        </div>

        <footer>One check-in per day · Thank you for participating</footer>
      </div>
    </>
  );
}


