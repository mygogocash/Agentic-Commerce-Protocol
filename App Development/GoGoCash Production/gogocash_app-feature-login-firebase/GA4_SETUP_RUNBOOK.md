# GA4 Setup Runbook — GoGoCash

This document provides step-by-step instructions for configuring Google Analytics 4 (GA4) and Google Tag Manager (GTM) for the GoGoCash platform.

**GA4 Property ID:** `G-Q66JRSM0MB`
**GTM Container ID:** `GTM-WVGBK9HM`

---

## 1. GTM Web Container Configuration

Open [Google Tag Manager](https://tagmanager.google.com) → container `GTM-WVGBK9HM`.

### 1.1 GA4 Configuration Tag

| Setting | Value |
| --- | --- |
| Tag Type | Google Analytics: GA4 Configuration |
| Measurement ID | `G-Q66JRSM0MB` |
| Send a page view event | **Disabled** (the app sends `page_viewed` events explicitly) |
| Trigger | Consent Initialized – Custom Event `consent_update` where `marketing_consent` equals `true` |

> The app loads GTM only after the user grants marketing consent, so the config tag fires on the first `consent_update` event with `marketing_consent = true`.

### 1.2 DataLayer Variables

Create these **Data Layer Variables** in GTM (Variable Type: Data Layer Variable):

| Variable Name | Data Layer Variable Name | Purpose |
| --- | --- | --- |
| `dlv - event_id` | `event_id` | Deduplication / event correlation |
| `dlv - event_name` | `event_name` | Canonical event name |
| `dlv - auth_method` | `auth_method` | Login/signup provider |
| `dlv - merchant_name` | `merchant_name` | Merchant name |
| `dlv - merchant_id` | `merchant_id` | Merchant identifier |
| `dlv - cashback_rate` | `cashback_rate` | Cashback percentage |
| `dlv - cashback_amount` | `cashback_amount` | Cashback value claimed |
| `dlv - cashback_currency` | `cashback_currency` | Currency (fiat / stablecoin) |
| `dlv - order_id` | `order_id` | Order identifier |
| `dlv - quest_id` | `quest_id` | Quest identifier |
| `dlv - quest_name` | `quest_name` | Quest display name |
| `dlv - quest_type` | `quest_type` | Quest type |
| `dlv - reward_amount` | `reward_amount` | Quest reward value |
| `dlv - wallet_type` | `wallet_type` | Wallet provider (e.g. crossmint) |
| `dlv - step_number` | `step_number` | Onboarding step number |
| `dlv - step_name` | `step_name` | Onboarding step name |
| `dlv - page_type` | `page_type` | Page classification |
| `dlv - route_name` | `route_name` | Route name |
| `dlv - session_id` | `session_id` | Client session ID |
| `dlv - marketing_consent` | `marketing_consent` | Current consent state |
| `dlv - internal_traffic` | `internal_traffic` | Internal traffic flag |

### 1.3 Triggers

Create **Custom Event** triggers:

| Trigger Name | Event Name | Conditions |
| --- | --- | --- |
| `CE - page_viewed` | `page_viewed` | `marketing_consent` equals `true` |
| `CE - sign_up_completed` | `sign_up_completed` | `marketing_consent` equals `true` |
| `CE - login_completed` | `login_completed` | `marketing_consent` equals `true` |
| `CE - merchant_link_clicked` | `merchant_link_clicked` | `marketing_consent` equals `true` |
| `CE - merchant_detail_viewed` | `merchant_detail_viewed` | `marketing_consent` equals `true` |
| `CE - cashback_claim_confirmed` | `cashback_claim_confirmed` | `marketing_consent` equals `true` |
| `CE - quest_started` | `quest_started` | `marketing_consent` equals `true` |
| `CE - quest_completed` | `quest_completed` | `marketing_consent` equals `true` |
| `CE - wallet_connected` | `wallet_connected` | `marketing_consent` equals `true` |
| `CE - onboarding_step_completed` | `onboarding_step_completed` | `marketing_consent` equals `true` |

### 1.4 GA4 Event Tags

Create a **GA4 Event** tag for each event:

#### Tag: GA4 – page_viewed
| Setting | Value |
| --- | --- |
| Tag Type | Google Analytics: GA4 Event |
| Configuration Tag | GA4 Configuration (from §1.1) |
| Event Name | `page_viewed` |
| Event Parameters | `page_type` = `{{dlv - page_type}}`, `route_name` = `{{dlv - route_name}}`, `session_id` = `{{dlv - session_id}}` |
| Trigger | `CE - page_viewed` |

#### Tag: GA4 – sign_up_completed
| Setting | Value |
| --- | --- |
| Event Name | `sign_up_completed` |
| Event Parameters | `auth_method` = `{{dlv - auth_method}}` |
| Trigger | `CE - sign_up_completed` |

#### Tag: GA4 – login_completed
| Setting | Value |
| --- | --- |
| Event Name | `login_completed` |
| Event Parameters | `auth_method` = `{{dlv - auth_method}}` |
| Trigger | `CE - login_completed` |

#### Tag: GA4 – merchant_link_clicked
| Setting | Value |
| --- | --- |
| Event Name | `merchant_link_clicked` |
| Event Parameters | `merchant_name` = `{{dlv - merchant_name}}`, `merchant_id` = `{{dlv - merchant_id}}`, `cashback_rate` = `{{dlv - cashback_rate}}` |
| Trigger | `CE - merchant_link_clicked` |

#### Tag: GA4 – merchant_detail_viewed
| Setting | Value |
| --- | --- |
| Event Name | `merchant_detail_viewed` |
| Event Parameters | `merchant_name` = `{{dlv - merchant_name}}`, `merchant_id` = `{{dlv - merchant_id}}` |
| Trigger | `CE - merchant_detail_viewed` |

#### Tag: GA4 – cashback_claim_confirmed
| Setting | Value |
| --- | --- |
| Event Name | `cashback_claim_confirmed` |
| Event Parameters | `cashback_amount` = `{{dlv - cashback_amount}}`, `cashback_currency` = `{{dlv - cashback_currency}}`, `merchant_name` = `{{dlv - merchant_name}}`, `order_id` = `{{dlv - order_id}}` |
| Trigger | `CE - cashback_claim_confirmed` |

#### Tag: GA4 – quest_started
| Setting | Value |
| --- | --- |
| Event Name | `quest_started` |
| Event Parameters | `quest_id` = `{{dlv - quest_id}}`, `quest_name` = `{{dlv - quest_name}}`, `quest_type` = `{{dlv - quest_type}}`, `reward_amount` = `{{dlv - reward_amount}}` |
| Trigger | `CE - quest_started` |

#### Tag: GA4 – quest_completed
| Setting | Value |
| --- | --- |
| Event Name | `quest_completed` |
| Event Parameters | `quest_id` = `{{dlv - quest_id}}`, `quest_name` = `{{dlv - quest_name}}`, `quest_type` = `{{dlv - quest_type}}`, `reward_amount` = `{{dlv - reward_amount}}` |
| Trigger | `CE - quest_completed` |

#### Tag: GA4 – wallet_connected
| Setting | Value |
| --- | --- |
| Event Name | `wallet_connected` |
| Event Parameters | `wallet_type` = `{{dlv - wallet_type}}` |
| Trigger | `CE - wallet_connected` |

#### Tag: GA4 – onboarding_step_completed
| Setting | Value |
| --- | --- |
| Event Name | `onboarding_step_completed` |
| Event Parameters | `step_number` = `{{dlv - step_number}}`, `step_name` = `{{dlv - step_name}}` |
| Trigger | `CE - onboarding_step_completed` |

### 1.5 Blocking Rule (Optional)

Create an **Exception Trigger** to prevent GA4 tags from firing when `internal_traffic` is `true`:

| Setting | Value |
| --- | --- |
| Trigger Type | Custom Event |
| Event Name | `.*` (regex) |
| Condition | `dlv - internal_traffic` equals `true` |

Add this as an exception to all GA4 event tags.

---

## 2. GA4 Property Configuration

Open [Google Analytics](https://analytics.google.com) → Property `G-Q66JRSM0MB`.

### 2.1 Mark Conversion Events

Go to **Admin → Events** and mark as conversions:

| Event | Mark as Conversion |
| --- | --- |
| `sign_up_completed` | ✅ |
| `cashback_claim_confirmed` | ✅ |

### 2.2 Data Retention

Go to **Admin → Data Settings → Data Retention**:

| Setting | Value |
| --- | --- |
| Event data retention | 14 months |
| User data retention | 2 months |
| Reset user data on new activity | On |

### 2.3 Data Filters

Go to **Admin → Data Settings → Data Filters**:

#### Internal Traffic Filter
| Setting | Value |
| --- | --- |
| Filter name | GoGoCash Internal Traffic |
| Filter operation | Exclude |
| Parameter | `traffic_type` = `internal` |
| State | Testing → Active (after validation) |

Also define internal traffic in **Admin → Data Streams → [Web Stream] → Configure tag settings → Define internal traffic**:

| Rule name | IP addresses |
| --- | --- |
| GoGoCash Office | Add all GoGoCash team IP addresses |

### 2.4 Bot Filtering

Go to **Admin → Data Streams → [Web Stream]**:

- Verify "Filter out known bots and spiders" is **enabled** (on by default).

### 2.5 Custom Dimensions

Go to **Admin → Custom definitions → Custom dimensions**:

| Dimension name | Scope | Event parameter |
| --- | --- | --- |
| Auth Method | Event | `auth_method` |
| Merchant Name | Event | `merchant_name` |
| Merchant ID | Event | `merchant_id` |
| Cashback Rate | Event | `cashback_rate` |
| Cashback Currency | Event | `cashback_currency` |
| Quest Name | Event | `quest_name` |
| Quest Type | Event | `quest_type` |
| Wallet Type | Event | `wallet_type` |
| Step Name | Event | `step_name` |
| Page Type | Event | `page_type` |
| Route Name | Event | `route_name` |

Custom metrics:

| Metric name | Scope | Event parameter | Unit |
| --- | --- | --- | --- |
| Cashback Amount | Event | `cashback_amount` | Standard |
| Reward Amount | Event | `reward_amount` | Standard |
| Step Number | Event | `step_number` | Standard |

### 2.6 GA4 Audiences (REQ-010)

Go to **Admin → Audiences → New Audience**:

#### Audience 1: Merchant Clickers Without Cashback

| Setting | Value |
| --- | --- |
| Name | Merchant Clickers – No Cashback (7d) |
| Include users when | `merchant_link_clicked` event in last 7 days |
| Exclude users when | `cashback_claim_confirmed` event in last 7 days |
| Membership duration | 7 days |

#### Audience 2: Onboarded But No Purchase

| Setting | Value |
| --- | --- |
| Name | Onboarded – No Purchase |
| Include users when | `sign_up_completed` event (any time) |
| Exclude users when | `merchant_link_clicked` event (any time) |
| Membership duration | 30 days |

#### Audience 3: High-Value Users (3+ Cashbacks)

| Setting | Value |
| --- | --- |
| Name | High-Value Users (3+ Cashbacks) |
| Include users when | `cashback_claim_confirmed` event count ≥ 3 |
| Membership duration | 90 days |

### 2.7 Google Ads Linking (if applicable)

Go to **Admin → Google Ads Links → Link**:
- Link to the GoGoCash Google Ads account
- Enable personalized advertising
- Enable auto-tagging

This allows the 3 audiences above to be exported to Google Ads for retargeting campaigns.

---

## 3. Environment Variables

The app reads analytics config at build time via `NEXT_PUBLIC_*` env vars (see `.env.example`).

### Production

```env
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_GTM_ID=GTM-WVGBK9HM
NEXT_PUBLIC_ANALYTICS_DEBUG=false
```

### Staging

```env
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_GTM_ID=GTM-WVGBK9HM
NEXT_PUBLIC_ANALYTICS_DEBUG=true
```

> **Note:** Use the same GTM container but publish to the staging GTM environment. Alternatively, use a separate GTM container for staging so production data is never contaminated. In staging, enable `NEXT_PUBLIC_ANALYTICS_DEBUG=true` for verbose console logging.

### How to deploy

Environment variables are injected at build time. If deploying via:

- **Docker**: Pass as build args or runtime env vars
  ```bash
  docker build --build-arg NEXT_PUBLIC_ANALYTICS_ENABLED=true \
               --build-arg NEXT_PUBLIC_GTM_ID=GTM-WVGBK9HM \
               -t gogocash-app .
  ```

- **Kubernetes**: Add to deployment spec
  ```yaml
  env:
  - name: NEXT_PUBLIC_ANALYTICS_ENABLED
    value: "true"
  - name: NEXT_PUBLIC_GTM_ID
    value: "GTM-WVGBK9HM"
  ```

- **Cloud Build**: Add substitutions or env vars in `cloudbuild.yaml`

---

## 4. QA Validation Checklist

### 4.1 Pre-Launch Validation

Open the staging environment with `?gtm_debug=1` appended to enable GTM Preview mode.

#### Event Verification (GA4 DebugView)

Open GA4 → **Admin → DebugView**. Perform each action and verify the event appears within 5 seconds:

| # | Action | Expected Event | Expected Parameters | ✅ |
| --- | --- | --- | --- | --- |
| 1 | Navigate to any page | `page_viewed` | `page_type`, `route_name`, `session_id` | ☐ |
| 2 | Register a new account (Google) | `sign_up_completed` | `auth_method` = `google` | ☐ |
| 3 | Login with existing account (Google) | `login_completed` | `auth_method` = `google` | ☐ |
| 4 | Register a new account (Twitter) | `sign_up_completed` | `auth_method` = `twitter` | ☐ |
| 5 | Login with existing account (Twitter) | `login_completed` | `auth_method` = `twitter` | ☐ |
| 6 | Register via Telegram | `sign_up_completed` | `auth_method` = `telegram` | ☐ |
| 7 | Login via Telegram | `login_completed` | `auth_method` = `telegram` | ☐ |
| 8 | Register via Facebook | `sign_up_completed` | `auth_method` = `facebook` | ☐ |
| 9 | Login via Facebook | `login_completed` | `auth_method` = `facebook` | ☐ |
| 10 | View a merchant detail page | `merchant_detail_viewed` | `merchant_name`, `merchant_id` | ☐ |
| 11 | Click a merchant affiliate link | `merchant_link_clicked` | `merchant_name`, `merchant_id`, `cashback_rate` | ☐ |
| 12 | Claim cashback | `cashback_claim_confirmed` | `cashback_amount`, `cashback_currency`, `merchant_name` | ☐ |
| 13 | Start a quest | `quest_started` | `quest_id`, `quest_name` | ☐ |
| 14 | Complete a quest | `quest_completed` | `quest_id`, `quest_name` | ☐ |
| 15 | Connect Crossmint wallet | `wallet_connected` | `wallet_type` = `crossmint` | ☐ |
| 16 | Save profile info | `onboarding_step_completed` | `step_number` = `1`, `step_name` = `profile_setup` | ☐ |
| 17 | Send phone OTP | `onboarding_step_completed` | `step_number` = `2`, `step_name` = `phone_verification` | ☐ |
| 18 | Confirm phone OTP | `onboarding_step_completed` | `step_number` = `3`, `step_name` = `phone_confirmed` | ☐ |
| 19 | Visit with UTM params `?utm_source=test&utm_medium=cpc` | `page_viewed` | Verify UTM params in GA4 Traffic Acquisition | ☐ |

#### Consent Verification

| # | Check | ✅ |
| --- | --- | --- |
| 1 | Before accepting consent: no GTM script loaded in network tab | ☐ |
| 2 | Before accepting consent: `window.dataLayer` contains no events beyond bootstrap | ☐ |
| 3 | After accepting consent: GTM script loads | ☐ |
| 4 | After accepting consent: queued events flush to dataLayer | ☐ |
| 5 | After rejecting consent: no GTM script loaded, no events sent | ☐ |

#### PII Audit

Open browser DevTools → Network tab. Filter for `google-analytics.com` and `googletagmanager.com` requests.

| # | Check | ✅ |
| --- | --- | --- |
| 1 | No raw email addresses in any request payload | ☐ |
| 2 | No raw phone numbers in any request payload | ☐ |
| 3 | No wallet addresses in any request payload | ☐ |
| 4 | No usernames or full names in any request payload | ☐ |
| 5 | No access tokens or JWTs in any request payload | ☐ |
| 6 | `user_data_external_id`, `user_data_em`, `user_data_ph` are SHA-256 hashes (64 hex chars) | ☐ |

#### Duplicate Prevention

| # | Check | ✅ |
| --- | --- | --- |
| 1 | Refresh page: only 1 `page_viewed` fires (not 2) | ☐ |
| 2 | Browser back/forward: only 1 `page_viewed` per navigation | ☐ |
| 3 | Login after signup: `sign_up_completed` fires once, subsequent logins fire `login_completed` | ☐ |
| 4 | `cashback_claim_confirmed` fires once per claim (not on page refresh) | ☐ |

#### Performance

| # | Check | Target | ✅ |
| --- | --- | --- | --- |
| 1 | Lighthouse Performance score (with GTM) | No more than 5-point drop vs without GTM | ☐ |
| 2 | GTM script load time | < 50ms added to page load | ☐ |
| 3 | GTM/GA4 scripts load async | Verified in network waterfall | ☐ |
| 4 | No render-blocking scripts from analytics | Verified | ☐ |

#### Cross-Browser

| Browser | page_viewed | login/signup | merchant events | ✅ |
| --- | --- | --- | --- | --- |
| Chrome (desktop) | ☐ | ☐ | ☐ | ☐ |
| Safari (desktop) | ☐ | ☐ | ☐ | ☐ |
| Firefox (desktop) | ☐ | ☐ | ☐ | ☐ |
| Edge (desktop) | ☐ | ☐ | ☐ | ☐ |
| iOS Safari (mobile) | ☐ | ☐ | ☐ | ☐ |
| Android Chrome (mobile) | ☐ | ☐ | ☐ | ☐ |

### 4.2 Post-Launch Monitoring (Hypercare)

After production deployment, monitor for 7 days:

| Day | Check | ✅ |
| --- | --- | --- |
| Day 1 | GA4 Real-Time report shows live data | ☐ |
| Day 1 | All 10 event types appear in GA4 Events report | ☐ |
| Day 1 | No PII detected in GA4 DebugView spot check | ☐ |
| Day 2 | Conversion events (`sign_up_completed`, `cashback_claim_confirmed`) visible in Conversions report | ☐ |
| Day 3 | UTM attribution data visible in Traffic Acquisition report | ☐ |
| Day 3 | Internal traffic filter confirmed working (compare with/without filter) | ☐ |
| Day 7 | GA4 Audiences populating (check Admin → Audiences) | ☐ |
| Day 7 | Set up GA4 custom alerts for anomalies (e.g., event count drops > 50%) | ☐ |

---

## 5. Rollback Procedure

If issues are detected post-launch:

### Severity: Low (data quality issues)
1. Pause specific event tags in GTM → **Publish**
2. Fix the tag configuration
3. Re-publish

### Severity: High (PII leak, performance regression)
1. Set `NEXT_PUBLIC_ANALYTICS_ENABLED=false` → redeploy app
2. Pause ALL GA4 tags in GTM → **Publish**
3. Investigate and fix
4. Re-enable after fix is verified

### Severity: Critical (consent bypass)
1. Set `NEXT_PUBLIC_ANALYTICS_ENABLED=false` → redeploy app immediately
2. Pause entire GTM container
3. Contact DPO / legal team
4. Request data deletion from GA4 if needed

---

## 6. Event Reference

Complete list of all dataLayer events the app emits:

| Event | Source File | Trigger |
| --- | --- | --- |
| `page_viewed` | `src/providers/AnalyticsProvider.tsx` | Route change |
| `sign_up_completed` | `src/providers/AnalyticsProvider.tsx` | New user registration (auth intent from register page) |
| `login_completed` | `src/providers/AnalyticsProvider.tsx` | Existing user login (auth intent from login page) |
| `merchant_detail_viewed` | `src/features/shop/component/ShopDetail.tsx` | Merchant page mount |
| `merchant_link_clicked` | `src/features/shop/component/ShopDetail.tsx` | Deeplink generated |
| `cashback_claim_confirmed` | `src/features/transaction/component/WalletTransaction.tsx` | Cashback claimed |
| `quest_started` | `src/features/quest/component/QuestPage.tsx` | Quest initiated |
| `quest_completed` | `src/features/transaction/component/WalletTransaction.tsx` | Quest completed |
| `wallet_connected` | `src/hooks/useCrossmintLogin.ts` | Crossmint wallet login success |
| `onboarding_step_completed` | `src/features/profile/component/ProfileInfo.tsx` | Profile saved (step 1) |
| `onboarding_step_completed` | `src/features/profile/component/VerifyNumberPhone.tsx` | OTP sent (step 2) |
| `onboarding_step_completed` | `src/features/profile/component/CFNumberPhone.tsx` | Phone confirmed (step 3) |
