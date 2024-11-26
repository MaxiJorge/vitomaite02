document.addEventListener('DOMContentLoaded', function() {
    // Recuperamos los datos del usuario logueado
    var usuarioLogueado = JSON.parse(sessionStorage.getItem('usuarioLogueado'));

    if (usuarioLogueado) {
        console.log("Usuario logueado:", usuarioLogueado);
        
        // Llamamos a la función para obtener las aficiones del usuario
        obtenerAficiones(usuarioLogueado.correo);
    } else {
        console.log('No hay usuario logueado');
    }
});

    botonCerrarSesion = document.getElementById("botonCerrarSesion");
    botonAtras = document.getElementById("atrasBtn");
    botonInicio = document.getElementById("botonInicio");
    
    botonCerrarSesion.addEventListener('click', function() {
        sessionStorage.clear();
        window.location.href = 'index.html';    
    });
 
    botonAtras.addEventListener('click', function() {
        window.location.href = 'logueado.html';
    });
    
    botonInicio.addEventListener('click', function() {
        window.location.href = 'logueado.html';
    });

// Función para obtener las aficiones del usuario logueado
function obtenerAficiones(correoUsuario) {
    var abrir = indexedDB.open("vitomaite02", 1);

    abrir.onerror = function(event) {
        console.error("Error al abrir la base de datos:", event.target.errorCode);
    };

    abrir.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(["Usuario_Aficion", "Afición"], "readonly");
        
        // Accedemos a las dos stores necesarias
        const usuarioAficionStore = transaction.objectStore("Usuario_Aficion");
        const aficionStore = transaction.objectStore("Afición");

        // Buscamos las aficiones del usuario en la store Usuario_Aficion
        const index = usuarioAficionStore.index("email");
        const request = index.openCursor(IDBKeyRange.only(correoUsuario));

        let aficionesIds = [];

        request.onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                aficionesIds.push(cursor.value.aficion); // Guardamos los IDs de las aficiones
                cursor.continue(); // Continuamos buscando más aficiones si existen
            } else {
                // Una vez que tenemos todos los IDs de las aficiones, buscamos sus nombres
                obtenerNombresAficiones(aficionesIds, aficionStore);
            }
        };
    };
}

// Función para obtener los nombres de las aficiones a partir de sus IDs
function obtenerNombresAficiones(aficionesIds, aficionStore) {
    let aficionesNombres = [];

    // Ahora buscamos los nombres de las aficiones en la store Afición
    aficionesIds.forEach(id => {
        const request = aficionStore.get(id);

        request.onsuccess = function(event) {
            const aficion = event.target.result;
            if (aficion) {
                aficionesNombres.push(aficion.nombre); // Añadimos el nombre de la afición al array
            }

            // Una vez que tenemos todas las aficiones, las mostramos
            if (aficionesNombres.length === aficionesIds.length) {
                mostrarAficiones(aficionesNombres);
            }
        };
    });
}

// Función para mostrar las aficiones en el HTML
function mostrarAficiones(aficionesNombres) {
    const listaAficiones = document.getElementById("listaAficiones");
    listaAficiones.innerHTML = ""; // Limpiar la lista antes de agregar nuevos elementos

    // Añadir las aficiones a la lista
    aficionesNombres.forEach(aficion => {
        const li = document.createElement("li");
        li.textContent = aficion;
        listaAficiones.appendChild(li);
    });
}
