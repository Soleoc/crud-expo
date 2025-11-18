const { MongoClient } = require('mongodb');
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "CRUD-EXPO";     // 1.
const COLLECTION_NAME = "CRUD-1";  // 2.

let client = null; // 3. Caching de conexión

const connectToDatabase = async () => {
    // 4. Chequeo de conexión Caching: ¿Existe ya la conexión activa?
    if (client && client.isConnected && client.isConnected()) {
        return client;
    }

    // 5. Crear la conexión: Instanciar MongoClient
    client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    // 6. Esperar la conexión: await y Promesa
    await client.connect();
    return client;
};

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false; // 7. Serverless Optimization

    try {
        const connection = await connectToDatabase(); // 8. Iniciar/Reusar conexión
        const db = connection.db(DB_NAME); // 9. Seleccionar BD
        const collection = db.collection(COLLECTION_NAME); // 10. Seleccionar Colección

        let response = {};

        if (event.httpMethod === 'GET') { // 11. Manejo de Método HTTP (READ)

            // 12. Consulta a MongoDB: Buscar todos los documentos
            const items = await collection.find({}).toArray();

            // 13. Formato de Respuesta de Éxito
            response = {
                statusCode: 200, // 14. Código HTTP 200 (OK)
                body: JSON.stringify(items), // 15. Serializar Objeto a JSON
                headers: { 'Content-Type': 'application/json' }
            };
        } else {
            response = { statusCode: 405, body: 'Método no permitido' }; // 16. Fallo
        }

        return response; // 17. Devolver respuesta a Netlify

    } catch (error) {
        console.error("Error al procesar la solicitud:", error);
        return {
            statusCode: 500, // 18. Código HTTP 500 (Error de Servidor)
            body: JSON.stringify({ error: error.message })
        };
    }
};