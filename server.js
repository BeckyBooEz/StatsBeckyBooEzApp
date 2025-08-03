require("dotenv").config();
const express = require("express");

const app = express();
const session = require("express-session");

app.set('trust proxy', 1); // ✅ IMPORTANTE en Render o cualquier proxy

app.use(session({
    secret: 'spotify_secret_session',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: 'lax'
    }
}));

const PORT = 3000;

app.use(express.static("public"));

const ClientId = process.env.SPOTIFY_CLIENT_ID;
const ClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const RedirectUri = process.env.REDIRECT_URI;

const Scopes = [
    "user-read-recently-played",
    "user-top-read"
].join(" ");

/* let TokenTimeStamp = 0;
let AccessToken = null; 
async function GetToken() {
    const now = Date.now();

    if (!AccessToken || now - TokenTimeStamp > 3600 * 1000) {
        const auth = Buffer.from(`${ClientId}:${ClientSecret}`).toString("base64");

        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials"
        });

        const data = await response.json();

        AccessToken = data.access_token;
        TokenTimeStamp = now
    }
    return AccessToken
}
app.get("/api/artista", async (req, res) => {
    const { nombre } = req.query;

    const token = await GetToken();

    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(nombre)}&type=artist&limit=1`;
    const response = await fetch(searchUrl, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();
    res.json(data)
}) */

/* Esta ruta es para el login */
app.get("/login", (req, res) => {
    /* Construimos un url para auhorizar y nos de un code en url*/
    const url = `https://accounts.spotify.com/authorize` +
        `?response_type=code` +
        `&client_id=${encodeURIComponent(ClientId)}` +
        `&scope=${encodeURIComponent(Scopes)}` +
        `&redirect_uri=${encodeURIComponent(RedirectUri)}`;

    res.redirect(url)
});

app.get("/api/callback", async (req, res) => {
    const code = req.query.code;

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", RedirectUri);
    params.append("client_id", ClientId);
    params.append("client_secret", ClientSecret);

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
    });

    const data = await response.json();

    if (data.access_token) {
        req.session.access_token = data.access_token;
        req.session.refresh_token = data.refresh_token;

        // 🔍 Obtener perfil del usuario
        const profileRes = await fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${data.access_token}` }
        });
        const profile = await profileRes.json();
        req.session.user = {
            id: profile.id,
            name: profile.display_name || profile.id,
            email: profile.email
        };

        console.log("🆔 Nuevo login:");
        console.log("  - Session ID:", req.sessionID);
        console.log("  - Usuario:", req.session.user);

        res.redirect("/");
    } else {
        console.error("Error en el token:", data);
        res.status(400).send("Error al iniciar sesión");
    }
});

/* Endpoint de las recently-played */
app.get("/api/recently-played", async (req, res) => {
    const token = req.session.access_token;
    if (!token) {
        return res.status(401).json({ error: "No se ha iniciado sesión" });
    }

    const nowplayed = Date.now();

    console.log("🎧 Solicitud de canciones:");
    console.log("  - Session ID:", req.sessionID);
    console.log("  - Usuario:", req.session.user);
    console.log("  - Token:", req.session.access_token?.slice(0, 20) + "...");


    const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?before=${nowplayed}&limit=50`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();
    res.json(data);
});

app.get("/api/top", async (req, res) => {
    const { type, time_range } = req.query;

    /* Valores posibles a usar*/
    const tipos = ["artists", "tracks"];
    const rangos = ["short_term", "medium_term", "long_term"];
    /* Si el type o time_range no esta en los posibles valores returna error*/
    if (!tipos.includes(type) || !rangos.includes(time_range)) {
        return res.status(400).json({ error: "Parámetros invalidos." });
    }

    const token = req.session.access_token
    if (!token) {
        return res.status(401).json({ error: "No se ha iniciado sesión" });
    }

    console.log("🎧 Solicitud de canciones:");
    console.log("  - Session ID:", req.sessionID);
    console.log("  - Usuario:", req.session.user);
    console.log("  - Token:", req.session.access_token?.slice(0, 20) + "...");


    try {
        const response = await fetch(`https://api.spotify.com/v1/me/top/${type}?time_range=${time_range}&limit=50`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.error) {
            console.error("Error desde spotify:", data.error);
            return res.status(response.status).json({ error: data.error.message });
        }

        res.json(data);
    } catch (error) {
        console.error("Error en el servidor al pedir datos", error);
        res.status(500).json({ error: "Error interno del servidor." })
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://127.0.0.1:${PORT}`)
    console.log("REDIRECT_URI en uso:", RedirectUri);
});