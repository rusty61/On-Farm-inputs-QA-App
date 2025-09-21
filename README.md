# Infield Spray Record

Mobile-first PWA to capture spray applications for QA audits.  
Built with **Next.js + Tailwind + Supabase Auth → FastAPI + Supabase (Postgres) + WeasyPrint**.  
Deployed via **Vercel (frontend)** + **Render (backend)**.

---

## 🔑 Features
1. Tank mix builder (chemicals + water).
2. Owner/Farm/Paddock admin.
3. Per-paddock GPS capture (lat/lng/accuracy).
4. Weather snapshot (Blynk webhook).
5. Audit-grade PDF (server authoritative w/ QR & watermark).
6. Offline provisional PDF (jsPDF).
7. Supabase RLS → owner-scoped data.

---

## 👥 Team Roles
- [Team Leader] → Scope, acceptance criteria.
- [Mr. Software Engineer] → Architecture, modules, standards.
- [Mr. Debuguy / QA] → Risks, test plan, bug repro.

Full persona profiles: [Team Profiles Repo](https://github.com/rusty61/Team-Profiles-for-chatgtp/tree/main/personas)

---

## 📚 Documentation
- [docs/DesignBrief.md](docs/DesignBrief.md) — architecture, data flow, acceptance criteria, milestones.
- [docs/RiskRegister.md](docs/RiskRegister.md) — QA risks + mitigation.

---

## 🚀 Quick Start
See [INSTALL.md](INSTALL.md) for step-by-step setup on Windows (Supabase, backend, frontend, deploy).

---

## ✅ Status
- Scaffold complete (backend + frontend + Supabase migrations).
- Initial GitHub repo: [On-Farm-inputs-QA-App](https://github.com/rusty61/On-Farm-inputs-QA-App).
- Next milestone: integrate weather + finalize button in UI, QA pass.

