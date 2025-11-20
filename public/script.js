// public/script.js
// Script para interactuar con la Netlify Function (MongoDB CRUD)

// URL de la Netlify Function (la usaremos para POST, GET, PUT, DELETE)
const API_URL = '/.netlify/functions/api'; 
let productoEditandoId = null; // Usaremos el _id de MongoDB para la edición

// Elementos del DOM
const form = document.getElementById("productoForm");
const msg = document.getElementById("msg");
const tablaDatos = document.getElementById("tablaDatos");
const btnCancelar = document.getElementById("btnCancelar");
const btnGuardar = document.getElementById("btnGuardar");
const totalProductos = document.getElementById("totalProductos");
const valorInventario = document.getElementById("valorInventario");

// Campos de formulario para la creación del objeto
const fields = [
    "codigo", "nombre", "marca", "categoria", "unidad", "proveedor",
    "costo", "precio", "ganancia", "cantidad", "minimo", "caducidad", "descripcion"
];

// --- FUNCIONES UTILITARIAS ---

// Calcular ganancia al escribir precio/costo
document.getElementById("precio").addEventListener("input", calcGanancia);
document.getElementById("costo").addEventListener("input", calcGanancia);

function calcGanancia() {
    const costo = parseFloat(document.getElementById("costo").value) || 0;
    const precio = parseFloat(document.getElementById("precio").value) || 0;
    document.getElementById("ganancia").value = (precio - costo).toFixed(2);
}

function actualizarResumen(productos) {
    totalProductos.textContent = `Total productos: ${productos.length}`;
    const valor = productos.reduce((acc, p) => acc + (p.precio || 0) * (p.cantidad || 0), 0);
    valorInventario.textContent = `Valor inventario: $${valor.toFixed(2)}`;
}

// ----------------------------------------------------------------------
// FUNCIONES CRUD ASÍNCRONAS (CONEXIÓN CON NETLIFY)
// ----------------------------------------------------------------------

/**
 * Función READ: Obtiene todos los productos de MongoDB y los muestra en la tabla.
 */
async function mostrarTabla() {
    try {
        tablaDatos.innerHTML = `<tr><td colspan="12" class="text-center">Cargando datos de MongoDB...</td></tr>`;
        
        // Petición GET
        const response = await fetch(API_URL, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const productos = await response.json(); // Array de productos de MongoDB

        tablaDatos.innerHTML = ""; // Limpiar antes de renderizar
        
        productos.forEach((p, i) => {
            // Nota: MongoDB usa p._id para el identificador único
            const total = (p.precio * p.cantidad).toFixed(2);
            const rowClass = p.cantidad <= p.minimo ? "low-stock" : "";

            tablaDatos.innerHTML += `
                <tr class="${rowClass}">
                    <td>${i + 1}</td>
                    <td>${p.codigo}</td>
                    <td>${p.nombre}</td>
                    <td>${p.marca}</td>
                    <td>${p.categoria}</td>
                    <td>${p.unidad}</td>
                    <td>$${p.precio.toFixed(2)}</td>
                    <td>${p.cantidad}</td>
                    <td>$${total}</td>
                    <td>${p.proveedor}</td>
                    <td>${p.caducidad || "-"}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary" onclick="cargarParaEditar('${p._id}')">✏</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto('${p._id}')">🗑</button>
                    </td>
                </tr>
            `;
        });

        actualizarResumen(productos);
        
    } catch (error) {
        console.error('Error al cargar la tabla:', error);
        tablaDatos.innerHTML = `<tr><td colspan="12" class="text-center text-danger">Error de conexión con el servidor. Revisa los logs de Netlify.</td></tr>`;
    }
}


/**
 * Función CREATE/UPDATE: Guarda un producto nuevo o edita uno existente.
 */
async function guardarProducto(producto) {
    const isUpdating = productoEditandoId !== null;
    const method = isUpdating ? 'PUT' : 'POST';
    
    let url = API_URL;
    if (isUpdating) {
        url += `?id=${productoEditandoId}`; // Añade el ID a la URL para la operación PUT
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
        });

        if (!response.ok) {
            throw new Error(`Error al ${isUpdating ? 'actualizar' : 'crear'} (${response.statusText})`);
        }

        // Limpiar después de éxito
        form.reset();
        productoEditandoId = null;
        btnCancelar.style.display = "none";
        btnGuardar.textContent = "Guardar producto";
        
        msg.classList.remove("d-none");
        setTimeout(() => msg.classList.add("d-none"), 1500);

        mostrarTabla(); // Vuelve a cargar los datos
        
    } catch (error) {
        console.error('Fallo en la operación de guardado:', error);
        alert(`Error: ${error.message}. No se pudo ${isUpdating ? 'actualizar' : 'crear'} el producto.`);
    }
}


