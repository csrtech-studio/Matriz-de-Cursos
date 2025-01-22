import { db } from './app.js';
import { ref, get, update } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Obtener el ID del curso desde la URL
const urlParams = new URLSearchParams(window.location.search);
const cursoId = urlParams.get('id');

// Cargar los detalles del curso
function loadCourseDetails() {
  const cursoDetalleDiv = document.getElementById('curso-detalle');
  const cursoRef = ref(db, `cursos/${cursoId}`);
  
  get(cursoRef).then(snapshot => {
    if (snapshot.exists()) {
      const curso = snapshot.val();
      cursoDetalleDiv.innerHTML = `
        <p><strong>Empresa:</strong> ${curso.empresa || 'Sin Datos'}</p>
        <p><strong>Sucursal:</strong> ${curso.sucursal || 'Sin Datos'}</p>
        <p><strong>Dirección:</strong> ${curso.direccion || 'Sin Datos'}</p>
        <p><strong>Contacto:</strong> ${curso.contacto || 'Sin Datos'}</p>
        <p><strong>Teléfono:</strong> ${curso.telefono || 'Sin Datos'}</p>
        <p><strong>Correo:</strong> ${curso.correo || 'Sin Datos'}</p>
        <p><strong>Celular:</strong> ${curso.celular || 'Sin Datos'}</p>
        <p><strong>Horario:</strong> ${curso.horario || 'Sin Datos'}</p>
        <p><strong>Días:</strong> ${curso.dias.join(', ') || 'Sin Datos'}</p>
        <p><strong>Duración:</strong> ${curso.duracion || 'Sin Datos'}</p>
      `;
    } else {
      cursoDetalleDiv.innerHTML = '<p>Curso no encontrado.</p>';
    }
  }).catch(error => {
    console.error('Error al cargar los detalles del curso:', error);
  });
}

// Agregar un técnico al curso
const addTecnicoForm = document.getElementById('add-tecnico-form');
addTecnicoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const tecnicoInput = document.getElementById('tecnico');
  const tecnico = tecnicoInput.value.trim();
  
  if (tecnico) {
    const cursoRef = ref(db, `cursos/${cursoId}`);
    
    // Obtener el curso actual y agregar el técnico
    get(cursoRef).then(snapshot => {
      const curso = snapshot.val();
      const tecnicos = curso.tecnicos || [];
      tecnicos.push(tecnico);

      update(cursoRef, { tecnicos }).then(() => {
        alert('Técnico agregado correctamente');
        tecnicoInput.value = '';  // Limpiar el campo
        loadCourseDetails();  // Volver a cargar los detalles del curso con el técnico agregado
      }).catch(error => {
        console.error('Error al agregar el técnico:', error);
        alert('Hubo un error al agregar el técnico.');
      });
    });
  } else {
    alert('Por favor, ingrese un nombre de técnico.');
  }
});

// Volver a la página anterior
const backBtn = document.getElementById('back-btn');
backBtn.addEventListener('click', () => {
  window.history.back();
});

// Cargar los detalles al cargar la página
loadCourseDetails();
