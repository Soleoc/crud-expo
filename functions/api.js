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

   
 client = new MongoClient(MONGODB_URI); 
    
    await client.connect(); 
    return client;
};


exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false; 

    try {
        const connection = await connectToDatabase();
        const db = connection.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        let response = {};
        
        // El ID del documento se espera en los query parameters para UPDATE y DELETE
        const itemId = event.queryStringParameters ? event.queryStringParameters.id : null;
        
        switch (event.httpMethod) {
            
            // ----------------------------------------------------
            // CREATE (POST): Crear un nuevo producto
            // ----------------------------------------------------
            case 'POST':
                const newProductData = JSON.parse(event.body);
                // MongoDB creará automáticamente el campo _id
                const insertResult = await collection.insertOne(newProductData);

                response = {
                    statusCode: 201, // Creado
                    body: JSON.stringify({ message: "Producto creado", id: insertResult.insertedId }),
                    headers: { 'Content-Type': 'application/json' }
                };
                break;
                
            // ----------------------------------------------------
            // READ (GET): Leer todos los productos
            // ----------------------------------------------------
            case 'GET':
                const items = await collection.find({}).toArray();
                response = {
                    statusCode: 200, // OK
                    body: JSON.stringify(items),
                    headers: { 'Content-Type': 'application/json' }
                };
                break;

            // ----------------------------------------------------
            // UPDATE (PUT): Actualizar un producto existente
            // ----------------------------------------------------
            case 'PUT':
                if (!itemId) {
                    return { statusCode: 400, body: JSON.stringify({ error: "Falta el ID para actualizar." }) };
                }
                const updateData = JSON.parse(event.body);
                
                // 🛑 Usamos ObjectId para buscar por el _id de MongoDB
                const updateResult = await collection.updateOne(
                    { _id: new ObjectId(itemId) }, 
                    { $set: updateData }
                );

                response = {
                    statusCode: 200, // OK
                    body: JSON.stringify({ 
                        message: "Producto actualizado", 
                        modifiedCount: updateResult.modifiedCount 
                    }),
                    headers: { 'Content-Type': 'application/json' }
                };
                break;

            // ----------------------------------------------------
            // DELETE (DELETE): Eliminar un producto
            // ----------------------------------------------------
            case 'DELETE':
                if (!itemId) {
                    return { statusCode: 400, body: JSON.stringify({ error: "Falta el ID para eliminar." }) };
                }

                // 🛑 Usamos ObjectId para buscar por el _id de MongoDB
                const deleteResult = await collection.deleteOne({ _id: new ObjectId(itemId) });

                response = {
                    statusCode: 200, // OK
                    body: JSON.stringify({ 
                        message: "Producto eliminado", 
                        deletedCount: deleteResult.deletedCount 
                    }),
                    headers: { 'Content-Type': 'application/json' }
                };
                break;

            default:
                response = { statusCode: 405, body: 'Método no permitido' };
        }

        return response;

    } catch (error) {
        console.error("Error al procesar la solicitud:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error del servidor: ' + error.message })
        };
    }
};