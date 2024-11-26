document.addEventListener('DOMContentLoaded', function () {
    const usuarioLogueado = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
      
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
    
    const dbRequest = indexedDB.open("vitomaite02", 1);

    dbRequest.onerror = function (event) {
        console.error("Error al abrir la base de datos:", event.target.errorCode);
    };

    dbRequest.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(["Usuario_Aficion", "Afición"], "readonly");
        const usuarioAficionStore = transaction.objectStore("Usuario_Aficion");
        const aficionStore = transaction.objectStore("Afición");

        // Obtener las aficiones seleccionadas por el usuario
        const aficionesSeleccionadas = [];
        const requestSeleccionadas = usuarioAficionStore.index("email").openCursor(IDBKeyRange.only(usuarioLogueado.correo));

        requestSeleccionadas.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                const aficionId = cursor.value.aficion;
                const requestAficion = aficionStore.get(aficionId);
                requestAficion.onsuccess = function () {
                    aficionesSeleccionadas.push(requestAficion.result.nombre);
                };
                cursor.continue();
            } else {
                // Ahora cargamos las aficiones no seleccionadas
                cargarAficionesNoSeleccionadas(aficionesSeleccionadas, db);
            }
        };
    };
    
    
    var botonCerrarSesion = document.getElementById('botonCerrarSesion');
    var atrasBtn = document.getElementById("atrasBtn");
    
    botonCerrarSesion.addEventListener('click', function () {

        cerrarSesion();
    });

    function cerrarSesion() {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }

    atrasBtn.addEventListener("click", function () {

        window.location.href = 'logueado.html';

    });


    function cargarAficionesNoSeleccionadas(aficionesSeleccionadas, db) {
        const aficionesNoSeleccionadasList = document.getElementById("no-seleccionadas-list");
        const aficionesSeleccionadasList = document.getElementById("seleccionadas-list");

        const aficionStore = db.transaction("Afición", "readonly").objectStore("Afición");

        const requestAficiones = aficionStore.openCursor();

        requestAficiones.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                const aficion = cursor.value;
                const li = document.createElement("li");
                li.textContent = aficion.nombre;

                if (!aficionesSeleccionadas.includes(aficion.nombre)) {
                    aficionesNoSeleccionadasList.appendChild(li);
                    li.addEventListener("click", function () {
                        agregarAficion(aficion.id, aficion.nombre);
                    });
                } else {
                    aficionesSeleccionadasList.appendChild(li);
                    li.addEventListener("click", function () {
                        eliminarAficion(aficion.id, aficion.nombre);
                    });
                }
                cursor.continue();
            }
        };
    }

    function agregarAficion(aficionId, aficionNombre) {
        const aficionesSeleccionadasList = document.getElementById("seleccionadas-list");
        const aficionesNoSeleccionadasList = document.getElementById("no-seleccionadas-list");

        const li = document.createElement("li");
        li.textContent = aficionNombre;
        aficionesSeleccionadasList.appendChild(li);

        // Añadir el evento para eliminar la afición
        li.addEventListener("click", function () {
            eliminarAficion(aficionId, aficionNombre);
        });

        const items = aficionesNoSeleccionadasList.getElementsByTagName("li");
        for (let item of items) {
            if (item.textContent === aficionNombre) {
                aficionesNoSeleccionadasList.removeChild(item);
                break;
            }
        }
    }

    function eliminarAficion(aficionId, aficionNombre) {
        const aficionesSeleccionadasList = document.getElementById("seleccionadas-list");
        const aficionesNoSeleccionadasList = document.getElementById("no-seleccionadas-list");

        const li = document.createElement("li");
        li.textContent = aficionNombre;
        aficionesNoSeleccionadasList.appendChild(li);

        // Añadir el evento para agregar la afición
        li.addEventListener("click", function () {
            agregarAficion(aficionId, aficionNombre);
        });

        const items = aficionesSeleccionadasList.getElementsByTagName("li");
        for (let item of items) {
            if (item.textContent === aficionNombre) {
                aficionesSeleccionadasList.removeChild(item);
                break;
            }
        }
    }

    // Guardar cambios y redirigir
    document.getElementById("guardar-cambios").addEventListener("click", function () {
        const aficionesSeleccionadasList = document.getElementById("seleccionadas-list");
        const aficionesSeleccionadas = [];

        for (let li of aficionesSeleccionadasList.getElementsByTagName("li")) {
            aficionesSeleccionadas.push(li.textContent);
        }

        const dbRequest = indexedDB.open("vitomaite02", 1);
        dbRequest.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(["Usuario_Aficion"], "readwrite");
            const store = transaction.objectStore("Usuario_Aficion");

            // Primero, eliminamos todas las aficiones del usuario actual
            const index = store.index("email");
            const request = index.openCursor(IDBKeyRange.only(usuarioLogueado.correo));

            request.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                } else {
                    // Luego, agregamos las nuevas aficiones seleccionadas
                    agregarNuevasAficiones(db, aficionesSeleccionadas);
                }
            };
        };
    });

    function agregarNuevasAficiones(db, aficionesSeleccionadas) {
        const transaction = db.transaction(["Afición", "Usuario_Aficion"], "readwrite");
        const aficionStore = transaction.objectStore("Afición");
        const usuarioAficionStore = transaction.objectStore("Usuario_Aficion");

        aficionesSeleccionadas.forEach(aficion => {
            const requestAficion = aficionStore.index("nombre").get(aficion);
            requestAficion.onsuccess = function () {
                if (requestAficion.result) {
                    usuarioAficionStore.add({ email: usuarioLogueado.correo, aficion: requestAficion.result.id });
                }
            };
        });

        // Redirigir al usuario a logueado.html después de guardar
        transaction.oncomplete = function () {
            window.location.href = 'logueado.html';
        };
    }
});
