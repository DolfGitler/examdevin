# Grind Website Backend Admin Guide

This guide explains step by step how to open the backend admin page and log in.

## 1. Open The Project Folder

Open this folder in Cursor or File Explorer:

```text
C:\Users\rohtl\Desktop\examdevin\grind-homepage
```

The backend files are inside:

```text
C:\Users\rohtl\Desktop\examdevin\grind-homepage\backend
```

## 2. Open A Terminal

In Cursor:

1. Open the top menu.
2. Press `Terminal`.
3. Press `New Terminal`.

Then write this command:

```powershell
cd C:\Users\rohtl\Desktop\examdevin\grind-homepage\backend
```

## 3. Check That Node.js Works

Write this in the terminal:

```powershell
node -v
```

If it shows a version number, Node.js is installed.

Example:

```text
v20.11.0
```

If it says Node is not found, install Node.js first from:

```text
https://nodejs.org/
```

## 4. Create The `.env` File

The backend needs a `.env` file for the admin username, password, and session secret.

In the terminal, write:

```powershell
copy .env.example .env
```

Then open this file:

```text
C:\Users\rohtl\Desktop\examdevin\grind-homepage\backend\.env
```

Inside `.env`, write your own random password and secret.

Example:

```text
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=MyRandomPassword9284
SESSION_SECRET=MyVeryLongRandomSecret9284ABCxyz
```

Important:

- `ADMIN_USERNAME` is the username you write on the admin login page.
- `ADMIN_PASSWORD` is the password you write on the admin login page.
- `SESSION_SECRET` can be any long random text with letters and numbers.
- Do not delete `.env`.
- Do not share `.env`.

## 5. Start The Backend Server

In the terminal, make sure you are still inside the backend folder:

```text
C:\Users\rohtl\Desktop\examdevin\grind-homepage\backend
```

Then write:

```powershell
npm start
```

If it works, the terminal will show something like:

```text
Grind backend töötab: http://localhost:3000
Admin: http://localhost:3000/admin
```

Keep this terminal open while using the website. If you close the terminal, the backend stops.

## 6. Open The Website

Open your browser and go to:

```text
http://localhost:3000
```

This opens the website through the backend server.

## 7. Open The Admin Page

Open your browser and go to:

```text
http://localhost:3000/admin
```

If you are not logged in, it will show the login page.

## 8. Log In To Admin

Use the same values that you wrote in `.env`.

Example:

```text
Kasutajanimi: admin
Parool: MyRandomPassword9284
```

If your `.env` has a different username or password, use those instead.

## 9. What You Can Do In Admin

After logging in, you can:

- add new products;
- edit products;
- delete products;
- see contact form messages.

## 10. Contact Form

The contact form works only when the website is opened through the backend.

Use this:

```text
http://localhost:3000/kontaktivorm.html
```

Do not open `kontaktivorm.html` directly from the file system, because then the backend form saving will not work.

## 11. Where The Data Is Saved

Products and contact messages are saved here:

```text
C:\Users\rohtl\Desktop\examdevin\grind-homepage\backend\data\db.json
```

If this file does not exist yet, the backend creates it automatically after you start the server.

## 12. If Login Does Not Work

Check these things:

1. Make sure `npm start` is still running.
2. Make sure you opened `http://localhost:3000/admin`.
3. Make sure `.env` exists inside the `backend` folder.
4. Make sure you are using the same username and password from `.env`.
5. If you changed `.env`, stop the server with `Ctrl + C` and run `npm start` again.

# Grind Homepage

Open `index.html` in a browser to view the page.

The code expects the original images to stay in the shared folder:

```text
C:\Users\rohtl\Desktop\examdevin\assets
```

Image filenames currently used by `index.html`:

```text
model2.png
model3.png
model1.png
c2d8a1de-3a90-4cfd-9951-402cb8ab23e7.png
4defcfab-3308-42a1-aaac-4bd4712d5ee3.png
80615b5d-575e-4ca6-97b8-1c8e20ad7309.png
pusa 1.png
teksad1.png
pusa 2.png
tsark1.png
tossud1.png
teksad 2.png
b395f608-cf33-40d4-88d4-ff8853c867b8.png
```

The header and footer logos are built with CSS because there is no separate logo image file in the asset folder.
