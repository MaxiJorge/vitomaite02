// Coordenadas de referencia (en este caso, las del usuario logueado)
let latRef, lonRef;

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
    
// Función para calcular la distancia entre dos puntos geográficos usando Haversine
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en kilómetros
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en kilómetros
}

// Inicializar el mapa
function initMap() {
    // Intentar obtener la ubicación del usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            latRef = position.coords.latitude;
            lonRef = position.coords.longitude;

            // Crear el mapa centrado en la latitud y longitud del usuario
            const map = new google.maps.Map(document.getElementById("map"), {
                zoom: 14, // Cambia el nivel de zoom
                center: { lat: latRef, lng: lonRef }
            });

            // Crear un marcador en la ubicación del usuario logueado (Rojo)
            const userMarker = new google.maps.Marker({
                position: { lat: latRef, lng: lonRef },
                map,
                title: "Tu ubicación",
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: 'red',  // Rojo para el usuario logueado
                    fillOpacity: 1,
                    strokeColor: 'red',
                    strokeWeight: 2,
                    scale: 10  // Ajusta el tamaño del marcador
                }
            });
            
            // Crear InfoWindow para mostrar la ubicación del usuario
            const userInfoWindow = new google.maps.InfoWindow({
                content: `<div style="font-size:14px;">
                            <strong>Tu ubicación</strong><br>
                            Lat: ${latRef}, Lon: ${lonRef}
                          </div>`
            });

            // Evento para mostrar la InfoWindow al pasar el mouse sobre el marcador
            userMarker.addListener("mouseover", () => {
                userInfoWindow.open(map, userMarker);
            });

            // Evento para cerrar la InfoWindow al salir del marcador
            userMarker.addListener("mouseout", () => {
                userInfoWindow.close();
            });

            // Dibujar un círculo indicando el radio
            const radioSeleccionado = document.getElementById('radio-range').value;
            new google.maps.Circle({
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.2,
                map,
                center: { lat: latRef, lng: lonRef },
                radius: radioSeleccionado * 1000 // Convertir km a metros
            });

            // Filtrar los puntos dentro del radio seleccionado desde IndexedDB
            obtenerUsuariosCercanos(latRef, lonRef, radioSeleccionado, map);

        }, () => {
            alert("No se pudo obtener la ubicación del usuario.");
        });
    } else {
        alert("La geolocalización no está soportada por este navegador.");
    }
}

// Función para obtener los usuarios cercanos de la base de datos IndexedDB
function obtenerUsuariosCercanos(latRef, lonRef, radioSeleccionado, map) {
    // Abrir la base de datos "vitomaite02"
    var request = indexedDB.open("vitomaite02", 1);

    // Si la base de datos se abre correctamente
    request.onsuccess = function(event) {
        var db = event.target.result; // Obtener la base de datos

        // Iniciar una transacción de solo lectura sobre el object store "Usuario"
        var transaction = db.transaction(["Usuario"], "readonly");
        var userStore = transaction.objectStore("Usuario");

        // Obtener todos los usuarios
        var getAllRequest = userStore.getAll();

        getAllRequest.onsuccess = function() {
            var usuarios = getAllRequest.result;

            // Filtrar los usuarios dentro del radio seleccionado
            const usuariosDentro = usuarios.filter((usuario) => {
                const distancia = calcularDistancia(latRef, lonRef, usuario.lat, usuario.lon);
                return distancia <= radioSeleccionado;
            });

            // Añadir marcadores para los usuarios dentro del radio
            usuariosDentro.forEach((usuario) => {
                // Aquí, los usuarios tienen un marcador gris por defecto
                const marker = new google.maps.Marker({
                    position: { lat: usuario.lat, lng: usuario.lon },
                    map,
                    title: usuario.nombre,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: '#808080',  // Gris para otros usuarios
                        fillOpacity: 1,
                        strokeColor: '#808080',
                        strokeWeight: 2,
                        scale: 7  // Ajusta el tamaño del marcador
                    }
                });

                // Crear InfoWindow para mostrar información personalizada
                const infoWindowContent = `
                    <div style="font-size:14px;">
                        <strong>${usuario.nombre}</strong><br>
                        Edad: ${usuario.edad} años
                    </div>
                `;
                const infoWindow = new google.maps.InfoWindow({
                    content: infoWindowContent
                });

                // Evento para mostrar la InfoWindow al pasar el mouse sobre el marcador
                marker.addListener("mouseover", () => {
                    infoWindow.open(map, marker);
                });

                // Evento para cerrar la InfoWindow al salir del marcador
                marker.addListener("mouseout", () => {
                    infoWindow.close();
                });

                // Evento para mostrar una alerta al hacer clic en el marcador
                marker.addListener("click", () => {
                    alert(`Has hecho clic en: ${usuario.nombre}\nEdad: ${usuario.edad} años`);
                });
            });
        };

        getAllRequest.onerror = function() {
            console.error("Error al obtener los usuarios de la base de datos.");
        };
    };

    // Si ocurre un error al abrir la base de datos
    request.onerror = function(event) {
        console.error("Error al abrir la base de datos vitomaite02:", event.target.error);
    };
}

// Inicializar el mapa al cargar la página
window.onload = initMap;

// Actualizar el mapa cuando se cambie el valor del rango
document.getElementById('radio-range').addEventListener('input', function() {
    initMap();  // Volver a inicializar el mapa con el nuevo radio
});
