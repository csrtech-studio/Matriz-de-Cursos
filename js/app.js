import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };

document.addEventListener('DOMContentLoaded', () => {
  const addCourseBtn = document.getElementById('add-course-btn');
  const cursosList = document.getElementById('cursos-list');
  const advertenciasList = document.getElementById('advertencias-list');
  const logoutBtn = document.getElementById('logout');
  const sendEmailBtn = document.getElementById('send-email-btn'); // Botón para enviar correo

  let vencidosCount = 0;  // Contador global de cursos vencidos
  let proximosAVencerCount = 0;  // Contador global de cursos próximos a vencer

  if (addCourseBtn) {
    addCourseBtn.addEventListener('click', () => {
      window.location.href = 'agregarCurso.html';
    });
  }

// Filtro de búsqueda
document.getElementById("buscar-btn").addEventListener("click", function () {
  const filtroEmpresa = document.getElementById("buscarEmpresa").value.toLowerCase();
  const filtroMunicipio = document.getElementById("buscarMunicipio").value.toLowerCase();
  const cursosList = document.getElementById('cursos-list');

  console.log('Filtrando por:', filtroEmpresa, filtroMunicipio);

  // Referencia a Firebase
  const cursosRef = ref(db, 'cursos');
  onValue(cursosRef, (snapshot) => {
    cursosList.innerHTML = ''; // Limpiar la tabla antes de cargar los datos filtrados

    if (!snapshot.exists()) {
      cursosList.innerHTML = '<tr><td colspan="4">No hay cursos disponibles</td></tr>';
      return;
    }

    snapshot.forEach((childSnapshot) => {
      const curso = childSnapshot.val();
      const cursoId = childSnapshot.key;

      // Convertir a minúsculas para comparación
      const empresaCurso = (curso.empresa || "").toLowerCase();
      const municipioCurso = (curso.municipio || "").toLowerCase();

      // Filtrar por empresa y municipio
      if (
        (empresaCurso.includes(filtroEmpresa) || filtroEmpresa === "") &&
        (municipioCurso.includes(filtroMunicipio) || filtroMunicipio === "")
      ) {
        console.log('Mostrando curso:', curso);

        // Si no hay técnicos, agregar uno por defecto
        if (!curso.tecnicos || typeof curso.tecnicos !== "object" || Object.keys(curso.tecnicos).length === 0) {
          curso.tecnicos = { 1: { nombre: 'Técnico no asignado', fechaVigencia: Date.now() } };
        }

        // Convertir técnicos en un array
        const tecnicosLista = Object.values(curso.tecnicos);

        tecnicosLista.forEach((tecnico, index) => {
          const row = document.createElement('tr');

          // Si es el primer técnico, añade empresa y municipio con rowspan
          if (index === 0) {
            row.innerHTML = `
              <td rowspan="${tecnicosLista.length}">
                <a href="detalle-empresa.html?id=${cursoId}">${curso.empresa || 'Sin Datos'}</a>
              </td>
              <td rowspan="${tecnicosLista.length}">${curso.municipio || 'Sin Datos'}</td>
            `;
          }

          // Determinar color y etiqueta según fecha de vigencia
          const statusColor = getStatusColor(tecnico.fechaVigencia);
          const statusLabel = getStatusLabel(tecnico.fechaVigencia);

          // Agregar técnico y estado
          row.innerHTML += `
            <td>${tecnico.nombre || 'Sin Datos'}</td>
            <td style="background-color: ${statusColor}; color: black; text-align: center;">
              ${statusLabel}
            </td>
          `;
          cursosList.appendChild(row);
        });
      }
    });
  }, (error) => {
    console.error('Error al obtener cursos:', error);
  });
});

// Evento para el botón "Borrar"
document.getElementById("borrar-btn").addEventListener("click", function() {
  const buscarEmpresaInput = document.getElementById("buscarEmpresa");
  const buscarMunicipioInput = document.getElementById("buscarMunicipio");
  const cursosList = document.getElementById("cursos-list");

  // Limpiar los valores de los inputs
  buscarEmpresaInput.value = "";
  buscarMunicipioInput.value = "";

  // Recargar todos los cursos
  const cursosRef = ref(db, 'cursos');
  onValue(cursosRef, (snapshot) => {
    cursosList.innerHTML = ''; // Limpiar la tabla antes de cargar los datos

    if (!snapshot.exists()) {
      cursosList.innerHTML = '<tr><td colspan="4">No hay cursos disponibles</td></tr>';
      return;
    }

    snapshot.forEach((childSnapshot) => {
      const curso = childSnapshot.val();
      const cursoId = childSnapshot.key;

      const tecnicosLista = Object.values(curso.tecnicos || {});
      tecnicosLista.forEach((tecnico, index) => {
        const row = document.createElement('tr');
        if (index === 0) {
          row.innerHTML = `
            <td rowspan="${tecnicosLista.length}">
              <a href="detalle-empresa.html?id=${cursoId}">${curso.empresa || 'Sin Datos'}</a>
            </td>
            <td rowspan="${tecnicosLista.length}">${curso.municipio || 'Sin Datos'}</td>
          `;
        }
        const statusColor = getStatusColor(tecnico.fechaVigencia);
        const statusLabel = getStatusLabel(tecnico.fechaVigencia);

        row.innerHTML += `
          <td>${tecnico.nombre || 'Sin Datos'}</td>
          <td style="background-color: ${statusColor}; color: black; text-align: center;">
            ${statusLabel}
          </td>
        `;
        cursosList.appendChild(row);
      });
    });
  });
});
  

  /**
   * Cargar la lista de cursos desde Firebase
   */
  async function loadCourses() {
    console.log('Cargando cursos...');
    try {
      const cursosRef = ref(db, 'cursos');
      onValue(cursosRef, (snapshot) => {
        console.log('Datos de cursos recibidos', snapshot.val());
        cursosList.innerHTML = '';
        
        if (!snapshot.exists()) {
          cursosList.innerHTML = '<tr><td colspan="4">No hay cursos disponibles</td></tr>';
          return;
        }

        snapshot.forEach((childSnapshot) => {
          const curso = childSnapshot.val();
          const cursoId = childSnapshot.key;
          console.log('Curso encontrado:', curso);
          
          // Verifica si existen técnicos, de lo contrario agrega un técnico por defecto
          if (!curso.tecnicos || !Array.isArray(curso.tecnicos) || curso.tecnicos.length === 0) {
            curso.tecnicos = [{ nombre: 'Técnico no asignado', fechaVigencia: Date.now() }];
          }

          curso.tecnicos.forEach((tecnico, index) => {
            const row = document.createElement('tr');
            
            // Si es el primer técnico, añade las celdas de empresa y municipio con rowspan
            if (index === 0) {
              row.innerHTML = `
                <td rowspan="${curso.tecnicos.length}">
                  <a href="detalle-empresa.html?id=${cursoId}">${curso.empresa || 'Sin Datos'}</a>
                </td>
                <td rowspan="${curso.tecnicos.length}">${curso.municipio || 'Sin Datos'}</td>
              `;
            }
            
            // Cálculo del color y etiqueta en función de la fecha de vigencia
            const statusColor = getStatusColor(tecnico.fechaVigencia);
            const statusLabel = getStatusLabel(tecnico.fechaVigencia);
            
            // Añadir la información del técnico y el estado del curso
            row.innerHTML += `
              <td>${tecnico.nombre || 'Sin Datos'}</td>
              <td style="background-color: ${statusColor}; color: black; text-align: center;">
                ${statusLabel}
              </td>
            `;
            cursosList.appendChild(row);
          });
        });
        
      }, (error) => {
        console.error('Error al obtener cursos:', error);
      });
    } catch (error) {
      console.error('Error en loadCourses:', error);
    }
  }

  /**
   * Determina el color del estado según la vigencia
   * @param {string} fechaVigencia Fecha de vigencia del curso (formato ISO: YYYY-MM-DD)
   * @returns {string} Color en formato CSS
   */
  function getStatusColor(fechaVigencia) {
    const today = new Date();
    const vencimiento = new Date(fechaVigencia); // Convierte la fecha en objeto Date
    const diffTime = vencimiento - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Días de diferencia
    console.log('Días de diferencia para la fecha de vigencia', diffDays);

    if (diffDays < 0) return 'red'; // Vencido
    if (diffDays <= 30) return 'yellow'; // Por vencer (menos de 1 mes)
    return 'green'; // Vigente
  }

  /**
   * Obtiene la etiqueta de estado del curso
   * @param {string} fechaVigencia Fecha de vigencia del curso (formato ISO: YYYY-MM-DD)
   * @returns {string} Etiqueta de estado
   */
  function getStatusLabel(fechaVigencia) {
    const today = new Date();
    const vencimiento = new Date(fechaVigencia); // Convierte la fecha en objeto Date
    const diffTime = vencimiento - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Días de diferencia
    console.log('Días restantes para la vigencia:', diffDays);

    if (diffDays < 0) return 'Vencido';
    if (diffDays <= 30) return 'Por vencer';
    return 'Vigente';
  }

  /**
   * Mostrar advertencias de cursos vencidos
   */
  function showAdvertencias() {
    console.log('Verificando advertencias...');
    try {
      const today = new Date();

      onValue(ref(db, 'cursos'), (snapshot) => {
        console.log('Datos de cursos para advertencias', snapshot.val());
        advertenciasList.innerHTML = ''; // Limpiar las advertencias previas

        if (!snapshot.exists()) {
          advertenciasList.innerHTML = 'No hay cursos disponibles';
          return;
        }

        snapshot.forEach((childSnapshot) => {
          const curso = childSnapshot.val();
          console.log('Curso encontrado para advertencias:', curso);

          // Verificar la estructura del curso
          if (curso.tecnicos && Array.isArray(curso.tecnicos)) {
            curso.tecnicos.forEach((tecnico) => {
              const fechaVigencia = new Date(tecnico.fechaVigencia); // Fecha de vigencia del técnico
              console.log('Técnico:', tecnico.nombre, 'Fecha de vigencia:', fechaVigencia);

              // Contar los técnicos con fecha de vigencia vencida
              if (fechaVigencia <= today) {
                const item = document.createElement('div');
                item.textContent = `Curso vencido: Técnico: ${tecnico.nombre || 'Desconocido'} - Empresa: ${curso.empresa || 'Desconocida'} - Fecha de Vencimiento: ${fechaVigencia.toLocaleDateString()}`;
                advertenciasList.appendChild(item);
                vencidosCount++;  // Actualizamos el contador global
              }

              // Contar los técnicos cuyo curso está próximo a vencer (ej. 7 días)
              const sieteDias = new Date(today);
              sieteDias.setDate(today.getDate() + 30);
              if (fechaVigencia > today && fechaVigencia <= sieteDias) {
                const item = document.createElement('div');
                item.textContent = `Curso próximo a vencer: Técnico: ${tecnico.nombre || 'Desconocido'} - Empresa: ${curso.empresa || 'Desconocida'} - Fecha de Vencimiento: ${fechaVigencia.toLocaleDateString()}`;
                advertenciasList.appendChild(item);
                proximosAVencerCount++;  // Actualizamos el contador global
              }
            });
          }
        });

        // Mostrar el resumen
        const resumen = document.createElement('div');
        resumen.innerHTML = `
          <strong>Resumen:</strong><br>
          Cursos vencidos: ${vencidosCount}<br>
          Cursos próximos a vencer: ${proximosAVencerCount}
        `;
        advertenciasList.appendChild(resumen);

        // Mostrar el botón de enviar correo si hay advertencias
        if (vencidosCount > 0 || proximosAVencerCount > 0) {
          sendEmailBtn.style.display = 'block'; // Hacer visible el botón
          console.log('Advertencias detectadas, mostrando el botón de correo');
        } else {
          console.log('No se detectaron advertencias');
        }

      }, (error) => {
        console.error('Error al obtener los datos de Firebase:', error);
      });
    } catch (error) {
      console.error('Error en showAdvertencias:', error);
    }
  }

  // Llamar a las funciones
  loadCourses();
  showAdvertencias();

  // Listener para el botón de logout
  logoutBtn.addEventListener('click', () => {
    signOut(auth)
      .then(() => {
        window.location.href = 'login.html';
      })
      .catch((error) => {
        console.error('Error al cerrar sesión:', error);
      });
  });

  // Listener para el botón de enviar correo
  sendEmailBtn.addEventListener('click', () => {
    Advertencias();
    sendEmail(vencidosCount, proximosAVencerCount);
  });

  /**
   * Función para enviar correo
   */
  function sendEmail(vencidosCount, proximosAVencerCount) {
    console.log('Enviando correo...', vencidosCount, proximosAVencerCount);
    if (!emailjs) {
        console.error('EmailJS no está definido. Verifica que la librería esté cargada correctamente.');
        return;
    }

    if (!vencidosCount && !proximosAVencerCount) {
        console.warn('No hay cursos vencidos o próximos a vencer. No se enviará correo.');
        return;
    }

    const templateParams = {
        to_email: 'chernandez@purifika.com', // Cambia esto por la dirección de destino
        subject: '⚠️ Advertencia: Cursos vencidos y próximos a vencer',
        vencidosCount: vencidosCount || 0,  // Evita valores nulos
        proximosAVencerCount: proximosAVencerCount || 0
    };

    emailjs.send('service_6ljnyyn', 'template_a12hj8f', templateParams)
        .then((response) => {
            console.log('Correo enviado:', response);
        })
        .catch((error) => {
            console.error('Error al enviar el correo:', error);
        });
  }
});
