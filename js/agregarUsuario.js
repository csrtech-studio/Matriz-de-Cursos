// Importar los módulos necesarios de Firebase
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Obtener el formulario y los campos
const addUserForm = document.getElementById('add-user-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const roleInput = document.getElementById('role');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

// Evento para enviar el formulario
addUserForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = nameInput.value;
  const email = emailInput.value;
  const role = roleInput.value;
  const password = passwordInput.value;

  // Validar que la contraseña tenga al menos 6 caracteres
  if (password.length < 6) {
    errorMessage.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }

  // Crear usuario en Firebase Authentication
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Obtener el ID del nuevo usuario
      const user = userCredential.user;

      // Guardar los datos del usuario en Firebase Realtime Database
      const userRef = ref(db, 'users/' + user.uid);
      set(userRef, {
        name: name,
        email: email,
        role: role // Guardar el rol del usuario
      })
      .then(() => {
        successMessage.textContent = 'Usuario agregado correctamente';
        errorMessage.textContent = ''; // Limpiar mensaje de error
        addUserForm.reset(); // Limpiar el formulario
      })
      .catch((error) => {
        console.error('Error al agregar el usuario a la base de datos: ', error);
        errorMessage.textContent = 'Error al agregar el usuario a la base de datos';
      });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessageText = error.message;
      console.error('Error al crear el usuario: ', errorMessageText);
      errorMessage.textContent = 'Error al crear el usuario: ' + errorMessageText;
    });
});
