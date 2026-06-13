# M2 Gamified Agent Design Spec

Tanggal: 2026-06-14
Status: Draft untuk review
Scope utama: smart contract dan economics untuk hackathon Mantle

## 1. Ringkasan Produk

`m2-gamified-agent` adalah arena kompetisi AI agent trading berbasis Mantle. Semua agent bertarung di arena yang sama, menggunakan engine backend internal untuk reasoning dan simulasi battle, sementara identity agent, staking, settlement, treasury, dan reward dibawa on-chain.

Produk ini diposisikan sebagai:

- `on-chain competitive agent game with off-chain execution`
- fokus track Mantle AI Agent dengan adopsi `ERC-8004`
- prioritas implementasi: `smart contract -> FE integration -> backend -> FE polish`

## 2. Prinsip Scope Hackathon

Tujuan utama bukan membuat marketplace agent permissionless penuh. Semua agent dijalankan oleh backend internal platform yang sama. User tidak membawa agent executor dari luar. User hanya membuat profil/config agent di dalam platform.

Implikasinya:

- AI reasoning dan simulasi PnL berjalan off-chain
- smart contract hanya menangani identity, bond, stake, settlement, treasury, dan claim
- contract tidak menghitung trading logic
- backend menjadi round operator resmi

## 3. Arena Economics

### 3.1 Tipe modal

Sistem memisahkan empat komponen ekonomi:

- `virtual bankroll`: semua agent memulai battle dengan `1,000 USDC notional`
- `creator bond`: collateral nyata milik creator agent
- `public stake`: stake publik ke agent pilihan
- `creator self-stake`: opsional, creator boleh ikut stake seperti user biasa

`Virtual bankroll` bukan dana on-chain. Angka ini hanya baseline kompetisi untuk mengukur PnL dan ranking secara adil.

### 3.2 House-filled arena

Arena selalu memiliki `house agents` internal platform agar battle selalu hidup, bahkan saat user agent masih sedikit. House agents menjadi peserta resmi arena dan tunduk pada ranking yang sama dengan user agents.

Pilihan ini diambil karena:

- sangat cocok untuk demo hackathon
- mengurangi ketergantungan pada traffic nyata
- selaras dengan FE yang sudah punya karakter inti seperti `BLITZ`, `NOVA`, `BYTE`, `ZENITH`

### 3.3 Bond model

`Creator bond` dipisahkan dari stake. Bond bukan modal trading dan bukan taruhan langsung.

Aturan bond:

- creator wajib menyetor bond untuk mengaktifkan agent
- bond disimpan sebagai collateral agent
- creator boleh tetap melakukan `self-stake` sebagai user biasa
- jika `final PnL < 0`, bond terkena slash proporsional
- basis slash diambil dari `remaining bond`
- `max slash = 20% per round`

Tujuan bond:

- memberikan skin in the game untuk creator
- membuat kualitas agent terlihat lewat kondisi bond
- menjadi sumber pemasukan treasury saat agent berkinerja buruk

### 3.4 Payout model

Settlement ronde menggunakan `Top-3 weighted winner pool`.

Aturan:

- rank `1-3` adalah winner
- rank `4+` dianggap loser untuk settlement staker
- loser pool dibagi ke top 3 dengan bobot:
  - rank 1: `50%`
  - rank 2: `30%`
  - rank 3: `20%`

### 3.5 Creator reward

Setiap winner bucket dibagi:

- `15%` untuk creator reward
- `85%` untuk staker reward secara prorata

Jika dana winner bucket tidak cukup untuk menjaga principal staker winner, maka:

- creator reward disubordinasikan lebih dulu
- treasury backstop hanya menjaga principal winner staker
- treasury tidak wajib menjamin creator reward

### 3.6 Treasury role

Treasury bukan bonus pool tetap. Treasury hanya berfungsi sebagai `automatic backstop`.

Sumber treasury:

- hasil slash bond creator
- funding awal protocol jika diperlukan

Fungsi treasury:

- menutup kekurangan agar principal staker pemenang tidak kurang
- tidak otomatis memberi bonus ekstra
- tidak menjadi sumber payout utama selama settlement pool masih cukup

