// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { firebaseConfig } from "./firebaseConfig.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Obtener referencias del DOM
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const errorMessage = document.getElementById("login-error-message");
const submitButton = document.getElementById("login-submit-btn");

// Validar que los elementos existan
if (!loginForm || !emailInput || !passwordInput || !errorMessage || !submitButton) {
  console.error("Error: Elementos del formulario no encontrados en el DOM.");
} else {
  // Evento para enviar el formulario de login
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Evitar recarga de la página

    // Deshabilitar botón para evitar múltiples envíos
    submitButton.disabled = true;
    errorMessage.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validar que los campos no estén vacíos
    if (!email || !password) {
      errorMessage.textContent = "Por favor, ingresa tu correo y contraseña.";
      submitButton.disabled = false;
      return;
    }

    try {
      // Intentar iniciar sesión
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Obtener el rol del usuario desde Firebase Database
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error("No se encontraron datos de usuario.");
      }

      const userData = snapshot.val();
      const role = userData.role || "user"; // Si no tiene rol, asignar "user" por defecto

      // Guardar rol en localStorage
      localStorage.setItem("userRole", role);

      // Redirigir según el rol
      setTimeout(() => {
        if (role === "admin") {
          window.location.href = "index.html"; // Página de admin
        } else {
          window.location.href = "user-dashboard.html"; // Página de usuario normal
        }
      }, 500);

    } catch (error) {
      console.error("Error al iniciar sesión:", error.message);

      // Manejo de errores personalizados
      switch (error.code) {
        case "auth/wrong-password":
          errorMessage.textContent = "Contraseña incorrecta.";
          break;
        case "auth/user-not-found":
          errorMessage.textContent = "No se encontró una cuenta con este correo.";
          break;
        case "auth/invalid-email":
          errorMessage.textContent = "Correo electrónico no válido.";
          break;
        case "auth/network-request-failed":
          errorMessage.textContent = "Error de conexión. Verifica tu red.";
          break;
        default:
          errorMessage.textContent = "Error al iniciar sesión. Inténtalo nuevamente.";
      }
    } finally {
      // Habilitar el botón nuevamente y limpiar la contraseña
      submitButton.disabled = false;
      passwordInput.value = "";
    }
  });
}
