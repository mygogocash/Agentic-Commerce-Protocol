# 📋 Project Handover Status for `gogocash-acp`

## ✅ Completed Tasks
1.  **Codebase & Architecture**
    *   **Pure Firebase**: MongoDB removed. Backend refactored to `src/ACP/services/firestore.ts`.
    *   **Build Fixed**: `npm run build` passes (TypeScript errors resolved).
    *   **Testing**: Playwright E2E tests created in `tests/e2e.spec.ts`.

2.  **Data Management**
    *   **Massive Upload**: Auto-pausing script `run_daily_upload.sh` uploads 20k/day (Free Tier).
    *   **Status**: 20,000 records uploaded on Dec 29. Resume tomorrow.

3.  **Documentation**
    *   [ChatGPT Integration](./CHATGPT_INTEGRATION.md) (OpenAPI Spec ready).
    *   [Wiki](./wiki_content/) prepared.

## 🛑 Critical Blocker: Deployment
Role propagation or Org Policy is blocking the Cloud Build Service Account.

**Error**:
`Build failed ... missing permission on the build service account`

**Required Fix (Manual Action)**:
1.  Go to **Google Cloud Console** > **IAM & Admin** > **IAM**.
2.  Find the service account: `868624295342@cloudbuild.gserviceaccount.com`.
3.  Ensure it has these roles:
    *   `Cloud Build Service Account`
    *   `Service Account User`
    *   `Cloud Functions Developer`
    *   `Artifact Registry Writer`
4.  Once fixed, run:
    ```bash
    ./fix_and_deploy.sh
    ```

## 🧪 Testing
Run Playwright to verify once deployed:
```bash
npx playwright test
```

Signed off by **Antigravity**. 🫡
