// Importar los módulos necesarios de Firebase
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Obtener el formulario de login y los campos
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const errorMessage = document.getElementById('login-error-message');

// Verificar si los elementos existen antes de acceder a ellos
if (!loginForm || !emailInput || !passwordInput || !errorMessage) {
  console.error("Algunos elementos del formulario no se encuentran en el DOM.");
} else {
  // Evento para enviar el formulario de login
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevenir el comportamiento por defecto

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validar los campos de entrada
    if (!email || !password) {
      errorMessage.textContent = "Por favor ingresa ambos campos: correo y contraseña.";
      return;
    }

    // Iniciar sesión en Firebase Authentication
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Obtener el usuario autenticado
        const user = userCredential.user;

        // Buscar el rol del usuario en la base de datos
        const userRef = ref(db, 'users/' + user.uid);
        get(userRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.val();
              const role = userData.role; // Obtener el rol del usuario

              // Redirigir según el rol
              if (role === 'admin') {
                window.location.href = 'index.html'; // Página de admin
              } else {
                window.location.href = 'user-dashboard.html'; // Página de usuario normal
              }
            } else {
              errorMessage.textContent = 'No se encontraron datos para este usuario.';
            }
          })
          .catch((error) => {
            console.error('Error al obtener los datos del usuario: ', error);
            errorMessage.textContent = 'Error al obtener los datos del usuario.';
          });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessageText = error.message;
        console.error('Error al iniciar sesión: ', errorMessageText);

        // Mostrar mensajes de error personalizados según el código de error
        switch (errorCode) {
          case 'auth/wrong-password':
            errorMessage.textContent = 'La contraseña es incorrecta.';
            break;
          case 'auth/user-not-found':
            errorMessage.textContent = 'No se encontró una cuenta con este correo.';
            break;
          case 'auth/invalid-email':
            errorMessage.textContent = 'El correo electrónico no es válido.';
            break;
          default:
            errorMessage.textContent = 'Error al iniciar sesión. Intenta nuevamente.';
            break;
        }
      });
  });
}
