const itemsList = document.getElementById('items-list');
const API_URL = '/.netlify/functions/api'; // 1. Ruta de la Función

async function fetchAndRenderItems() { // 2. Función asíncrona
    try {
        const response = await fetch(API_URL, { method: 'GET' }); // 3. Petición GET

        if (!response.ok) { // 4. Chequeo de Estado HTTP
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const items = await response.json(); // 5. Parseado del JSON

        itemsList.innerHTML = ''; // 6. Limpiar lista

        items.forEach(item => { // 7. Recorrer y Renderizar
            const listItem = document.createElement('li');
            listItem.textContent = `${item.name} (ID: ${item._id})`;
            itemsList.appendChild(listItem);
        });

    } catch (error) { // 8. Manejo de Errores
        console.error('Error al cargar los elementos:', error);
        itemsList.innerHTML = `<li>Error de conexión: ${error.message}</li>`;
    }
}

document.addEventListener('DOMContentLoaded', fetchAndRenderItems); // 9. Ejecución Inicial