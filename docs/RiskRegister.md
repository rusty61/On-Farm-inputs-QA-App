# Risk Register — Infield Spray Record

| Risk | Impact | Likelihood | Detection | Mitigation |
|------|--------|------------|-----------|------------|
| GPS accuracy poor | Medium | High | Compare coord precision | Force accuracy threshold, retry capture |
| Weather fetch fails | High | Medium | Missing values in record | Cache last good values, retry |
| Supabase RLS misconfigured | High | Medium | Unauthorized access in tests | Strict policies, peer review SQL |
| PDF generation errors | High | Low | Broken link/404 | Docker WeasyPrint with CI test export |
| User forgets to link profile→owner | High | High | Record denied by RLS | Add onboarding check |

---

## Test Plan
1. **Functional**: Create farm/paddock, record spray, finalize, export PDF.
2. **Edge**: GPS denied, zero chemicals, invalid rates.
3. **Soak**: 50+ records over 1 week, ensure no data loss.
4. **Brownout**: Simulate Render downtime, verify retries.

---

## Bug Repro Strategy
- Always test with clean Supabase user & fresh paddock.
- Use Postman for backend API replay.
- Log Supabase RLS rejections.
