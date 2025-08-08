const typeSelect = document.getElementById("type");
const timeSelect = document.getElementById("time_range");

typeSelect.addEventListener("change", obtenerTop);
timeSelect.addEventListener("change", obtenerTop);

async function obtenerTop() {
    const type = typeSelect.value;
    const timeRange = timeSelect.value;

    const res = await fetch(`/api/top?type=${type}&time_range=${timeRange}`);

    if (res.status === 401 && window.location.pathname !== "/login") {
        console.warn("Sesión no iniciada, redirigiendo a login...");
        window.location.href = "/login";
        return;
    }

    const data = await res.json();


    if (type === "tracks") {
        mostrarCanciones(data.items.slice(0, 10));
    } else {
        mostrarArtistas(data.items.slice(0, 10));
    };
};

function mostrarCanciones(tracks) {
    const container = document.getElementById("results");
    container.innerHTML = "";

    tracks.forEach(track => {
        const card = crearCartaCanciones(track)
        const carddatos = document.createElement("div")
        carddatos.classList.add("card-datos-track")

        carddatos.appendChild(card)

        container.appendChild(carddatos)
    });
};

function mostrarArtistas(artists) {
    const container = document.getElementById("results");
    container.innerHTML = "";

    artists.slice(0, 5).forEach(artist => {
        const card = crearCartaArtistas(artist)
        const carddatos = document.createElement("div")
        carddatos.classList.add("card-datos-artist")

        carddatos.appendChild(card)

        container.appendChild(carddatos)
    });
};


function crearCartaCanciones(track) {
    const card = document.createElement("div");
    card.classList.add("track-card");

    const imgContenedor = document.createElement("div")
    imgContenedor.classList.add("track-card-img")
    const img = document.createElement("img")
    img.src = track.album.images[0].url;
    img.width = 200;
    img.height = 200;

    const cancion = document.createElement("h3");
    cancion.textContent = track.name;

    const artista = document.createElement("p")
    artista.textContent = `Artista: ${track.artists[0].name}`;

    const album = document.createElement("p")
    album.textContent = `Album: ${track.album.name}`;

    const duracion = document.createElement("p");
    duracion.textContent = `Duración: ${convertirDuracion(track.duration_ms)}`;

    const popularidad = document.createElement("p");
    popularidad.textContent = `Popularidad: ${track.popularity}`;

    const lanzamiento = document.createElement("p");
    lanzamiento.textContent = `Lanzamiento: ${track.album.release_date}`;

    const url = document.createElement("a");
    url.href = track.external_urls.spotify;
    url.textContent = "Escuchar ahora";
    url.target = "_blank";
    url.style.textDecoration = "none";

    imgContenedor.appendChild(img);
    card.appendChild(imgContenedor)
    card.appendChild(cancion);
    card.appendChild(artista);
    card.appendChild(album);
    card.appendChild(duracion);
    card.appendChild(popularidad);
    card.appendChild(lanzamiento);
    card.appendChild(url);

    return card;
};

function convertirDuracion(durationMs) {
    const totalSegundos = Math.floor(durationMs / 1000);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    const segundosFormateados = segundos.toString().padStart(2, '0');
    return `${minutos}:${segundosFormateados}`;
};

function crearCartaArtistas(artist) {
    const card = document.createElement("div");
    card.classList.add("track-card")

    const img = document.createElement("img")
    img.src = artist.images[0].url;
    img.width = 200;
    img.height = 200;

    const artista = document.createElement("h3")
    artista.textContent = artist.name;

    const popularidad = document.createElement("p")
    popularidad.textContent = `Popularidad: ${artist.popularity}`;

    const url = document.createElement("a")
    url.href = artist.external_urls.spotify;
    url.textContent = "Artista";
    url.target = "_blank";
    url.style.textDecoration = "none";

    card.appendChild(img);
    card.appendChild(artista);
    card.appendChild(popularidad);
    card.appendChild(url)

    return card;
};

async function recentplayed() {
    try {
        const res = await fetch("/api/recently-played")

        if (res.status === 401 && window.location.pathname !== "/login") {
            console.warn("Sesión no iniciada, redirigiendo a login...");
            window.location.href = "/login";
            return;
        }

        const data = await res.json();


        const unicos = data.items.filter((item, index, self) => {
            return self.findIndex(i => i.track.id === item.track.id) === index;
        });

        cancionesRecentlyPlayed(unicos)


    } catch (error) {
        console.error("No se cargaron canciones:", error);
    }
};

function cancionesRecentlyPlayed(tracks) {
    const contenedor = document.getElementById("content-recently-played-tracks");
    tracks.forEach(track => {
        const tarjeta = document.createElement("div")
        tarjeta.classList.add("card-recentyl-played");

        const datostarjeta = document.createElement("div");
        datostarjeta.classList.add("card-info")

        const portadaContainer = document.createElement("div");
        portadaContainer.classList.add("card-img")
        const portada = document.createElement("img");
        portada.src = track.track.album.images[0].url;
        portada.width = 200;
        portada.height = 200;
        portadaContainer.appendChild(portada)

        const datosContainer = document.createElement("div")
        datosContainer.classList.add("card-parrafo")
        const cancion = document.createElement("h3");
        cancion.textContent = track.track.name;

        const popularidad = document.createElement("p")
        popularidad.textContent = `Pop: ${track.track.popularity}`

        const album = document.createElement("p");
        album.innerHTML = track.track.album.name;

        const artist = document.createElement("p");
        artist.textContent = track.track.album.artists[0].name
        artist.style.textDecoration = "underline"

        const marcadetiempo = document.createElement("p");
        marcadetiempo.textContent = calcularTiempo(track)

        datostarjeta.appendChild(portadaContainer)
        datosContainer.appendChild(cancion)
        datosContainer.appendChild(popularidad)
        datosContainer.appendChild(album)
        datosContainer.appendChild(artist);
        datosContainer.appendChild(marcadetiempo)
        datostarjeta.appendChild(datosContainer)

        tarjeta.appendChild(datostarjeta)
        contenedor.appendChild(tarjeta);
    });
}

function calcularTiempo(tracks) {
    const ahora = Date.now();
    const marcaTiempo = new Date(tracks.played_at).getTime();
    const diferencia = ahora - marcaTiempo;

    const segundosTotales = Math.floor(diferencia / 1000);

    const semanas = Math.floor(segundosTotales / (60 * 60 * 24 * 7));
    const dias = Math.floor((segundosTotales % (60 * 60 * 24 * 7)) / (60 * 60 * 24));
    const horas = Math.floor((segundosTotales % (60 * 60 * 24)) / (60 * 60));
    const minutos = Math.floor((segundosTotales % (60 * 60)) / 60);
    const segundos = segundosTotales % 60;

    if (semanas > 0) return `hace ${semanas} semana${semanas === 1 ? "" : "s"}`;
    if (dias > 0) return `hace ${dias} día${dias === 1 ? "" : "s"}`;
    if (horas > 0) return `hace ${horas} hora${horas === 1 ? "" : "s"}`;
    if (minutos > 0) return `hace ${minutos} minuto${minutos === 1 ? "" : "s"}`;
    return `hace ${segundos} segundo${segundos === 1 ? "" : "s"}`;
}

obtenerTop();
recentplayed();