## 4. ERC-8004 Strategy

Integrasi ERC-8004 dianggap penting untuk positioning Mantle hackathon.

Pendekatan yang dipilih:

- agent menggunakan `ERC-8004 agentId` sebagai identifier kanonik
- identity agent diwujudkan secara nyata, bukan hanya internal ID palsu
- outcome ronde akan menjadi sinyal reputasi agent
- validation layer dibuat ringan, cukup untuk hackathon

Implementasi yang dimaksud bukan menulis ulang seluruh ekosistem ERC-8004 dari nol. Fokusnya adalah adopsi penuh pada level identitas dan reputasi produk, sambil menjaga scope implementasi tetap realistis.

## 5. Smart Contract Boundaries

### 5.1 AgentRegistry

Tanggung jawab:

- registrasi house agent dan user agent
- menyimpan owner, metadata, status aktif, dan remaining bond
- mengaitkan agent dengan identitas ERC-8004
- menyimpan config hash dari setup off-chain
- top-up bond dan perubahan status agent

### 5.2 ArenaSettlement

Tanggung jawab:

- membuat, membuka, dan mengunci round
- menerima stake ke agent tertentu dalam round tertentu
- menyimpan accounting stake per round
- menerima hasil final round dari operator backend
- menghitung top 3, slash bond, creator reward, winner claims, dan kebutuhan treasury backstop

### 5.3 TreasuryVault

Tanggung jawab:

- menerima bond slash
- menyimpan reserve protocol
- menyediakan backstop otomatis saat principal winner tidak cukup

### 5.4 Di luar smart contract

Komponen berikut tetap off-chain:

- reasoning AI
- market data ingestion
- simulasi battle
- ranking derivation awal
- orchestration OpenRouter dan prompt

Backend akan menjadi `authorized round operator`, lalu mengirim hasil akhir yang deterministic ke contract.

## 6. Data Model On-Chain

### 6.1 Agent

- `agentId`
- `owner`
- `isHouseAgent`
- `isActive`
- `remainingBond`
- `agentURI`
- `configHash`
- `lastJoinedRoundId`
- `lastSettledRoundId`

### 6.2 Round

- `roundId`
- `status`
- `stakeOpenAt`
- `stakeCloseAt`
- `participantCount`
- `treasuryTopUpUsed`
- `totalStaked`
- `settlementPool`
- `backstopCap`

### 6.3 RoundAgentState

- `roundId`
- `agentId`
- `joined`
- `finalPnlBps`
- `rank`
- `bondSlashed`
- `creatorReward`
- `totalStakeOnAgent`
- `winnerAllocation`

### 6.4 StakePosition

- `roundId`
- `agentId`
- `staker`
- `amount`
- `claimed`

## 7. Round Lifecycle

### 7.1 Create agent

- user membuat agent
- identitas agent ERC-8004 diregistrasi
- creator deposit bond
- config hash dan metadata dicatat
- agent diarahkan ke round `OPEN` berikutnya

### 7.2 Seed participants

- house agents selalu tersedia
- operator memastikan round memenuhi minimum partisipan yang sehat dengan house agents

### 7.3 Staking window

- selama round `OPEN`, public dan creator boleh stake ke agent
- stake dicatat per `roundId + agentId + staker`

### 7.4 Lock round

- round berubah dari `OPEN` ke `LOCKED`
- stake baru ditolak
- agent baru diarahkan ke round berikutnya

### 7.5 Off-chain battle

- backend menjalankan semua agent internal
- semua agent memakai `1,000 USDC notional`
- backend menghasilkan rank dan final PnL

### 7.6 Submit result

Operator submit:

- `roundId`
- daftar `agentId`
- daftar `rank`
- daftar `finalPnlBps`
- `resultHash`

Contract lalu:

- memvalidasi shape data
- mengunci hasil settlement
- menghitung slash bond
- menghitung winner bucket
- menghitung creator reward
- meminta treasury backstop bila perlu

### 7.7 Claim phase

Distribusi memakai model `pull claim`:

- staker claim reward sendiri
- creator claim reward sendiri
- tidak ada push transfer massal saat settlement

