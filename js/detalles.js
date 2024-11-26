// Función para obtener el id del usuario desde la URL

    botonCerrarSesion = document.getElementById("botonCerrarSesion");
    botonAtras = document.getElementById("atrasBtn");
    botonInicio = document.getElementById("botonInicio");
    
    botonCerrarSesion.addEventListener('click', function() {
        sessionStorage.clear();
        window.location.href = 'index.html';    
    });
 
    botonAtras.addEventListener('click', function() {
        window.location.href = 'buscarLogueado.html';
    });
    
    botonInicio.addEventListener('click', function() {
        window.location.href = 'logueado.html';
    });
    
function obtenerIdDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Función para inicializar el mapa de Google
function initMap(lat, lng) {
    const mapContainer = document.createElement("div");
    mapContainer.id = "map";
    mapContainer.style.height = "300px";
    mapContainer.style.width = "100%";

    // Agregar el contenedor del mapa debajo de los detalles del usuario
    const detallesDiv = document.getElementById("detallesUsuario");
    detallesDiv.appendChild(mapContainer);

    // Inicializar el mapa
    const map = new google.maps.Map(mapContainer, {
        zoom: 14,
        center: { lat, lng }
    });

    // Agregar un marcador para la ubicación del usuario
    new google.maps.Marker({
    position: { lat, lng },
    map,
    title: "Ubicación del Usuario",
    icon: {
        path: google.maps.SymbolPath.CIRCLE, // Forma circular (puedes cambiar a otras opciones si quieres)
        fillColor: '#808080', // Color gris
        fillOpacity: 1, // Opacidad del relleno (1 es completamente sólido)
        strokeColor: '#808080', // Borde gris
        strokeWeight: 2, // Grosor del borde
        scale: 8 // Tamaño del icono
    }
});

}

// Función para obtener los detalles del usuario desde IndexedDB
function obtenerDetallesUsuario(id) {
    const request = indexedDB.open('vitomaite02', 1); // Abrir la base de datos

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction('Usuario', 'readonly');
        const store = transaction.objectStore('Usuario');
        const userRequest = store.get(id); // Obtener el usuario por su id

        userRequest.onsuccess = function () {
            const usuario = userRequest.result;

            if (usuario) {
                // Actualizar la vista con los detalles del usuario
                actualizarDetallesUsuario(usuario);

                // Mostrar la ubicación del usuario en el mapa
                if (usuario.lat && usuario.lon) {
                    initMap(usuario.lat, usuario.lon);
                } else {
                    console.warn("El usuario no tiene ubicación registrada.");
                }

                // Obtener las aficiones del usuario
                obtenerAficiones(usuario.correo);
            } else {
                console.error("Usuario no encontrado");
            }
        };

        userRequest.onerror = function () {
            console.error("Error al obtener el usuario desde IndexedDB");
        };
    };

    request.onerror = function () {
        console.error("Error al abrir la base de datos IndexedDB");
    };
}

// Función para actualizar los detalles del usuario en el HTML
function actualizarDetallesUsuario(usuario) {
    var detallesDiv = document.getElementById('detallesUsuario');

    // Foto por defecto si no tienen ninguna añadida en IndexedDB
    var fotoUsuario;
    if (usuario.genero === 'H') {
        fotoUsuario = 'img/avatar001.png';
    } else if (usuario.genero === 'M') {
        fotoUsuario = 'img/avatar002.png';
    }

    // Llenar detallesUsuario en HTML
    detallesDiv.innerHTML = `
        <div>
            <img src="${usuario.foto || fotoUsuario}" alt="Foto de ${usuario.nombre}" id="usuarioFoto" />
        </div>
        <h2 id="usuarioNombre">${usuario.nombre}</h2>
        <p id="usuarioEdad">Edad: ${usuario.edad}</p>
        <p id="usuarioGenero">Género: ${usuario.genero === 'H' ? 'Masculino' : 'Femenino'}</p>
        <p id="usuarioCiudad">Ciudad: ${usuario.ciudad}</p>
        <ul id="listaAficiones">
            <!-- Aquí se llenarán las aficiones del usuario -->
        </ul>
    `;
}

