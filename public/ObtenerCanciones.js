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
        const estadisticas = canciones.items;

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

        const totalReps = Object.values(repeticiones).reduce((total, actual) => total + actual.repit, 0);

        const artistasOrdenados = Object.values(repeticiones)
            .map(artist => ({
                ...artist,
                porcentaje: (artist.repit / totalReps) * 100
            }))
            .sort((a, b) => b.porcentaje - a.porcentaje);

        const top = artistasOrdenados.slice(0, 7);
        const otros = artistasOrdenados.slice(7);

        const tituloTop = document.createElement("h3");
        tituloTop.textContent = "Artistas más escuchados";
        tituloTop.style.textAlign = "center"
        tituloTop.style.fontSize = "29px"
        contenedor.appendChild(tituloTop);
        const vacio = document.createElement("div")
        vacio.id = "hola"
        top.forEach(artist => {
            const p = document.createElement("p");
            p.textContent = `${artist.name} - ${artist.porcentaje.toFixed(2)}%`;
            vacio.appendChild(p)
        });
        
        const porcentajeOtros = otros.reduce((acc, artist) => acc + artist.porcentaje, 0).toFixed(2);
        
        const pOtros = document.createElement("p");
        pOtros.textContent = `Otros artistas - ${porcentajeOtros}%`;
        vacio.appendChild(pOtros);
        contenedor.appendChild(vacio);

    } catch (error) {
        console.error("No se cargaron canciones:", error);
    }
};

ObtenerCanciones();