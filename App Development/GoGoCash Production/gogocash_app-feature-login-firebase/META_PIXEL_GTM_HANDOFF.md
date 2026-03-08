# Meta Pixel + GTM Handoff

This app now emits canonical Meta tracking events into `window.dataLayer` after explicit marketing consent. Browser Pixel and Conversions API delivery still need to be configured in GTM web and GTM server.

## App Environment

Set these variables in each environment:

```env
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
NEXT_PUBLIC_META_USER_SALT=<stable-private-salt>
NEXT_PUBLIC_ANALYTICS_DEBUG=false
```

Notes:

- `NEXT_PUBLIC_ANALYTICS_ENABLED=false` is the app kill switch.
- `NEXT_PUBLIC_GTM_ID` must point to the GTM web container for the current environment.
- `NEXT_PUBLIC_META_PIXEL_ID` is available for GTM configuration and hash salting fallback, but the app does not call `fbq()` directly.
- `NEXT_PUBLIC_META_USER_SALT` should be stable across environments if deduplication and identity continuity matter.

## Canonical Data Layer Events

The app emits these events only:

- `page_viewed`
- `merchant_detail_viewed`
- `sign_up_completed`
- `login_completed`
- `merchant_link_clicked`
- `cashback_claim_confirmed`
- `quest_started`
- `quest_completed`
- `wallet_connected`
- `onboarding_step_completed`

Every emitted event includes:

- `event`
- `event_name`
- `meta_event_name`
- `event_id`
- `eventID`
- `timestamp_ms`
- `route_name`
- `page_type`
- `locale`
- `session_id`
- `event_source_url`
- `referrer_domain`
- `fbp`
- `fbc`
- `site_env`
- `internal_traffic`
- `marketing_consent`

Identity fields are sent only as hashes:

- `user_data_external_id`
- `user_data_em`
- `user_data_ph`

## Event Mapping

| App event | Meta event | Required GTM handling |
| --- | --- | --- |
| `page_viewed` | `PageView` | one fire per route change |
| `merchant_detail_viewed` | `ViewContent` | send `content_type`, `content_ids`, `content_name`, `content_category` |
| `sign_up_completed` | `CompleteRegistration` | only after authenticated session exists |
| `merchant_link_clicked` | `InitiateCheckout` | only after deeplink generation succeeds |
| `cashback_claim_confirmed` | `Purchase` | use `value` + `currency`, same `event_id` as browser event |
| `quest_started` | `QuestStarted` | custom event |
| `quest_completed` | `QuestCompleted` | custom event |
| `login_completed` | `Login` | only after authenticated session for returning users |
| `wallet_connected` | `WalletConnected` | custom event, do NOT send wallet address |
| `onboarding_step_completed` | `OnboardingStepCompleted` | custom event, includes step_number and step_name |

## GTM Web Container

Create the web container with these pieces:

1. Consent initialization
   - Default marketing consent to denied.
   - Use app-managed consent updates from `consent_update`.

2. Blocking rules
   - Block tags when `marketing_consent` is false.
   - Block non-production domains from using the production pixel.
   - Block when `internal_traffic` is true.

3. Meta base tag
   - Initialize the pixel only after marketing consent.
   - Disable advanced matching in the browser tag.

4. Event tags
   - Trigger only from the structured `dataLayer` events above.
   - Pass `eventID={{event_id}}` on every Meta browser event.
   - Map `content_ids` as an array for `ViewContent`, `InitiateCheckout`, and `Purchase` where relevant.

5. Mirror forwarding
   - Forward the same payload to GTM server at `track.app.gogocash.co`.

## GTM Server Container

Deploy the GTM server container on `track.app.gogocash.co`.

Server-side requirements:

- Receive mirrored web events with the same `event_id`.
- Enrich with `client_ip_address`, `client_user_agent`, `event_source_url`, `fbp`, and `fbc`.
- Send Meta Conversions API events with:
  - `event_name`
  - `event_id`
  - `event_time`
  - `action_source=website`
  - hashed user data when present
- Strip any raw identifiers before forwarding.

Deduplication rule:

- Browser Pixel must send `eventID={{event_id}}`
- CAPI must send the same `event_id`
- Event names must match exactly

## Production Validation

Do not launch until all checks pass:

1. Consent
   - No Meta browser or server traffic before marketing consent.
   - Consent acceptance loads GTM and starts event delivery.

2. Browser events
   - `PageView`, `ViewContent`, `CompleteRegistration`, `InitiateCheckout`, `Purchase`, `QuestStarted`, and `QuestCompleted` appear in Meta Pixel Helper and Events Manager Test Events.

3. Server events
   - GTM server receives the same `event_id`.
   - Events Manager shows browser/server pairs deduplicated correctly.

4. No duplicates
   - `InitiateCheckout` fires once per successful deeplink.
   - `Purchase` fires once when a known conversion transitions into `approved`.

5. Privacy
   - No raw email, phone, wallet, bank, or account data in `dataLayer`, web requests, or server forwarding payloads.

6. Environment safety
   - Staging uses a separate GTM environment and separate Meta test pixel.
   - Production pixel never receives staging traffic.

## Rollback

Use this order:

1. Set `NEXT_PUBLIC_ANALYTICS_ENABLED=false`
2. Pause Meta event tags in GTM web
3. Pause Meta forwarding in GTM server
