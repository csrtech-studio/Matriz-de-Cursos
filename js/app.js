import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

// Inicializar la aplicación Firebase
const app = initializeApp(firebaseConfig);

// Inicializar la base de datos, autenticación y almacenamiento
const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Exportar las instancias para ser utilizadas en otros archivos
export { db, auth, storage };

document.addEventListener('DOMContentLoaded', () => {
  // Obtener elementos del DOM
  const addCourseBtn = document.getElementById('add-course-btn');
  const cursosList = document.getElementById('cursos-list');
  const advertenciasList = document.getElementById('advertencias-list');
  const logoutBtn = document.getElementById('logout');

  // Redirigir a agregar-curso.html al hacer clic en el botón
  if (addCourseBtn) {
    addCourseBtn.addEventListener('click', () => {
      window.location.href = 'agregarCurso.html';
    });
  } else {
    console.error('Botón de agregar curso no encontrado');
  }

  // Función para cargar los cursos desde Firebase
  function loadCourses() {
    onValue(ref(db, 'cursos'), snapshot => {
      cursosList.innerHTML = ''; // Limpiar la lista de cursos

      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const curso = childSnapshot.val();
          const cursoId = childSnapshot.key;  // Obtener el ID del curso
          const empresa = curso.empresa || 'Sin Datos';
          const tecnicos = Array.isArray(curso.tecnicos) ? curso.tecnicos : ['Sin Datos'];
          const municipio = curso.municipio || 'Sin Datos';
          const vigencia = curso.fecha_vencimiento || 'Sin Datos';

          // Crear una fila de tabla
          const row = document.createElement('tr');

          // Crear celda para la empresa con un enlace
          const empresaCell = document.createElement('td');
          const empresaLink = document.createElement('a');
          empresaLink.href = `detalle-curso.html?id=${cursoId}`;  // Redirigir a detalle-curso.html
          empresaLink.textContent = empresa;
          empresaCell.appendChild(empresaLink);
          row.appendChild(empresaCell);

          // Crear celda para los técnicos
          const tecnicosCell = document.createElement('td');
          tecnicosCell.textContent = tecnicos.join(', ');
          row.appendChild(tecnicosCell);

          // Crear celda para el municipio
          const municipioCell = document.createElement('td');
          municipioCell.textContent = municipio;
          row.appendChild(municipioCell);

          // Crear celda para la vigencia
          const vigenciaCell = document.createElement('td');
          vigenciaCell.textContent = vigencia;
          row.appendChild(vigenciaCell);

          // Añadir la fila al cuerpo de la tabla
          cursosList.appendChild(row);
        });
      } else {
        // Si no hay datos en Firebase
        const noDataRow = document.createElement('tr');
        const noDataCell = document.createElement('td');
        noDataCell.colSpan = 4;
        noDataCell.textContent = 'No hay datos disponibles';
        noDataRow.appendChild(noDataCell);
        cursosList.appendChild(noDataRow);
      }
    });
  }

  // Función para mostrar advertencias de cursos vencidos
  function showAdvertencias() {
    const today = new Date();
    if (advertenciasList) {
      onValue(ref(db, 'cursos'), snapshot => {
        advertenciasList.innerHTML = ''; // Limpiar la lista de advertencias
        snapshot.forEach(childSnapshot => {
          const curso = childSnapshot.val();
          const cursoVencimiento = new Date(curso.fecha_vencimiento);
          if (cursoVencimiento <= today) {
            const advertenciaItem = document.createElement('div');
            advertenciaItem.textContent = `Curso vencido: ${curso.nombre} - Técnico: ${curso.id_tecnico}`;
            advertenciasList.appendChild(advertenciaItem);
          }
        });
      });
    } else {
      console.error('Elemento de advertencias no encontrado');
    }
  }

  // Verificar el estado de autenticación
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userToken = await user.getIdTokenResult();
      const isAdmin = userToken.claims.role === 'admin'; // Asumiendo que usas claims personalizados
      if (isAdmin) {
        showAdminFeatures();
      } else {
        showUserFeatures();
      }
    } else {
      window.location.href = 'login.html'; // Redirige al login si no está autenticado
    }
  });

  // Función para mostrar características del usuario (cursos)
  function showUserFeatures() {
    loadCourses();  // Cargar los cursos para los usuarios regulares
  }

  // Función para mostrar características del administrador (CRUD)
  function showAdminFeatures() {
    // Aquí se agregarían las opciones CRUD para el administrador
  }

  // Funcionalidad de cerrar sesión
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      signOut(auth)
        .then(() => {
          window.location.href = 'login.html'; // Redirige al login después de cerrar sesión
        })
        .catch(error => {
          console.error('Error al cerrar sesión: ', error);
        });
    });
  } else {
    console.error('El botón de cerrar sesión no existe.');
  }

  // Cargar advertencias de cursos vencidos
  showAdvertencias();
});