## 8. Settlement Rules

### 8.1 Winner determination

- `top 3 by rank` adalah winner
- rank `4+` adalah loser untuk settlement staker
- `PnL negatif` tidak membatalkan status rank top 3

### 8.2 Loser pool

- total stake pada rank `4+` membentuk losing pool
- losing pool dibagi ke top 3 dengan bobot `50 / 30 / 20`

### 8.3 Staker payout

Untuk setiap winner agent:

- principal staker tetap diprioritaskan
- reward bucket staker dibagi prorata sesuai total stake pada agent tersebut

### 8.4 Creator reward

- creator mengambil `15%` dari bucket winner
- creator reward disubordinasikan jika principal staker winner belum aman

### 8.5 Bond slash formula

Aturan prinsip:

- `finalPnl >= 0` -> no slash
- `finalPnl < 0` -> slash proporsional dari `remaining bond`
- maksimum slash `20% per round`

Detail formula implementasi akan ditetapkan di phase coding agar konsisten dengan representasi `basis points`.

### 8.6 Treasury backstop

- treasury hanya dipakai bila principal staker winner belum tercapai
- treasury tidak memberi bonus tetap
- jika treasury tidak cukup, settlement tetap berjalan dengan backstop parsial dan event shortfall

## 9. Permissions dan Failure Handling

### 9.1 Roles

- `admin`: setup awal, treasury config, operator management, house agents
- `round operator`: buka round, lock round, submit result
- `user`: create agent, top-up bond, stake, claim

### 9.2 Result authority

Backend internal adalah sumber hasil resmi round. Contract tidak menghitung PnL sendiri.

### 9.3 Low bond behavior

- agent aktif selama `remaining bond >= minimum active bond`
- jika turun di bawah threshold, agent menjadi inactive
- owner harus top-up bond untuk ikut round baru

### 9.4 Invalid result submission

Contract harus revert jika:

- agent tidak cocok dengan peserta round
- rank duplikat
- result pernah disubmit
- shape data tidak konsisten

### 9.5 Claim safety

- satu posisi hanya bisa di-claim sekali
- creator claim dan staker claim dipisah

### 9.6 Emergency posture

Untuk hackathon cukup ada kemampuan:

- pause new staking
- pause new round opening
- sebisa mungkin claim atas round settled tetap tidak terganggu

## 10. Testing Strategy

### 10.1 Registry tests

- create house agent
- create user agent
- deposit/top-up bond
- inactive threshold behavior

### 10.2 Round lifecycle tests

- open round
- staking saat `OPEN`
- lock round
- reject staking after lock
- reject invalid result submission

### 10.3 Settlement tests

- top 3 weighted pool
- creator share `15%`
- creator subordinated first
- treasury backstop principal winner
- proportional bond slash capped `20%`

### 10.4 Claim tests

- staker claim once
- creator claim once
- no double claim
- partial backstop behavior

## 11. Delivery Phases

### Phase A

- core types
- ERC-8004 integration surface
- agent registry
- bond accounting

### Phase B

- round creation/open/lock
- participant assignment
- staking

### Phase C

- result submission
- settlement engine
- creator reward
- bond slash
- treasury backstop

### Phase D

- staker claim
- creator claim
- events
- read helpers for FE/BE

### Phase E

- hardening
- edge cases
- ABI readiness
- integration notes

## 12. Keputusan yang Sengaja Tidak Diambil

Untuk menjaga scope:

- tidak membuat agent marketplace permissionless
- tidak menghitung trading logic on-chain
- tidak membuat reward bonus pool tetap
- tidak menulis ulang seluruh ERC-8004 stack dari nol jika adapter/integration cukup

## 13. Kriteria Sukses Hackathon

Demo dianggap sukses jika dapat menunjukkan urutan berikut secara utuh:

1. user create agent
2. agent mendapat identity yang selaras dengan ERC-8004
3. staker memilih agent dan melakukan stake
4. backend menjalankan battle internal
5. result disubmit on-chain
6. bond slash/reward settlement terjadi sesuai aturan
7. staker dan creator melakukan claim
