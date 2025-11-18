const { MongoClient } = require('mongodb');
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "CRUD-EXPO";     // 1.
const COLLECTION_NAME = "CRUD-1";  // 2.

let client = null; // 3. Caching de conexi�n

const connectToDatabase = async () => {
    if (client && client.isConnected && client.isConnected()) {
        return client;
    }
    
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI no está definida. Configúrala en Netlify.');
    }

    // 🛑 ¡CAMBIO AQUÍ! Elimina el objeto de opciones.
    // Antes: client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    client = new MongoClient(MONGODB_URI); 
    
    await client.connect(); 
    return client;
};

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false; // 7. Serverless Optimization

    try {
        const connection = await connectToDatabase(); // 8. Iniciar/Reusar conexi�n
        const db = connection.db(DB_NAME); // 9. Seleccionar BD
        const collection = db.collection(COLLECTION_NAME); // 10. Seleccionar Colecci�n

        let response = {};

        if (event.httpMethod === 'GET') { // 11. Manejo de M�todo HTTP (READ)

            // 12. Consulta a MongoDB: Buscar todos los documentos
            const items = await collection.find({}).toArray();

            // 13. Formato de Respuesta de �xito
            response = {
                statusCode: 200, // 14. C�digo HTTP 200 (OK)
                body: JSON.stringify(items), // 15. Serializar Objeto a JSON
                headers: { 'Content-Type': 'application/json' }
            };
        } else {
            response = { statusCode: 405, body: 'M�todo no permitido' }; // 16. Fallo
        }

        return response; // 17. Devolver respuesta a Netlify

    } catch (error) {
        console.error("Error al procesar la solicitud:", error);
        return {
            statusCode: 500, // 18. C�digo HTTP 500 (Error de Servidor)
            body: JSON.stringify({ error: error.message })
        };
    }
};