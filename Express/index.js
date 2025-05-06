import express from 'express'
import dotenv from 'dotenv'
import {readFile, writeFile} from 'fs/promises'
import { json } from 'stream/consumers'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000
app.use(express.json());
app.listen(port, () => {
    console.log(`Servidor levantado en puerto ${port}`)
})

let userData = [];
let productData = [];
let sellsData = [];

async function loadDatas() {
    try{
        const fileUserData = await readFile('./usuarios.json', 'utf-8')
        userData = JSON.parse(fileUserData)

        const fileProductData = await readFile('./productos.json', 'utf-8')
        productData = JSON.parse(fileProductData)
        
        const fileSellsData = await readFile('./ventas.json', 'utf-8')
        sellsData = JSON.parse(fileSellsData)

        return {userData, productData, sellsData};
    }catch(error){
        console.log('Error de carga en los archivos', error);
    }
}

loadDatas();

// CONSULTAR TODOS LOS USUARIOS //
app.get('/users/all', (req, res) => {
    res.status(200).json(userData)
})

// CONSULTAR TODAS LAS VENTAS //
app.get('/sales/all', (req, res) => {
    res.status(200).json(sellsData);
});

// CONSULTAR TODOS LOS PRODUCTOS //
app.get('/products/all', (req, res) => {
    res.status(200).json(productData);
});



// CREAR NUEVO USUARIO //
app.post('/users/add', async (req, res) => {
    const { id, firstName, lastName, position, salary } = req.body;
    if (!id || !firstName || !lastName || !position || !salary) {
        return res.status(400).json('Faltan datos obligatorios');
    }

    const exists = userData.find(u => u.id == id);
    if (exists) {
        return res.status(409).json('Ya existe un usuario con ese ID');
    }

    const nuevoUsuario = { id, firstName, lastName, position, salary };
    userData.push(nuevoUsuario);
    await writeFile('./usuarios.json', JSON.stringify(userData, null, 2));
    res.status(201).json('Usuario agregado correctamente');
});


// MODIFICAR DATOS DE UN USUARIO //
app.put('/users/salary/update/:userId', async (req, res) => {
    const user_id = req.params.userId
    const new_salary = req.body.salary

    try{
        const index = userData.findIndex(e => e.id == user_id)
        if(index != -1){
            userData[index].salary = new_salary
            await writeFile('./usuarios.json', JSON.stringify(userData))
            res.status(200).json('Salario actualizado!')
        }else{
            res.status(400).json('No se encontro al usuario')
        }
    }catch(error){
        res.send(500).json('ERROR AL ACTUALIZAR')
    }
})


// ELIMINAR A UN USUARIO //
app.delete('/users/delete/:userId', async (req, res) => {
    const user_id = req.params.userId;

    try {
        const ventas = JSON.parse(await readFile('./ventas.json', 'utf-8'));
        const ventasAsociadas = ventas.filter(v => v.userId == user_id);

        if (ventasAsociadas.length > 0) {
            return res.status(400).json('No se puede eliminar el usuario, tiene ventas asociadas');
        }

        const index = userData.findIndex(e => e.id == user_id);
        if (index != -1) {
            userData.splice(index, 1);
            await writeFile('./usuarios.json', JSON.stringify(userData, null, 2));
            res.status(200).json('Usuario eliminado!');
        } else {
            res.status(400).json('No se encontró al usuario');
        }
    } catch (error) {
        res.status(500).json('ERROR AL ELIMINAR USUARIO');
    }
});

// REGISTRAR NUEVA VENTA //

app.post('/sales/add', async (req, res) => {
    const { ventaId, usuarioId, productoId, cantidad, formaDePago } = req.body;

    if (!ventaId || !usuarioId || !productoId || !cantidad || !formaDePago) {
        return res.status(400).json('Faltan datos obligatorios');
    }

    const ventaExistente = sellsData.find(v => v.ventaId == ventaId);
    if (ventaExistente) {
        return res.status(409).json('Ya existe una venta con ese ID');
    }

    const usuario = userData.find(u => u.id == usuarioId);
    if (!usuario) {
        return res.status(404).json('Usuario no encontrado');
    }

    const producto = productData.find(p => p.id == productoId);
    if (!producto) {
        return res.status(404).json('Producto no encontrado');
    }

    if (cantidad <= 0) {
        return res.status(400).json('La cantidad debe ser mayor que 0');
    }

    const total = producto.precio * cantidad;

    const nuevaVenta = {
        ventaId,
        usuarioId,
        productoId,
        cantidad,
        total,
        fecha: new Date().toISOString().split('T')[0], // formato YYYY-MM-DD
        formaDePago
    };

    sellsData.push(nuevaVenta);
    await writeFile('./ventas.json', JSON.stringify(sellsData, null, 2));
    res.status(201).json('Venta registrada correctamente');
});
