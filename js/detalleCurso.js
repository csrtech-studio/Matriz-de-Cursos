import { db } from './app.js';
import { ref, get, update, remove } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

const auth = getAuth();
// Obtener el ID del curso desde la URL
const urlParams = new URLSearchParams(window.location.search);
const cursoId = urlParams.get('id');

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.warn("Usuario no autenticado, redirigiendo a login...");
    window.location.href = "login.html";
  } else {
    console.log("Usuario autenticado:", user);
  }
});

// Cargar los detalles del curso y mostrar técnicos en una tabla
function loadCourseDetails() {
  const cursoDetalleDiv = document.getElementById('curso-detalle');
  const cursoRef = ref(db, `cursos/${cursoId}`);

  get(cursoRef).then(snapshot => {
    if (snapshot.exists()) {
      const curso = snapshot.val();

      // Construir la tabla de técnicos
      let tecnicosTable = `
        <table border="1" style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px; background: #f2f2f2;">Técnico</th>
              <th style="padding: 8px; background: #f2f2f2;">Fecha de Toma</th>
              <th style="padding: 8px; background: #f2f2f2;">Fecha de Vigencia</th>
            </tr>
          </thead>
          <tbody>
      `;

      if (curso.tecnicos && curso.tecnicos.length > 0) {
        curso.tecnicos.forEach((tecnico, index) => {
          tecnicosTable += `
            <tr>
              <td style="padding: 8px; text-align: center;">
                <a href="#" class="delete-tecnico" data-index="${index}" style="color: blue; text-decoration: underline;">
                  ${tecnico.nombre}
                </a>
              </td>
              <td style="padding: 8px; text-align: center;">${tecnico.fechaToma}</td>
              <td style="padding: 8px; text-align: center;">${tecnico.fechaVigencia}</td>
            </tr>
          `;
        });
      } else {
        tecnicosTable += `
          <tr>
            <td colspan="3" style="padding: 8px; text-align: center;">Sin Técnicos Registrados</td>
          </tr>
        `;
      }
      tecnicosTable += `</tbody></table>`;

      // Mostrar la información del curso con la tabla de técnicos
      const formatHora = (hora) => {
        if (!hora) return 'Sin Datos';

        let [horas, minutos] = hora.split(':').map(Number);
        let ampm = horas >= 12 ? 'pm' : 'am';
        horas = horas % 12 || 12; // Convertir 0 a 12 para formato 12 horas
        return `${horas}:${minutos.toString().padStart(2, '0')} ${ampm}`;
      };

      cursoDetalleDiv.innerHTML = `
        <p><strong>Empresa:</strong> ${curso.empresa || 'Sin Datos'}</p>
        <p><strong>Sucursal:</strong> ${curso.sucursal || 'Sin Datos'}</p>
        <p><strong>Dirección:</strong> ${curso.direccion || 'Sin Datos'}</p>
        <p><strong>Contacto:</strong> ${curso.contacto || 'Sin Datos'}</p>
        <p><strong>Teléfono:</strong> ${curso.telefono || 'Sin Datos'}</p>
        <p><strong>Extensión:</strong> ${curso.extension || 'Sin Datos'}</p>
        <p><strong>Correo:</strong> 
        <span id="correo" style="color: #2980b9; text-decoration: underline; cursor: pointer;">${curso.correo || 'Sin Datos'}</span>
        </p>
        <p><strong>Celular:</strong> ${curso.celular || 'Sin Datos'}</p>
        <p><strong>Horario:</strong> ${curso.horario ? formatHora(curso.horario.hora) : 'Sin Datos'}</p>
        <p><strong>Días:</strong> ${curso.horario && curso.horario.dias ? curso.horario.dias.join(', ') : 'Sin Datos'}</p>
        <p><strong>Duración:</strong> ${curso.horario ? `${curso.horario.duracion} horas` : 'Sin Datos'}</p>
        <p><strong>Papelería:</strong> ${curso.papeleria || 'Sin Datos'}</p>
        <p><strong>Equipo de Seguridad:</strong> ${curso.equipoSeguridad ? curso.equipoSeguridad.join(', ') : 'Sin Datos'}</p>
        <p><strong>Documentos:</strong> ${curso.documentos ? curso.documentos.join(', ') : 'Sin Documentos'}</p>
        <p><strong>Técnicos Registrados:</strong></p>
        ${tecnicosTable}
      `;



// Función para copiar el correo al portapapeles
document.getElementById('correo').addEventListener('click', function() {
    const correo = this.textContent; // Obtiene el correo del texto
    
    // Intentamos copiar al portapapeles
    navigator.clipboard.writeText(correo).then(function() {
        // Cuando se haya copiado con éxito
        const message = document.createElement('div');
        message.textContent = 'Correo copiado al portapapeles!';
        message.style.position = 'fixed';
        message.style.top = '20px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.padding = '10px 20px';
        message.style.backgroundColor = '#2ecc71';
        message.style.color = '#fff';
        message.style.borderRadius = '5px';
        message.style.fontSize = '16px';
        message.style.zIndex = '9999';
        document.body.appendChild(message);

        // Elimina el mensaje después de 2 segundos
        setTimeout(() => {
            message.remove();
        }, 2000);
    }).catch(function(error) {
        // En caso de error
        console.error('Error al copiar el correo: ', error);
    });
});

      // Añadir los eventos de eliminación después de cargar los detalles
      const deleteLinks = document.querySelectorAll('.delete-tecnico');
      deleteLinks.forEach(link => {
        link.addEventListener('click', (event) => {
          const index = event.target.getAttribute('data-index'); // Obtener el índice desde el atributo 'data-index'
          confirmDeleteTecnico(index); // Llamar a la función confirmDeleteTecnico
        });
      });
    } else {
      cursoDetalleDiv.innerHTML = '<p>Curso no encontrado.</p>';
    }
  }).catch(error => {
    console.error('Error al cargar los detalles del curso:', error);
  });
}

