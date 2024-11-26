document.addEventListener('DOMContentLoaded', function() {
    
    document.getElementById('formulario-inicioSesion').addEventListener('submit', function(event) {
        event.preventDefault(); 
        iniciarSesion();
    });
});

    botonAtras = document.getElementById("atrasBtn");
 
    botonAtras.addEventListener('click', function() {
        window.location.href = 'index.html';
    });

function iniciarSesion() {
    
    const email = document.getElementById('email2').value;
    const password = document.getElementById('password2').value;

    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        alert('El correo electrónico no tiene un formato válido.');
        return;
    }

    
    var abrir = indexedDB.open("vitomaite02", 1);

    abrir.onerror = function(event) {
        console.error("Error al abrir la base de datos:", event.target.errorCode);
    };

    abrir.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(["Usuario"], "readonly");
        const userStore = transaction.objectStore("Usuario");

        
        const index = userStore.index("correo");
        const request = index.get(email);

        request.onsuccess = function(event) {
            const user = event.target.result;

            
            if (user) {
                if (user.contrasena === password) {
                    console.log("Inicio de sesión exitoso:", user);
                    
                    
                    sessionStorage.setItem('usuarioLogueado', JSON.stringify(user));
                    window.location.href = 'logueado.html';
                    
                } else {
                    
                    alert('La contraseña es incorrecta.');
                }
            } else {
                
                alert('El correo electrónico no está registrado.');
            }
        };

    };
}

