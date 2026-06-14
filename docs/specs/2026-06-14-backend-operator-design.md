# Backend Operator Design Spec

Tanggal: 2026-06-14  
Status: Approved dan implemented  
Scope utama: backend operator otomatis untuk battle engine hackathon Mantle

## 1. Ringkasan Tujuan

Backend `m2-gamified-agent/be` akan menjadi operator otomatis untuk arena yang sudah hidup di smart contract.

Peran backend:

- memantau round aktif di chain
- mengambil snapshot harga dari Pyth
- menjalankan reasoning agent lewat OpenRouter
- menghitung hasil battle off-chain
- mengunci round dan submit hasil ke smart contract

Backend bukan source of truth untuk ekonomi. Source of truth ekonomi tetap smart contract.

Posisi backend di produk:

- `off-chain battle operator`
- `on-chain settlement initiator`
- `runtime shell` untuk demo hackathon

## 2. Prinsip Scope Hackathon

Backend ini sengaja dibuat ringan dan pragmatis.

Keputusan desain utama:

- tetap pakai `Express.js`
- satu process saja
- scheduler otomatis aktif by default
- tanpa database
- state runtime utama disimpan in-memory
- persistence ringan ke file lokal hanya untuk recovery/debug

Hal yang sengaja tidak diambil:

- job queue terpisah
- worker process terpisah
- cron eksternal
- database SQL/NoSQL
- multi-round orchestration kompleks
- intraround multi-trade engine

## 3. Arsitektur Tingkat Tinggi

Backend dibagi menjadi modul kecil yang fokus:

### 3.1 `config`

Tanggung jawab:

- load `.env`
- validasi env dengan `zod`
- expose config typed untuk module lain

### 3.2 `chain`

Tanggung jawab:

- viem public client
- viem wallet client
- read state contract
- tx `lockRound`
- tx `submitRoundResult`

### 3.3 `market`

Tanggung jawab:

- ambil harga `BTC/USD`, `ETH/USD`, `SOL/USD` dari Pyth/Hermes
- bentuk market snapshot start/end round

### 3.4 `reasoning`

Tanggung jawab:

- bangun prompt untuk OpenRouter
- kirim request model
- parse JSON decision
- fallback ke `HOLD` jika invalid/gagal

### 3.5 `engine`

Tanggung jawab:

- membangun battle context round
- menghitung `finalPnlBps`
- menyusun ranking
- membentuk payload hasil
- menghasilkan `resultHash`

### 3.6 `scheduler`

Tanggung jawab:

- polling round aktif
- init tracking round
- menentukan kapan round settle
- menjalankan pipeline settlement otomatis

### 3.7 `api`

Tanggung jawab:

- expose endpoint `health`, `status`, dan debug/operator endpoint

## 4. Lifecycle Backend Round

### 4.1 Idle

Scheduler poll chain tiap interval.

Jika:

- `currentOpenRoundId == 0`

maka backend status `idle`.

### 4.2 Round detected

Jika ada `currentOpenRoundId > 0` dan belum ditrack:

- backend baca `getRound(roundId)`
- backend baca `getRoundParticipants(roundId)`
- backend baca metadata/identity agent
- backend simpan:
  - `roundId`
  - `stakeCloseAt`
  - participant ids
  - start market snapshot

Status berubah menjadi `tracking`.

### 4.3 Tracking

Selama `now < stakeCloseAt`:

- backend tidak settle
- backend hanya menjaga context round aktif
- optional endpoint status dapat membaca participant dan countdown

### 4.4 Settlement trigger

Saat `now >= stakeCloseAt`:

- status berubah menjadi `settling`
- backend ambil end market snapshot
- backend jalankan reasoning tiap agent
- backend hitung PnL dan ranking
- backend panggil `lockRound(roundId)`
- backend panggil `submitRoundResult(...)`

### 4.5 Completed

Jika submit sukses:

- backend simpan final result ke file
- status berubah menjadi `settled`
- state round aktif dibersihkan
- scheduler kembali ke mode watch

## 5. Agent Decision Contract

