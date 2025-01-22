// Importar la base de datos y el almacenamiento desde app.js
import { db, storage } from './app.js';
import { ref as dbRef, push, set } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
  // Obtener los elementos del formulario
  const form = document.getElementById('add-course-form');
  const empresaInput = document.getElementById('empresa');
  const sucursalInput = document.getElementById('sucursal');
  const direccionInput = document.getElementById('direccion');
  const contactoInput = document.getElementById('contacto');
  const telefonoInput = document.getElementById('telefono');
  const extensionInput = document.getElementById('extension');
  const correoInput = document.getElementById('correo');
  const celularInput = document.getElementById('celular');
  const diasInput = document.getElementById('dias');
  const horaInput = document.getElementById('hora');
  const duracionInput = document.getElementById('duracion');
  const papeleriaInput = document.getElementById('papeleria');
  const equipoSeguridadInput = document.getElementById('equipoSeguridad');
  const documentosInput = document.getElementById('documentos'); // Campo para múltiples documentos
  const backBtn = document.getElementById('back-btn');
  const submitBtn = document.getElementById('submit-btn');
  const loadingIndicator = document.getElementById('loading-indicator');

  // Validar formulario obligatorio
  function validateForm() {
    return empresaInput.value && sucursalInput.value && direccionInput.value &&
      contactoInput.value && telefonoInput.value && correoInput.value &&
      celularInput.value && horaInput.value && duracionInput.value;
  }

  // Validar archivos antes de subirlos
  function validateFiles(files) {
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const maxSize = 5 * 1024 * 1024; // Limitar a 5MB por archivo

    for (let file of files) {
      if (!validTypes.includes(file.type)) {
        alert(`El archivo ${file.name} no es válido. Solo se permiten PDF, imágenes, Word y Excel.`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`El archivo ${file.name} excede el tamaño permitido (5MB).`);
        return false;
      }
    }
    return true;
  }

  // Subir múltiples documentos a Firebase Storage y devolver URLs
  async function uploadDocuments(files, courseId) {
    const uploadedFiles = [];

    for (const file of files) {
      const filePath = `courses/${courseId}/documents/${file.name}`;
      const fileRef = storageRef(storage, filePath);
      try {
        await uploadBytes(fileRef, file);
        const fileURL = await getDownloadURL(fileRef);
        uploadedFiles.push({ name: file.name, url: fileURL });
      } catch (error) {
        console.error('Error al subir archivo:', file.name, error);
        alert(`Error al subir el archivo ${file.name}: ${error.message}`);
      }
    }

    return uploadedFiles;
  }

  // Evento al enviar el formulario
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Validar los campos
    if (!validateForm()) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }

    // Validar los archivos si se seleccionan
    if (documentosInput.files.length > 0 && !validateFiles(documentosInput.files)) {
      return; // Si los archivos no son válidos, no continuar
    }

    // Mostrar indicador de carga
    loadingIndicator.style.display = 'block';
    submitBtn.disabled = true;

    try {
      // Recopilar datos del formulario
      const empresa = empresaInput.value;
      const sucursal = sucursalInput.value;
      const direccion = direccionInput.value;
      const contacto = contactoInput.value;
      const telefono = telefonoInput.value;
      const extension = extensionInput.value;
      const correo = correoInput.value;
      const celular = celularInput.value;
      const dias = Array.from(diasInput.selectedOptions).map(option => option.value);
      const hora = horaInput.value;
      const duracion = duracionInput.value;
      const papeleria = papeleriaInput.value.split('\n');
      const equipoSeguridad = Array.from(equipoSeguridadInput.selectedOptions).map(option => option.value);

      // Crear un objeto con los datos del curso
      const newCourse = {
        empresa,
        sucursal,
        direccion,
        contacto,
        telefono,
        extension,
        correo,
        celular,
        dias,
        hora,
        duracion,
        papeleria,
        equipoSeguridad,
        documentos: [] // Inicialmente vacío
      };

      // Referencia para guardar el curso
      const courseRef = dbRef(db, 'cursos');
      const newCourseRef = push(courseRef);
      const courseId = newCourseRef.key; // Obtener UID generado

      // Subir documentos si existen
      let uploadedDocuments = [];
      if (documentosInput.files.length > 0) {
        uploadedDocuments = await uploadDocuments(documentosInput.files, courseId);
      }

      // Agregar URLs de los documentos al curso
      newCourse.documentos = uploadedDocuments;

      // Guardar datos del curso en la base de datos
      await set(newCourseRef, newCourse);

      alert('Curso agregado correctamente');
      form.reset();
    } catch (error) {
      console.error('Error al agregar el curso: ', error);
      alert('Hubo un error al agregar el curso: ' + error.message);
    } finally {
      // Ocultar el indicador de carga y habilitar el botón
      loadingIndicator.style.display = 'none';
      submitBtn.disabled = false;
    }
  });

  // Regresar a la página anterior
  backBtn.addEventListener('click', () => {
    window.history.back();
  });
});