// Función para obtener las aficiones del usuario
function obtenerAficiones(correoUsuario) {
    const request = indexedDB.open("vitomaite02", 1); // Abrir la base de datos

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(["Usuario_Aficion", "Afición"], "readonly");

        // Accedemos a las dos stores necesarias
        const usuarioAficionStore = transaction.objectStore("Usuario_Aficion");
        const aficionStore = transaction.objectStore("Afición");

        // Usamos el índice "email" para buscar las aficiones del usuario
        const index = usuarioAficionStore.index("email"); // Accedemos al índice por email
        const requestUsuarioAficion = index.openCursor(IDBKeyRange.only(correoUsuario));

        let aficionesIds = [];

        requestUsuarioAficion.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                aficionesIds.push(cursor.value.aficion); // Guardamos los IDs de las aficiones
                cursor.continue(); // Continuamos buscando más aficiones si existen
            } else {
                // Una vez que tenemos todos los IDs de las aficiones, buscamos sus nombres
                obtenerNombresAficiones(aficionesIds, aficionStore);
            }
        };

        requestUsuarioAficion.onerror = function () {
            console.error("Error al buscar las aficiones del usuario");
        };
    };

    request.onerror = function (event) {
        console.error("Error al abrir la base de datos:", event.target.errorCode);
    };
}

// Función para obtener los nombres de las aficiones a partir de sus IDs
function obtenerNombresAficiones(aficionesIds, aficionStore) {
    let aficionesNombres = [];

    // Ahora buscamos los nombres de las aficiones en la store Afición
    aficionesIds.forEach(id => {
        const request = aficionStore.get(id);

        request.onsuccess = function (event) {
            const aficion = event.target.result;
            if (aficion) {
                aficionesNombres.push(aficion.nombre); // Añadimos el nombre de la afición al array
            }

            // Una vez que tenemos todas las aficiones, las mostramos
            if (aficionesNombres.length === aficionesIds.length) {
                mostrarAficiones(aficionesNombres);
            }
        };

        request.onerror = function () {
            console.error("Error al obtener una afición");
        };
    });
}

// Función para mostrar las aficiones en el HTML
function mostrarAficiones(aficionesNombres) {
    const detallesDiv = document.getElementById('detallesUsuario'); // Aquí es donde estamos mostrando los detalles del usuario

    // Crear un nuevo contenedor para las aficiones
    const aficionesContainer = document.createElement('div');
    aficionesContainer.id = 'aficionesContainer'; // Un ID para el contenedor, por si lo necesitas

    // Crear el título para las aficiones
    const tituloAficiones = document.createElement('h3');
    tituloAficiones.textContent = 'Aficiones';
    aficionesContainer.appendChild(tituloAficiones); // Agregar el título al contenedor de aficiones

    // Crear la lista de aficiones
    const listaAficiones = document.createElement('ul');
    aficionesNombres.forEach(aficion => {
        const li = document.createElement('li');
        li.textContent = aficion;
        listaAficiones.appendChild(li); // Añadir cada afición a la lista
    });

    aficionesContainer.appendChild(listaAficiones); // Añadir la lista al contenedor de aficiones

    // Asegurarse de que las aficiones se agregan al contenedor principal donde ya están los detalles del usuario
    detallesDiv.appendChild(aficionesContainer);
}

// Obtener el id del usuario desde la URL
const usuarioId = obtenerIdDesdeURL();

// Verificar si tenemos un id válido
if (usuarioId) {
    // Obtener los detalles del usuario desde IndexedDB
    obtenerDetallesUsuario(parseInt(usuarioId));
} else {
    console.error("No se encontró el id del usuario");
}

