async function obtenerUser() {
    try {
        const response = await fetch("/api/user/name");

        const data = await response.json()

        const nombreuser = document.getElementById("user-name");
        nombreuser.textContent = data.display_name
        const imguser = document.getElementById("user-image")
        imguser.src = data.images[0].url
        const usertype = document.getElementById("user-type");
        const usertypemayus = data.product.charAt(0).toUpperCase() + data.product.slice(1).toLowerCase();
        usertype.textContent = usertypemayus;

    } catch (error) {
        console.log("No se pudo cargar user:", error)
    }
};

obtenerUser();