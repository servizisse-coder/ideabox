# IdeaBox 💡

Piattaforma per la raccolta e gestione delle idee aziendali con votazione, commenti e revisione da parte della direzione.

## 🚀 Funzionalità

- ✅ **Proposta idee** - Ogni dipendente può proporre idee (anche anonimamente)
- ⭐ **Doppia votazione** - Qualità (quanto è buona) e Priorità (quanto è urgente)
- 💬 **Commenti** - Discussione su ogni idea (anche anonimamente)
- 🤖 **Organizzazione AI** - Le idee vengono automaticamente categorizzate e riassunte
- 📊 **Dashboard direzione** - La direzione può approvare/non approvare le top idee ogni 15 giorni
- 📧 **Notifiche email** - Aggiornamenti automatici sullo stato delle proprie idee

## 🛠️ Stack Tecnologico

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **State Management**: Zustand
- **UI Components**: Radix UI

## 📦 Setup Locale

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

## 🌐 Deploy su Vercel

### Opzione 1: Deploy diretto (consigliata)

1. Vai su [vercel.com](https://vercel.com)
2. Importa il progetto da GitHub
3. Configura le variabili d'ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Opzione 2: CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## 🔑 Variabili d'Ambiente

Già configurate in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://bnzmebxytlhigqoywinx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
```

## 🗄️ Database (già configurato!)

Il database è già configurato su Supabase con:

- **Tabelle**: profiles, ideas, votes, comments, categories, review_cycles, notifications
- **RLS**: Row Level Security attiva per tutti i dati
- **Trigger**: Aggiornamento automatico punteggi e contatori
- **Categorie**: Prodotto, Processi, Cultura, Tecnologia, Marketing, Altro
- **Cron Jobs**:
  - `process-ideas-daily`: Elabora le nuove idee ogni sera alle 23:00
  - `send-notifications-every-5min`: Invia notifiche email ogni 5 minuti

## 👤 Ruoli Utente

1. **Dipendente** (default)
   - Propone idee
   - Vota e commenta
   - Vede le proprie notifiche

2. **Direzione** (`is_direction = true` nel profilo)
   - Tutti i poteri del dipendente
   - Accesso al pannello di revisione `/direction`
   - Può approvare/non approvare idee

3. **Admin** (`is_admin = true` nel profilo)
   - Tutti i poteri
   - Vede autori anonimi
   - Gestione utenti

## 📱 Pagine

| Route | Descrizione |
|-------|-------------|
| `/` | Homepage con classifica idee |
| `/ideas/new` | Form nuova idea |
| `/ideas/[id]` | Dettaglio idea con voti e commenti |
| `/my-ideas` | Le proprie idee |
| `/approved` | Idee approvate |
| `/rejected` | Idee non approvate |
| `/direction` | Pannello direzione (solo direzione) |
| `/notifications` | Notifiche personali |
| `/login` | Login |
| `/register` | Registrazione |

## 📧 Notifiche Email (opzionale)

Per abilitare le notifiche email vere:

1. Crea un account su [resend.com](https://resend.com)
2. Vai su Supabase > Edge Functions > send-notifications > Settings
3. Aggiungi il secret `RESEND_API_KEY`
4. Verifica il tuo dominio su Resend

Senza Resend, le notifiche vengono comunque marcate come "inviate" nel database per demo.

## 🔄 Ciclo di Revisione

Ogni 15 giorni:
1. Le idee vengono raccolte e organizzate dall'AI
2. La direzione accede a `/direction` e vede le top 10 idee (per punteggio combinato)
3. Per ogni idea, la direzione può:
   - ✅ **Approvare** con motivazione e programmazione (es. "Q1 2025")
   - ❌ **Non approvare** con motivazione
4. Gli autori ricevono notifica automatica

## 📄 Licenza

MIT