OpenRouter tidak boleh diberi kebebasan output terlalu luas. Keputusan agent harus kecil, ketat, dan gampang di-parse.

Format output target:

```json
{
  "action": "LONG",
  "asset": "ETH",
  "confidence": 72,
  "rationale": "Short momentum favors ETH breakout."
}
```

Constraint:

- `action` hanya `LONG | SHORT | HOLD`
- `asset` hanya `BTC | ETH | SOL`
- `confidence` integer `0-100`
- `rationale` pendek, satu kalimat

Jika model gagal:

- `action = HOLD`
- `confidence = 0`
- `rationale = "Invalid model output fallback"`

## 6. Market Snapshot Schema

Schema internal yang dipakai backend:

```ts
type AssetSymbol = "BTC" | "ETH" | "SOL";

type PricePoint = {
  symbol: AssetSymbol;
  price: number;
  publishTime: number;
};

type MarketSnapshot = {
  source: "pyth";
  capturedAt: number;
  prices: Record<AssetSymbol, PricePoint>;
};
```

Per round dibutuhkan:

- `startSnapshot`
- `endSnapshot`

V1 tidak memakai OHLC penuh. Snapshot harga awal dan akhir round sudah cukup.

## 7. PnL Formula V1

Semua agent memakai `1,000 USDC notional` yang sama secara konsep produk, tetapi untuk settlement smart contract backend cukup submit `finalPnlBps`.

Formula:

- `LONG`
  - `pnlBps = ((endPrice - startPrice) / startPrice) * 10000`
- `SHORT`
  - `pnlBps = ((startPrice - endPrice) / startPrice) * 10000`
- `HOLD`
  - `pnlBps = 0`

Rules:

- downside dibatasi minimum `-10000 bps`
- upside tidak perlu di-cap ketat di v1
- `confidence` tidak memengaruhi PnL pada v1

Confidence hanya dipakai untuk:

- battle logs
- UI insight
- debugging

## 8. Result Payload Dan Hash

Sebelum submit ke chain, backend membentuk object canonical:

- `roundId`
- `agentDecisions`
- `startSnapshot`
- `endSnapshot`
- `finalPnlBps`
- `ranks`
- `generatedAt`

Object ini di-serialize lalu di-hash menjadi `resultHash`.

`resultHash` dipakai sebagai:

- bukti referensi result untuk smart contract
- jembatan ke FE/BE debugging
- dasar auditability saat demo

## 9. Express API

Endpoint minimal:

### 9.1 `GET /health`

Output:

- service ok
- version/runtime

### 9.2 `GET /status`

Output:

- scheduler enabled/disabled
- active round id
- scheduler state
- last tick
- last settle
- last error

### 9.3 `GET /round/current`

Output:

- current tracked round summary
- participants
- stake close
- runtime status

### 9.4 `GET /round/:roundId/result`

Output:

- last computed result payload untuk round itu jika tersedia

### 9.5 `POST /operator/tick`

Tujuan:

- manual force satu scheduler tick untuk debugging

### 9.6 `POST /operator/run-current-round`

Tujuan:

- manual trigger pipeline battle pada round aktif

### 9.7 `POST /operator/settle-current-round`

Tujuan:

- manual paksa `lockRound + submitRoundResult`

Endpoint manual ini tidak menggantikan scheduler otomatis. Mereka hanya untuk recovery/demo control.

## 10. Scheduler Design

### 10.1 Interval

Scheduler poll chain setiap `10-15 detik`.

V1 tidak melakukan reasoning per tick. Battle dihitung sekali saat settlement.

### 10.2 State machine

Runtime state utama:

- `idle`
- `tracking`
- `settling`
- `settled`
- `error`

State internal minimal:

- `activeRoundId`
- `startSnapshot`
- `trackedAgentIds`
- `stakeCloseAt`
- `lastTickAt`
- `lastSettledRoundId`
- `lastError`

### 10.3 Default mode

Scheduler aktif by default.

Env `SCHEDULER_ENABLED` memungkinkan override kalau ingin debugging manual-only.

## 11. Failure Handling

### 11.1 OpenRouter failure

