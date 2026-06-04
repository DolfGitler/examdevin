# Grind Custom Backend

## Keele ja raamistiku valik

Valisin **Node.js** ja kirjutasin backend'i **ilma välise raamistikuta** ehk `http`, `fs`, `path` ja muud Node'i sisseehitatud moodulid.

Eelised:
- Ei pea installima ühtegi lisapaketti.
- Töötab kohe, kui arvutis on Node.js olemas.
- Sobib väikese kooliprojekti jaoks, sest kogu loogika on ühes kohas ja lihtne kontrollida.

Miinused:
- Suure projekti jaoks oleks Express või mõni muu raamistik mugavam.
- Vormide, sessioonide ja marsruutide käsitlemine tuleb ise kirjutada.
- JSON-fail sobib väikese andmemahu jaoks, aga päris e-poes kasutaks PostgreSQL/MySQL/SQLite andmebaasi.

## Vajalik tarkvara

- Node.js 18 või uuem
- Veebibrauser
- Terminal või PowerShell

Kontrolli Node.js olemasolu:

```bash
node -v
```

## Käivitamine

Mine backend kausta:

```bash
cd C:\Users\rohtl\Desktop\examdevin\grind-homepage\backend
```

Loo `.env` fail. Võid alustada failist `.env.example`:

```bash
copy .env.example .env
```

Muuda `.env` sees kindlasti parool ja sessiooni saladus juhuslikeks väärtusteks:

```text
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=siia-pikk-juhuslik-parool
SESSION_SECRET=siia-pikk-juhuslik-saladus
```

Käivita server:

```bash
npm start
```

Ava veeb:

```text
http://localhost:3000
```

## Admin

Admin asub:

```text
http://localhost:3000/admin
```

Vaikimisi sisselogimine:

```text
Kasutajanimi: see, mis on `.env` failis `ADMIN_USERNAME`
Parool: see, mis on `.env` failis `ADMIN_PASSWORD`
```

Adminis saab:
- tooteid lisada;
- tooteid muuta;
- tooteid kustutada;
- vaadata kontaktivormi sõnumeid.

Admini toote väljad:
- nimi;
- kirjeldus;
- pildi tee;
- hind;
- kategooria;
- suurused;
- bränd;
- tootekood;
- stiilikood.

## Kontaktivorm

Kontaktivorm töötab siis, kui leht on avatud backend serveri kaudu:

```text
http://localhost:3000/kontaktivorm.html
```

Vorm saadab andmed aadressile:

```text
POST /contact
```

Sõnumid salvestatakse faili:

```text
backend/data/db.json
```

## Andmebaas

Projekt kasutab JSON-faili:

```text
backend/data/db.json
```

Andmebaasi struktuur:

```text
backend/migrations/001_json_schema.json
```

Algne dump:

```text
backend/data/database-dump.json
```

Kui `db.json` puudub, loob server selle automaatselt.

## Turvalisus

Tehtud turvameetmed:

- Admini parool ei ole avatekstina koodis. Parool tuleb `.env` failist.
- Parool salvestatakse andmebaasi `scrypt` räsi ja soolaga.
- `.env` on `.gitignore` failis, et saladused ei läheks Giti.
- Kõigil muutvatel vormidel on CSRF-kaitse: login, logout, toote lisamine, muutmine, kustutamine ja kontaktivorm.
- Kontaktivormil ja admini tootevormidel on serveripoolne sisendi valideerimine.
- Päringu keha suurus on piiratud, et vältida liiga suuri vormipäringuid.
- HTML väljundis kasutatakse escape'imist, et kasutaja sisend ei muutuks HTML/JS koodiks.
- SQL-süsti vastu eraldi SQL päringuid ei ole, sest projekt kasutab JSON-faili, mitte SQL-andmebaasi. JSON-andmed loetakse ja kirjutatakse struktureeritult, mitte SQL-lausetega.

## Backend vaated

Backend-renderdatud tootevaated:

```text
http://localhost:3000/backend/tooted
http://localhost:3000/backend/tooted/grind-pusa-2026
```

Need vaated ei kasuta sinu põhilehe disaini, sest ülesandes oli öeldud, et admin/backend vaade ei pea olema stiliseeritud.

## API

Kõik tooted JSON kujul:

```text
GET /api/products
```
