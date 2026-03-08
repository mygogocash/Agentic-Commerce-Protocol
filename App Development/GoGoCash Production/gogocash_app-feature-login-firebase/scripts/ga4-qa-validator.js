/**
 * GoGoCash GA4 Event Validator
 *
 * Paste this entire script into the browser DevTools console on any
 * GoGoCash page (after granting marketing consent) to monitor and
 * validate all analytics events in real time.
 *
 * Usage:
 *   1. Open DevTools → Console
 *   2. Paste this script and press Enter
 *   3. Interact with the app normally
 *   4. Events are logged in a table as they fire
 *   5. Run  gogocashQA.report()  at any time for a summary
 *   6. Run  gogocashQA.piiAudit()  to scan for PII leaks
 */

(function () {
  "use strict";

  /* ── Expected events and their required parameters ── */

  const EVENT_SCHEMA = {
    page_viewed:               { required: [], optional: ["page_type", "route_name", "session_id"] },
    sign_up_completed:         { required: ["auth_method"], optional: [] },
    login_completed:           { required: ["auth_method"], optional: [] },
    merchant_detail_viewed:    { required: [], optional: ["merchant_name", "merchant_id"] },
    merchant_link_clicked:     { required: [], optional: ["merchant_name", "merchant_id", "cashback_rate"] },
    cashback_claim_confirmed:  { required: [], optional: ["cashback_amount", "cashback_currency", "merchant_name", "order_id"] },
    quest_started:             { required: [], optional: ["quest_id", "quest_name", "quest_type", "reward_amount"] },
    quest_completed:           { required: [], optional: ["quest_id", "quest_name", "quest_type", "reward_amount"] },
    wallet_connected:          { required: ["wallet_type"], optional: [] },
    onboarding_step_completed: { required: ["step_number", "step_name"], optional: [] },
  };

  /* ── PII patterns (must NEVER appear in payloads) ── */

  const PII_PATTERNS = [
    { name: "email",          re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
    { name: "phone",          re: /\+?\d[\d\s()-]{7,14}\d/ },
    { name: "wallet_address", re: /0x[a-fA-F0-9]{40}/ },
    { name: "jwt",            re: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/ },
  ];

  const PII_KEYS = new Set([
    "email", "phone", "mobile", "wallet", "wallet_address", "address",
    "account_name", "account_number", "bank_name", "full_name", "name",
    "username", "telegram_id", "access_token", "refresh_token", "crossmint_jwt",
  ]);

  /* ── State ── */

  const capturedEvents = [];
  const piiViolations = [];
  const seenEventIds = new Set();

  /* ── Helpers ── */

  function checkPII(event) {
    const violations = [];
    const flat = JSON.stringify(event);

    PII_PATTERNS.forEach(({ name, re }) => {
      if (re.test(flat)) {
        violations.push(`PII LEAK: "${name}" pattern found in ${event.event}`);
      }
    });

    Object.keys(event).forEach((key) => {
      if (PII_KEYS.has(key.toLowerCase())) {
        violations.push(`PII KEY: disallowed key "${key}" in ${event.event}`);
      }
    });

    return violations;
  }

  function validateEvent(event) {
    const schema = EVENT_SCHEMA[event.event];
    const issues = [];

    if (!schema) {
      // Not one of our tracked events (e.g. gtm.js, consent_update)
      return null;
    }

    // Check required params
    schema.required.forEach((param) => {
      if (event[param] === undefined || event[param] === null || event[param] === "") {
        issues.push(`MISSING required param: "${param}"`);
      }
    });

    // Check for duplicate event_id
    if (event.event_id) {
      if (seenEventIds.has(event.event_id)) {
        issues.push(`DUPLICATE event_id: ${event.event_id}`);
      }
      seenEventIds.add(event.event_id);
    } else {
      issues.push("MISSING event_id");
    }

    // Check consent
    if (event.marketing_consent !== true) {
      issues.push("WARNING: marketing_consent is not true");
    }

    // PII check
    const pii = checkPII(event);
    if (pii.length > 0) {
      issues.push(...pii);
      piiViolations.push(...pii);
    }

    return {
      event: event.event,
      event_id: (event.event_id || "").slice(0, 8) + "...",
      timestamp: new Date(event.timestamp_ms || Date.now()).toLocaleTimeString(),
      params: schema.required.concat(schema.optional)
        .filter((p) => event[p] !== undefined)
        .map((p) => `${p}=${event[p]}`)
        .join(", "),
      issues: issues.length > 0 ? issues.join("; ") : "✅ OK",
    };
  }

  /* ── Intercept dataLayer.push ── */

  window.dataLayer = window.dataLayer || [];
  const originalPush = window.dataLayer.push.bind(window.dataLayer);

  window.dataLayer.push = function (...args) {
    args.forEach((event) => {
      if (event && typeof event === "object" && event.event) {
        const result = validateEvent(event);
        if (result) {
          capturedEvents.push(result);
          const hasIssues = !result.issues.startsWith("✅");
          const style = hasIssues
            ? "color: red; font-weight: bold"
            : "color: green";
          console.log(
            `%c[GA4-QA] ${result.event}`,
            style,
            result.issues,
            { params: result.params, event_id: result.event_id }
          );
        }
      }
    });
    return originalPush(...args);
  };

  // Also scan existing events in dataLayer
  window.dataLayer.forEach((event) => {
    if (event && typeof event === "object" && event.event) {
      const result = validateEvent(event);
      if (result) {
        capturedEvents.push(result);
      }
    }
  });

  /* ── Public API ── */

  window.gogocashQA = {
    report() {
      console.log("\n%c═══ GoGoCash GA4 QA Report ═══", "font-size: 14px; font-weight: bold; color: #00B14F");

      if (capturedEvents.length === 0) {
        console.log("No events captured yet. Interact with the app and check again.");
        return;
      }

      console.table(capturedEvents);

      // Coverage check
      const firedEvents = new Set(capturedEvents.map((e) => e.event));
      const allEvents = Object.keys(EVENT_SCHEMA);
      const missing = allEvents.filter((e) => !firedEvents.has(e));

      console.log(`\n%cEvent Coverage: ${firedEvents.size}/${allEvents.length}`, "font-weight: bold");
      if (missing.length > 0) {
        console.log("%cNot yet fired:", "color: orange", missing.join(", "));
      } else {
        console.log("%c✅ All events have fired at least once!", "color: green; font-weight: bold");
      }

      // Issues summary
      const issues = capturedEvents.filter((e) => !e.issues.startsWith("✅"));
      if (issues.length > 0) {
        console.log(`\n%c⚠️  ${issues.length} event(s) with issues:`, "color: red; font-weight: bold");
        console.table(issues);
      } else {
        console.log("%c✅ No issues detected", "color: green; font-weight: bold");
      }

      return { total: capturedEvents.length, issues: issues.length, missing };
    },

    piiAudit() {
      console.log("\n%c═══ PII Audit ═══", "font-size: 14px; font-weight: bold; color: #CD0D0D");

      // Scan all dataLayer events
      const violations = [];
      window.dataLayer.forEach((event) => {
        if (event && typeof event === "object") {
          const pii = checkPII(event);
          violations.push(...pii);
        }
      });

      if (violations.length === 0) {
        console.log("%c✅ No PII detected in dataLayer", "color: green; font-weight: bold");
      } else {
        console.log(`%c❌ ${violations.length} PII violation(s) found:`, "color: red; font-weight: bold");
        violations.forEach((v) => console.log(`  ⛔ ${v}`));
      }

      return { violations: violations.length, details: violations };
    },

    events() {
      return capturedEvents;
    },

    clear() {
      capturedEvents.length = 0;
      seenEventIds.clear();
      piiViolations.length = 0;
      console.log("QA state cleared.");
    },
  };

  /* ── Startup message ── */

  console.log(
    "%c🔍 GoGoCash GA4 QA Validator Active",
    "font-size: 14px; font-weight: bold; color: #00B14F"
  );
  console.log("Events will be logged as they fire.");
  console.log("Commands:");
  console.log("  gogocashQA.report()    — Full event summary & coverage");
  console.log("  gogocashQA.piiAudit()  — Scan dataLayer for PII leaks");
  console.log("  gogocashQA.events()    — Raw captured events array");
  console.log("  gogocashQA.clear()     — Reset captured data");

  if (capturedEvents.length > 0) {
    console.log(`\n${capturedEvents.length} existing dataLayer event(s) found.`);
  }
})();
