document.addEventListener('DOMContentLoaded', function() {
    var usuarioLogueado = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
    
    // Rellenar los campos del formulario con la información actual del usuario
    document.getElementById('correo').value = usuarioLogueado.correo;   // Solo mostrar, no editable
    document.getElementById('edad').value = usuarioLogueado.edad;       // Solo mostrar, no editable
    document.getElementById('genero').value = usuarioLogueado.genero;   // Solo mostrar, no editable
    document.getElementById('ciudad').value = usuarioLogueado.ciudad;
    document.getElementById('lat').value = usuarioLogueado.lat;         // Solo mostrar, no editable
    document.getElementById('lon').value = usuarioLogueado.lon;       // Solo mostrar, no editable

    //******BOTONES********    
    botonCerrarSesion = document.getElementById("botonCerrarSesion");
    botonAtras = document.getElementById("atrasBtn");
    botonInicio = document.getElementById("botonInicio");
    botonGuardarPerfil = document.getElementById("guardarPerfilBtn");
    
    dropZone = document.getElementById("dropZone");
    previewImage = document.getElementById('previewImage');
    fotoInput = document.getElementById('foto');
    fotoPerfil = document.getElementById('fotoPerfil');
    nombrePerfil = document.getElementById('nombrePerfil');
    
    var fotoGenero;
    if (usuarioLogueado.genero === 'H') {
        fotoGenero = 'img/avatar001.png';
    } else if (usuarioLogueado.genero === 'M') {
        fotoGenero = 'img/avatar002.png';
    }

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
    
    // Si el usuario tiene una foto, se muestra; de lo contrario, se coloca una imagen por defecto
    fotoPerfil.src = usuarioLogueado.foto || fotoGenero;
    nombrePerfil.textContent = usuarioLogueado.nombre;
    
    // Evento para resaltar cuando se arrastra algo sobre el área
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault(); // Evitar el comportamiento predeterminado
        dropZone.classList.add('hover'); // Agrega una clase de estilo para resaltar
    });
    
    // Evento para quitar el resaltado cuando se deja de arrastrar
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('hover');
    });
    
    //******* CONVERTIR A BASE 64 **************************
    function convertirArchivoABase64(file, callback) {
        reader = new FileReader();

        reader.onload = function (event) {
            callback(event.target.result);  // Llama al callback con el resultado base64
        };

        reader.onerror = function (error) {
            console.error("Error al leer el archivo:", error);
            callback(null);
        };   
    
        reader.readAsDataURL(file);  // Convierte el archivo a base64
    }
    
    dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('hover');
    // Obtener el archivo arrastrado
    const file = event.dataTransfer.files[0];
        if (file) {
            convertirArchivoABase64(file, function (base64) {
                if (base64) {
                    previewImage.src = base64; // Actualiza la imagen de vista previa
                    usuarioLogueado.foto = base64; // Almacena en el objeto del usuario
                } else {
                    alert("Error al procesar la imagen. Inténtalo nuevamente.");
                }
            });
        }
    });
    
    // Evento para manejar la selección de archivo
    fotoInput.addEventListener('change', function () {
        const file = fotoInput.files[0]; // Obtén el archivo seleccionado
        if (file) {
            convertirArchivoABase64(file, function (base64) {
                if (base64) {
                    previewImage.src = base64; // Actualiza la vista previa
                    usuarioLogueado.foto = base64; // Almacena la foto en el usuario
                } else {
                    alert("Error al procesar la imagen. Inténtalo nuevamente.");
                }
            });
        }
    });
    
    botonGuardarPerfil.addEventListener('click', function (event) {
        event.preventDefault(); // Evitar recargar la página

        // Recopilar los datos del formulario
        ciudad = document.getElementById('ciudad').value;
        lat = document.getElementById('lat').value;
        lon = document.getElementById('lon').value;

        // Validaciones
        if (!ciudad) {
            alert("Por favor, completa todos los campos obligatorios.");
            return;
        }

        // Abrir la base de datos y actualizar el registro
        var solicitud = indexedDB.open("vitomaite02", 1);
        
        solicitud.onerror = function (event) {
            console.error("Error al abrir la base de datos: ", event.target.error);
            alert("Hubo un error al acceder a la base de datos.");
        };
        
        solicitud.onsuccess = function (evento) {
            var db = evento.target.result;
            
            // Verifica que el object store exista
            if (!db.objectStoreNames.contains('Usuario')) {
                console.error("El object store 'Usuario' no existe.");
                return;}
            
            var transaction = db.transaction(["Usuario"], "readwrite");
            var usuariosStore = transaction.objectStore("Usuario");
            
            // Obtener el registro del usuario logueado para actualizar
            var solicitudUsuario = usuariosStore.index("correo").get(usuarioLogueado.correo);
            
            solicitudUsuario.onsuccess = function () {
                usuario = solicitudUsuario.result;

                if (usuario) {
                    // Actualizar los datos
                    usuario.ciudad = ciudad;
                    usuario.lat = lat;
                    usuario.lon = lon;
                    
                    if(usuario.ciudad === "Vitoria"){
                        usuario.lat = 42.84289080376465;
                        usuario.lon = -2.6689341801117163;
                    }
                    
                    else if(usuario.ciudad === "Bilbo"){
                        usuario.lat = 43.26647505804694;
                        usuario.lon = -2.9495191420208573;
                    }
                    
                    else if(usuario.ciudad === "Donosti"){
                        usuario.lat = 43.315639319770995;
                        usuario.lon = -1.9884508671230823;                    
                    }
                    
                    else{
                        alert("Ciudad errónea");
                    }

                    // Actualizar la foto (file) si se seleccionó una nueva
                    foto = document.getElementById('foto').files;
                    if (usuarioLogueado.foto){
                        usuario.foto = usuarioLogueado.foto;
                    }
                    guardarUsuario(usuario, usuariosStore);
                }
            };
        };       
                // Función para guardar el usuario actualizado
        function guardarUsuario(usuario, store) {
            solicitudActualizacion = store.put(usuario);

            solicitudActualizacion.onsuccess = function () {
                alert("Perfil actualizado correctamente.");
                    // Actualizar datos en sessionStorage
                    sessionStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
                    window.location.reload();
                
            };

            solicitudActualizacion.onerror = function () {
                console.error("Error al actualizar el perfil.");
                alert("Error al actualizar el perfil. Inténtalo nuevamente.");
            };
        }
    });
    });