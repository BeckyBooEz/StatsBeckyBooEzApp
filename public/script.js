async function ObtenerCanciones() {
    try {
        const response = await fetch("/api/recently-played");

        if (response.status === 401 && window.location.pathname !== "/login") {
            console.warn("Sesión no iniciada, redirigiendo a login...");
            window.location.href = "/login";
            return;
        }

        const canciones = await response.json();

        const todosLosArtistas = [];
        const estadisticas = canciones.items

        estadisticas.forEach(item => {
            const artistas = item.track.artists;

            const colaboradores = artistas.slice(1);
            const pesosBrutos = colaboradores.map((_, i) => 1 / (i + 1));

            const sumaBruta = pesosBrutos.reduce((a, b) => a + b, 0);
            const pesosNormalizados = pesosBrutos.map(p => (p / sumaBruta) * 0.5);

            artistas.forEach((artista, index) => {
                let peso = 0;

                if (index === 0) {
                    peso = 1.0;
                } else {
                    peso = pesosNormalizados[index - 1];
                }

                todosLosArtistas.push({
                    name: artista.name,
                    id: artista.id,
                    peso: peso
                });
            });
        });

        const repeticiones = {};

        todosLosArtistas.forEach(({ id, name, peso }) => {
            if (!repeticiones[id]) {
                repeticiones[id] = { name, repit: 0 };
            }
            repeticiones[id].repit += peso;
        });

        const contenedor = document.getElementById("content-recently-played-text");
        contenedor.style.display = "flex";
        contenedor.style.flexDirection = "column";

        const totalReps = Object.values(repeticiones).reduce((total, actual) => total + actual.repit, 0);

        const artistasOrdenados = Object.values(repeticiones)
            .map(artist => ({
                ...artist,
                porcentaje: (artist.repit / totalReps) * 100
            }))
            .sort((a, b) => b.porcentaje - a.porcentaje);

        const top4 = artistasOrdenados.slice(0, 9);
        const otros = artistasOrdenados.slice(9);

        const tituloTop = document.createElement("h3");
        tituloTop.textContent = "Artistas más escuchados";
        contenedor.appendChild(tituloTop);

        top4.forEach(artist => {
            const p = document.createElement("p");
            p.textContent = `${artist.name} - (${artist.porcentaje.toFixed(2)}%)`;
            contenedor.appendChild(p);
        });

        const porcentajeOtros = otros.reduce((acc, artist) => acc + artist.porcentaje, 0).toFixed(2);

        const pOtros = document.createElement("p");
        pOtros.textContent = `Otros artistas - (${porcentajeOtros}%)`;
        contenedor.appendChild(pOtros);

    } catch (error) {
        console.error("No se cargaron canciones:", error);
    }
};


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
        mostrarCanciones(data.items);
    } else {
        mostrarArtistas(data.items);
    };
};

async function obteneruser(){
    try {
        const response = await fetch("/api/user/name");

        const data = await response.json()

        const nombreuser= document.getElementById("user-name");
        nombreuser.textContent = data.display_name
        const imguser = document.getElementById("user-image")
        imguser.src = data.images[1].url
        console.log(data)
    } catch (error) {
        console.log("No se pudo cargar user:", error)
    }
}

obteneruser()

function mostrarCanciones(tracks) {
    const container = document.getElementById("results");
    container.innerHTML = "";

    tracks.slice(0, 5).forEach(track => {
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

    const img = document.createElement("img")
    img.src = track.album.images[0].url;
    img.width = 200;
    img.height = 200;
    img.style.objectFit = "cover";

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

    card.appendChild(img);
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
    img.style.objectFit = "cover";

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
        const res = await fetch("/api/recently-played");

        if (res.status === 401 && window.location.pathname !== "/login") {
            console.warn("Sesión no iniciada, redirigiendo a login...");
            window.location.href = "/login";
            return;
        }

        const data = await res.json();
        cancionesRecentlyPlayed(data.items)

    } catch (error) {
        console.error("No se cargaron canciones:", error);
    }
}

function cancionesRecentlyPlayed(tracks) {
    const contenedor = document.getElementById("content-recently-played-img");
    tracks.slice(0, 12).forEach(track => {
        const tarjeta = document.createElement("div")
        tarjeta.classList.add("card-recentyl-played");

        const datostarjeta = document.createElement("div");
        datostarjeta.classList.add("card-info")

        const portada = document.createElement("img");
        portada.src = track.track.album.images[0].url;
        portada.width = 150;
        portada.height = 150;
        portada.style.objectFit = "cover";

        const cancion = document.createElement("h3");
        cancion.textContent = track.track.name;

        const popularidad = document.createElement("p")
        popularidad.textContent = `Pop: ${track.track.popularity}`

        const album = document.createElement("p");
        album.innerHTML = `<strong>Album: </strong> ${track.track.album.name}`;

        const artist = document.createElement("p");
        artist.textContent = track.track.album.artists[0].name
        artist.style.textDecoration = "underline"

        const marcadetiempo = document.createElement("p");
        marcadetiempo.textContent = calcularTiempo(track)

        datostarjeta.appendChild(portada)
        datostarjeta.appendChild(cancion)
        datostarjeta.appendChild(popularidad)
        datostarjeta.appendChild(album);
        datostarjeta.appendChild(artist)
        datostarjeta.appendChild(marcadetiempo)

        tarjeta.appendChild(datostarjeta)
        contenedor.append(tarjeta);
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

    let partes = [];

    if (semanas > 0) partes.push(`${semanas} semana${semanas === 1 ? "" : "s"}`);
    if (dias > 0) partes.push(`${dias} día${dias === 1 ? "" : "s"}`);
    if (horas > 0) partes.push(`${horas} hora${horas === 1 ? "" : "s"}`);
    if (minutos > 0) partes.push(`${minutos} minuto${minutos === 1 ? "" : "s"}`);
    if (segundos > 0 || partes.length === 0) partes.push(`${segundos} segundo${segundos === 1 ? "" : "s"}`);

    return `hace ${partes.slice(0, 2).join(", ")}`;
}
ObtenerCanciones();
recentplayed();
obtenerTop();