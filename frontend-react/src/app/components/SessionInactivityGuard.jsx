/**
 * Vigilancia de inactividad: listeners con throttle + un solo temporizador adaptativo
 * (más frecuente cerca del corte) y aviso previo 1 min antes.
 * Debe montarse dentro de BrowserRouter.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import InactivityWarningModal from "./InactivityWarningModal.jsx";
import {
  DEFAULT_INACTIVITY_USER_MESSAGE,
  getMsUntilInactivityExpiry,
  getNextInactivityPollDelayMs,
  INACTIVITY_WARNING_BEFORE_MS,
  isExpiredByInactivity,
  STORAGE_KEY_LAST_ACTIVITY_AT,
  touchActivity,
} from "../../shared/session/sessionActivity.js";

const THROTTLE_MS = 30_000;

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];

export default function SessionInactivityGuard() {
  const { isAuthenticated, authStatus, logout } = useAuth();
  const navigate = useNavigate();
  const lastTouchRef = useRef(0);
  const expiredRef = useRef(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  const throttledTouch = useCallback(() => {
    const t = Date.now();
    if (t - lastTouchRef.current < THROTTLE_MS) return;
    lastTouchRef.current = t;
    touchActivity(t);
  }, []);

  const expireAndRedirect = useCallback(async () => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    setShowInactivityWarning(false);
    await logout();
    navigate("/login", {
      replace: true,
      state: { sessionExpiredMessage: DEFAULT_INACTIVITY_USER_MESSAGE },
    });
  }, [logout, navigate]);

  useEffect(() => {
    if (!isAuthenticated) expiredRef.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) setShowInactivityWarning(false);
  }, [isAuthenticated]);

  const continueSession = useCallback(() => {
    const t = Date.now();
    lastTouchRef.current = t;
    touchActivity(t);
    setShowInactivityWarning(false);
  }, []);

  useEffect(() => {
    if (authStatus === "loading" || !isAuthenticated) return undefined;

    let cancelled = false;
    let timeoutId = null;

    const clearTimer = () => {
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const runCheck = () => {
      if (cancelled) return;
      clearTimer();

      if (isExpiredByInactivity()) {
        setShowInactivityWarning(false);
        void expireAndRedirect();
        return;
      }

      const rem = getMsUntilInactivityExpiry();
      if (rem != null) {
        setShowInactivityWarning(rem > 0 && rem <= INACTIVITY_WARNING_BEFORE_MS);
      } else {
        setShowInactivityWarning(false);
      }

      const delay = getNextInactivityPollDelayMs(rem);
      timeoutId = window.setTimeout(runCheck, delay);
    };

    const scheduleRecheckSoon = () => {
      if (cancelled) return;
      clearTimer();
      timeoutId = window.setTimeout(runCheck, 0);
    };

    const onStorage = (e) => {
      if (!e || e.storageArea !== localStorage) return;
      if (e.key !== STORAGE_KEY_LAST_ACTIVITY_AT && e.key !== null) return;
      scheduleRecheckSoon();
    };

    touchActivity();
    lastTouchRef.current = Date.now();

    const onActivity = () => {
      throttledTouch();
    };

    ACTIVITY_EVENTS.forEach((ev) => {
      window.addEventListener(ev, onActivity, { passive: true, capture: true });
    });

    window.addEventListener("storage", onStorage);
    runCheck();

    return () => {
      cancelled = true;
      clearTimer();
      window.removeEventListener("storage", onStorage);
      ACTIVITY_EVENTS.forEach((ev) => {
        window.removeEventListener(ev, onActivity, true);
      });
    };
  }, [authStatus, isAuthenticated, throttledTouch, expireAndRedirect]);

  return <InactivityWarningModal isOpen={showInactivityWarning} onContinue={continueSession} />;
}
