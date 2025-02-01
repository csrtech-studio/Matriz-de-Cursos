import { getDatabase, ref, push, set, update, get } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Referencias a elementos del DOM
const form = document.getElementById("add-course-form");
const loadingIndicator = document.getElementById("loading-indicator");
const submitButton = document.getElementById("submit-btn");
const backButton = document.getElementById("back-btn");

let courseIdToEdit = null;  // Variable para almacenar el ID del curso a editar

// Verificar autenticación
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.warn("Usuario no autenticado, redirigiendo a login...");
    window.location.href = "login.html";
  } else {
    console.log("Usuario autenticado:", user);
  }
});

// Función para obtener valores del formulario
const obtenerValoresFormulario = () => {
  const diasSeleccionados = [];
  document.querySelectorAll('input[name="dias"]:checked').forEach((checkbox) => {
    diasSeleccionados.push(checkbox.value);
  });

  return {
    empresa: document.getElementById("empresa").value.trim(),
    sucursal: document.getElementById("sucursal").value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    municipio: document.getElementById("municipio").value.trim(),
    contacto: document.getElementById("contacto").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    extension: document.getElementById("extension").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    celular: document.getElementById("celular").value.trim(),
    horario: {
      dias: diasSeleccionados,
      hora: document.getElementById("hora").value.trim(),
      duracion: document.getElementById("duracion").value.trim(),
    },
    papeleria: document.getElementById("papeleria").value.trim().split("\n").join(" - "),
    equipoSeguridad: Array.from(document.getElementById("equipoSeguridad").selectedOptions).map(opt => opt.value),
  };
};

// Función para cargar los datos del curso a editar
const cargarDatosCurso = async (courseId) => {
  try {
    const courseRef = ref(database, "cursos/" + courseId);
    const snapshot = await get(courseRef);
    
    if (snapshot.exists()) {
      const courseData = snapshot.val();

      // Llenar los datos en el formulario
      document.getElementById("empresa").value = courseData.empresa;
      document.getElementById("sucursal").value = courseData.sucursal;
      document.getElementById("direccion").value = courseData.direccion;
      document.getElementById("municipio").value = courseData.municipio;
      document.getElementById("contacto").value = courseData.contacto;
      document.getElementById("telefono").value = courseData.telefono;
      document.getElementById("extension").value = courseData.extension;
      document.getElementById("correo").value = courseData.correo;
      document.getElementById("celular").value = courseData.celular;
      document.getElementById("hora").value = courseData.horario.hora;
      document.getElementById("duracion").value = courseData.horario.duracion;
      document.getElementById("papeleria").value = courseData.papeleria;

      // Marcar los días seleccionados
      courseData.horario.dias.forEach((dia) => {
        const checkbox = document.getElementById(dia.toLowerCase());
        if (checkbox) checkbox.checked = true;
      });

      // Marcar el equipo de seguridad
      courseData.equipoSeguridad.forEach((equipo) => {
        const option = document.querySelector(`#equipoSeguridad option[value="${equipo}"]`);
        if (option) option.selected = true;
      });

      // Cambiar a modo actualización
      courseIdToEdit = courseId;
      submitButton.textContent = "Actualizar curso"; // Cambiar texto del botón
    } else {
      alert("Curso no encontrado.");
    }
  } catch (error) {
    console.error("Error al obtener los datos del curso:", error);
  }
};

// Evento para agregar o actualizar el curso
const manejarFormulario = async (e) => {
  e.preventDefault();

  // Obtener valores del formulario
  const formData = obtenerValoresFormulario();

  // Validar formulario
  if (!validarFormulario(formData)) return;

  loadingIndicator.style.display = "block";
  submitButton.disabled = true;

  try {
    if (courseIdToEdit) {
      // Actualizar curso en la base de datos
      await update(ref(database, "cursos/" + courseIdToEdit), formData);
      alert("Curso actualizado exitosamente");
      window.location.replace("index.html");
    } else {
      // Generar clave única para el curso
      const courseRef = push(ref(database, "cursos"));
      await set(courseRef, formData);
      alert("Curso agregado exitosamente");
    }

    // Resetear formulario
    form.reset();
    submitButton.textContent = "Agregar curso"; // Restaurar botón a "Agregar curso"
    courseIdToEdit = null; // Limpiar el ID del curso

  } catch (error) {
    console.error("Error al guardar el curso:", error);
    alert("Ocurrió un error. Inténtalo nuevamente.");
  } finally {
    loadingIndicator.style.display = "none";
    submitButton.disabled = false;
  }
};

// Validar formulario
const validarFormulario = (data) => {
  if (
    !data.empresa ||
    !data.sucursal ||
    !data.direccion ||
    !data.municipio ||
    !data.contacto ||
    !data.telefono ||
    !data.correo ||
    !data.celular ||
    !data.horario.dias.length ||
    !data.horario.hora ||
    !data.horario.duracion ||
    !data.papeleria
  ) {
    alert("Por favor, completa todos los campos obligatorios.");
    return false;
  }
  return true;
};

// Evento para volver
backButton.addEventListener("click", () => window.history.back());

// Manejar el envío del formulario
form.addEventListener("submit", manejarFormulario);

// Cargar datos si es un curso existente
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get("id");  // Obtener el ID del curso desde la URL
if (courseId) cargarDatosCurso(courseId);
