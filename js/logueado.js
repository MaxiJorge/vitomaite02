document.addEventListener('DOMContentLoaded', function() {
    var usuarioLogueado = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
    botonCerrarSesion = document.getElementById('botonCerrarSesion');
    
    botonCerrarSesion.addEventListener('click', function () {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    var fotoGenero;
    if (usuarioLogueado.genero === 'H') {
        fotoGenero = 'img/avatar001.png';
   } else if (usuarioLogueado.genero === 'M') {
        fotoGenero = 'img/avatar002.png';
    }

    fotoPerfil = document.getElementById('fotoPerfil');
    // Si el usuario tiene una foto, se muestra; de lo contrario, se coloca una imagen por defecto
    fotoPerfil.src = usuarioLogueado.foto || fotoGenero;
    
    // Mostrar saludo personalizado
    const saludoDiv = document.getElementById('saludo');
    saludoDiv.textContent = `Hola, ${usuarioLogueado.nombre}`;

    document.getElementById('buscar').addEventListener('click', function() {
        window.location.href = 'buscarLogueado.html';
    });
    
    document.getElementById('GeolocalizadoBtn').addEventListener('click', function() {
        window.location.href = 'busquedaGeolocalizada.html';
    });
    
    document.getElementById('AficionesBtn').addEventListener('click', function() {
        window.location.href = 'busquedaAficiones.html';
    });
    
    // Redirigir al buscarLogueado.html
    document.getElementById('Perfil').addEventListener('click', function() {
        window.location.href = 'editarPerfil.html';
    });
    
     // Redirigir al verAficiones.html
    document.getElementById('verAficiones').addEventListener('click', function() {
        window.location.href = 'verAficiones.html';
    });
    
     // Redirigir al buscarLogueado.html
    document.getElementById('editarAficiones').addEventListener('click', function() {
        window.location.href = 'editarAficiones.html';
    });
    
    // Mostrar/ocultar mis likes
    document.getElementById('misLikes').addEventListener('click', function() {
        toggleLikes();
    });
    
    
    // Función para mostrar u ocultar los likes
    function toggleLikes() {
        const tablaLikesSeccion = document.getElementById('tablaLikesSeccion');
        
        // Si la tabla está visible, la ocultamos, si no está visible, la mostramos
        if (tablaLikesSeccion.style.display === 'block') {
            tablaLikesSeccion.style.display = 'none';
        } else {
            // Mostrar tabla y llenar con datos
            mostrarMisLikes();
            tablaLikesSeccion.style.display = 'block';
        }
    }

    // Función para mostrar los likes que recibió el usuario
    function mostrarMisLikes() {
        const abrir = indexedDB.open("vitomaite02", 1);

        abrir.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(["MeGusta"], "readonly");
            const meGustaStore = transaction.objectStore("MeGusta");

            // Obtener todos los registros de likes
            const request = meGustaStore.getAll();

            request.onsuccess = function(event) {
                const likes = event.target.result;
                const tablaLikes = document.getElementById('tabla-likes');
                tablaLikes.innerHTML = ''; // Limpiar tabla

                // Filtrar los likes que el usuario ha recibido
                likes.forEach(like => {
                    if (like.user2 === usuarioLogueado.correo) {
                        const fila = document.createElement('tr');
                        fila.innerHTML = `
                            <td>${like.fecha || 'Fecha desconocida'}</td>
                            <td>${like.user1}</td>
                        `;
                        tablaLikes.appendChild(fila);
                    }
                });
            };
        };
    }
    
});

document.getElementById('verMatchesBtn').addEventListener('click', function() {
    toggleMatches();
});

// Función para mostrar u ocultar los matches
function toggleMatches() {
    const tablaMatchesSeccion = document.getElementById('tablaMatchesSeccion');
    
    // Si la tabla está visible, la ocultamos, si no está visible, la mostramos
    if (tablaMatchesSeccion.style.display === 'block') {
        tablaMatchesSeccion.style.display = 'none';
    } else {
        // Mostrar tabla y llenar con datos
        mostrarMisMatches();
        tablaMatchesSeccion.style.display = 'block';
    }
}

// Función para mostrar los matches que tiene el usuario logueado
function mostrarMisMatches() {
    const usuarioLogueado = JSON.parse(sessionStorage.getItem("usuarioLogueado"));
    const emailLogueado = usuarioLogueado.correo;

    const abrir = indexedDB.open("vitomaite02", 1);

    abrir.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(["MeGusta"], "readonly");
        const meGustaStore = transaction.objectStore("MeGusta");

        // Obtener todos los registros de likes
        const request = meGustaStore.getAll();

        request.onsuccess = function(event) {
            const matches = event.target.result;
            const tablaMatches = document.getElementById('tabla-matches');
            tablaMatches.innerHTML = ''; // Limpiar la tabla antes de llenarla

            // Filtrar los matches donde el usuario logueado está involucrado
            matches.forEach(match => {
                if ((match.user1 === emailLogueado || match.user2 === emailLogueado) && match.estado === "2") {
                    const otroUsuario = (match.user1 === emailLogueado) ? match.user2 : match.user1;
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${match.fechaMatch || 'Fecha desconocida'}</td>
                        <td>${otroUsuario}</td>
                    `;
                    tablaMatches.appendChild(fila);
                }
            });
        };
    };
}

