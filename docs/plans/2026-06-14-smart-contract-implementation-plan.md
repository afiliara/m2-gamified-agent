# Smart Contract Implementation Plan

Tanggal: 2026-06-14
Status: Pending approval
Prioritas: `SC-first`

## Tujuan

Menyelesaikan fondasi smart contract untuk `m2-gamified-agent` agar FE dapat berintegrasi ke ABI dan event yang stabil, lalu backend dapat mengikuti format round operator yang sudah final.

## Fase Implementasi

### Phase A - Registry Foundation

Target:

- definisi data model inti
- registrasi house agent
- registrasi user agent
- bond accounting
- status active/inactive
- integrasi ERC-8004 yang relevan untuk identity

Deliverables:

- kontrak registry/factory awal
- event registrasi dan top-up bond
- test registry

Risiko:

- salah memilih bentuk integrasi ERC-8004
- over-scope jika mencoba mengimplementasi seluruh registry stack sekaligus

### Phase B - Round Admission dan Staking

Target:

- round open/lock lifecycle
- assignment agent ke round
- stake ke agent per round
- accounting total stake per agent

Deliverables:

- kontrak round/staking
- event staking dan round state
- test lifecycle round

Risiko:

- layout storage membengkak
- desain write path terlalu mahal gas jika terlalu eager

### Phase C - Settlement Engine

Target:

- submit result oleh operator
- validasi rank dan participant
- top 3 weighted winner pool
- creator share `15%`
- creator subordinated first
- bond slash proportional dengan cap `20%`
- transfer slash ke treasury
- treasury automatic backstop principal winner

Deliverables:

- fungsi settlement final
- event result submission dan settlement
- test penuh economics

Risiko:

- formula settlement tidak konsisten dengan claim accounting
- edge case winner tanpa stake

### Phase D - Claim System

Target:

- pull-based claim untuk staker
- creator reward claim
- anti double-claim
- partial backstop shortfall handling

Deliverables:

- fungsi claim
- event claim
- test claim idempotency

Risiko:

- state accounting salah urut
- mismatch reward view vs actual claim

### Phase E - Hardening dan Integration Readiness

Target:

- event coverage untuk FE/BE
- view helpers untuk dashboard
- edge case tests
- formatting dan contract hygiene
- catatan integrasi untuk FE dan BE

Deliverables:

- set view methods yang stabil
- gas sanity checks
- dokumen mapping integrasi

Risiko:

- tergoda menambah fitur sebelum integrasi dasar stabil

## Urutan Kerja Praktis

1. finalkan lokasi dan bentuk integrasi ERC-8004
2. bangun registry dan bond accounting
3. bangun round lifecycle dan staking
4. bangun settlement engine
5. bangun claim
6. rapikan event/view untuk integrasi

## Aturan Eksekusi

- tidak menulis backend battle engine sebelum interface result submission stabil
- tidak menghubungkan FE ke mock ABI sementara jika kontrak inti belum stabil
- setiap phase harus lolos test sebelum lanjut
- `plan.md` menjadi sumber status kerja utama