Jika reasoning request gagal:

- retry kecil sesuai limit
- jika tetap gagal, agent fallback ke `HOLD`

### 11.2 Pyth failure

Jika market snapshot tidak bisa diambil:

- jangan settle
- simpan error
- retry di tick berikutnya

### 11.3 `lockRound` failure

Jika tx lock gagal:

- stop settlement pipeline
- simpan error
- tunggu retry manual/otomatis

### 11.4 `submitRoundResult` failure

Jika tx submit gagal:

- simpan payload hasil lokal
- expose lewat endpoint result
- jangan hitung ulang kecuali operator memang minta

### 11.5 Process restart

Karena tidak ada DB:

- state penting juga disimpan ke file runtime
- saat boot, backend cek `currentOpenRoundId`
- kalau ada round aktif, backend rebuild context dari chain dan file runtime

## 12. Persistence Strategy

Tanpa database.

Direktori runtime yang disarankan:

- `runtime/round-state.json`
- `runtime/results/round-<id>.json`

Fungsi file persistence:

- recovery setelah restart
- debug hasil round
- audit trail demo

File runtime bukan source of truth ekonomi, hanya recovery/debug layer.

## 13. Env Design

Minimal env:

- `PORT`
- `MANTLE_RPC_URL`
- `MANTLE_CHAIN_ID`
- `OPERATOR_PRIVATE_KEY`
- `M2_ARENA_ADDRESS`
- `M2_AGENT_REGISTRY_ADDRESS`
- `M2_MOCK_USDC_ADDRESS`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_BASE_URL`
- `PYTH_HERMES_URL`
- `PYTH_BTC_USD_FEED_ID`
- `PYTH_ETH_USD_FEED_ID`
- `PYTH_SOL_USD_FEED_ID`
- `SCHEDULER_ENABLED`
- `SCHEDULER_POLL_INTERVAL_MS`
- `RUNTIME_DIR`

Optional:

- `ROUND_SETTLEMENT_RETRY_LIMIT`
- `OPENROUTER_TIMEOUT_MS`
- `PYTH_TIMEOUT_MS`

## 14. Implementation Phases

### Phase BE-A

- express shell
- env validation
- `/health`
- `/status`
- runtime state container

### Phase BE-B

- viem clients
- chain read/write service
- contract config wiring

### Phase BE-C

- Pyth/Hermes market client
- OpenRouter client
- structured decision parser

### Phase BE-D

- battle engine
- PnL calculation
- rank derivation
- result hash building
- runtime file persistence

### Phase BE-E

- scheduler
- round watch
- auto settlement
- retry handling

### Phase BE-F

- manual debug/operator endpoints
- result inspection
- recovery polish

## 15. Acceptance Criteria Sebelum Integrasi Lanjutan

Backend dianggap siap jika:

1. service boot sukses dengan env valid
2. scheduler mendeteksi `currentOpenRoundId`
3. backend bisa membaca participant dan metadata agent
4. backend bisa mengambil snapshot harga `BTC/ETH/SOL`
5. backend bisa menghasilkan decision JSON valid atau fallback `HOLD`
6. backend bisa menghitung `finalPnlBps` dan rank
7. backend bisa memanggil `lockRound`
8. backend bisa memanggil `submitRoundResult`
9. endpoint `/status` dan `/round/current` cukup untuk operator debugging

## 16. Keputusan Yang Sengaja Tidak Diambil

Untuk menjaga scope hackathon:

- tidak ada DB
- tidak ada worker process terpisah
- tidak ada multi-step intraround execution
- tidak ada confidence-weighted PnL
- tidak ada on-chain oracle consumption di backend settlement path

## 17. Kriteria Sukses Demo

Demo backend dianggap sukses jika dapat menunjukkan:

1. FE dan SC sudah hidup dengan round aktif
2. backend auto-detect round aktif
3. backend mengambil harga Pyth
4. backend menjalankan reasoning OpenRouter untuk semua agent
5. backend settle round otomatis ke smart contract
6. FE membaca hasil settlement baru tanpa ubah struktur ekonomi on-chain