// Función para confirmar la eliminación del técnico
function confirmDeleteTecnico(index) {
  const confirmDelete = confirm("¿Deseas eliminar al técnico de la lista?");
  if (confirmDelete) {
    deleteTecnico(index);
  }
}

// Función para eliminar un técnico
function deleteTecnico(index) {
  const cursoRef = ref(db, `cursos/${cursoId}`);

  get(cursoRef).then(snapshot => {
    const curso = snapshot.val();
    const tecnicos = curso.tecnicos || [];

    // Eliminar el técnico de la lista
    tecnicos.splice(index, 1);

    update(cursoRef, { tecnicos }).then(() => {
      alert('Técnico eliminado correctamente');
      loadCourseDetails();  // Recargar los detalles del curso
    }).catch(error => {
      console.error('Error al eliminar el técnico:', error);
      alert('Hubo un error al eliminar el técnico.');
    });
  }).catch(error => {
    console.error('Error al obtener los detalles del curso:', error);
  });
}

// Agregar un técnico al curso junto con las fechas de toma y vigencia
const addTecnicoForm = document.getElementById('add-tecnico-form');
addTecnicoForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const tecnicoInput = document.getElementById('tecnico');
  const fechaTomaInput = document.getElementById('fecha-toma');
  const fechaVigenciaInput = document.getElementById('fecha-vigencia');

  const tecnico = tecnicoInput.value.trim();
  const fechaToma = fechaTomaInput.value;
  const fechaVigencia = fechaVigenciaInput.value;

  if (tecnico && fechaToma && fechaVigencia) {
    const cursoRef = ref(db, `cursos/${cursoId}`);

    // Obtener el curso actual y agregar el técnico con sus fechas
    get(cursoRef).then(snapshot => {
      const curso = snapshot.val();
      const tecnicos = curso.tecnicos || [];

      // Agregar el técnico como un objeto con su fecha de toma y vigencia
      tecnicos.push({
        nombre: tecnico,
        fechaToma,
        fechaVigencia
      });

      update(cursoRef, { tecnicos }).then(() => {
        alert('Técnico y fechas agregados correctamente');
        tecnicoInput.value = '';
        fechaTomaInput.value = '';
        fechaVigenciaInput.value = '';
        loadCourseDetails();  // Recargar los detalles del curso
      }).catch(error => {
        console.error('Error al agregar el técnico y fechas:', error);
        alert('Hubo un error al agregar el técnico y las fechas.');
      });
    });
  } else {
    alert('Por favor, ingrese un nombre de técnico y las fechas de toma y vigencia.');
  }
});

// Volver a la página anterior
const backBtn = document.getElementById('back-btn');
backBtn.addEventListener('click', () => {
  window.history.back();
});

// Redirigir al agregarCurso.html con el id del curso
const updateBtn = document.getElementById('update-course-btn');
if (updateBtn) {
  updateBtn.addEventListener('click', () => {
    window.location.href = `agregarCurso.html?id=${cursoId}`;
  });
}

// Cargar los detalles al cargar la página
loadCourseDetails();