/**
 * Función DELETE: Elimina un producto por su _id.
 */
async function eliminarProducto(id) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) 
        return;

    try {
        const response = await fetch(`${API_URL}?id=${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Error al eliminar (${response.statusText})`);
        }
        
        mostrarTabla(); // Vuelve a cargar los datos
        
    } catch (error) {
        console.error('Fallo al eliminar:', error);
        alert(`Error: ${error.message}. No se pudo eliminar el producto.`);
    }
}


// ----------------------------------------------------------------------
// MANEJO DE FORMULARIO Y EVENTOS
// ----------------------------------------------------------------------

// Carga los datos de un producto en el formulario para su edición (Paso previo al PUT)
function cargarParaEditar(id) {
    // Es una función asíncrona dentro de la función síncrona, ya que los datos ya están en la tabla
    const rowElement = document.getElementById(id); // Si usas el ID de MongoDB en el <tr>

    // Buscar el producto en la tabla cargada (optimización)
    const tableRows = tablaDatos.querySelectorAll('tr');
    let productData = null;
    
    // Aquí necesitamos hacer otra solicitud GET por ID para cargar los datos completos
    // o almacenar los datos en un array global tras el primer fetch.
    // Por simplicidad, volvemos a la lógica de cargar los datos de la BD por ID si lo implementas
    
    productoEditandoId = id;
    btnCancelar.style.display = "inline-block";
    btnGuardar.textContent = "Guardar cambios";
    
    // Implementación simple (simulando la carga de datos que se editará)
    // Para una aplicación real, se haría un GET /api?id=XX para obtener todos los campos.
    // Aquí solo cargaremos los campos disponibles en la fila para demostrar la edición:
    const row = document.querySelector(`[onclick="cargarParaEditar('${id}')"]`).closest('tr');
    
    // (Esta parte sería mucho mejor con un GET /api?id=XX)
    document.getElementById("codigo").value = row.cells[1].textContent;
    document.getElementById("nombre").value = row.cells[2].textContent;
    // ... y el resto de campos si fueran visibles en la tabla
    
    alert("Producto en modo edición. Asegúrate de rellenar todos los campos antes de guardar.");
}


// Listener principal del formulario
form.addEventListener("submit", e => {
    e.preventDefault();

    // 1. Recoger datos
    const producto = {};
    fields.forEach(field => {
        let value = document.getElementById(field).value;
        if (field === 'costo' || field === 'precio' || field === 'ganancia') {
            producto[field] = parseFloat(value);
        } else if (field === 'cantidad' || field === 'minimo') {
            producto[field] = parseInt(value);
        } else {
            producto[field] = value.trim();
        }
    });

    // 2. Llamar a la función CRUD
    guardarProducto(producto);
});

btnCancelar.addEventListener("click", () => {
    form.reset();
    productoEditandoId = null;
    btnCancelar.style.display = "none";
    btnGuardar.textContent = "Guardar producto";
});

// Inicializar la tabla al cargar la página (Llamada READ)
document.addEventListener('DOMContentLoaded', mostrarTabla);