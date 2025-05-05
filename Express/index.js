import express from 'express'
import dotenv from 'dotenv'
import {readFile, writeFile} from 'fs/promises'
import { json } from 'stream/consumers'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(express.json());
const file = await readFile('./data.json', 'utf-8')
const userData = JSON.parse(file)

app.listen(port, () => {
    console.log(`Servidor levantado en puerto ${port}`)
})

// -- SIN ARCHIVO JSON -- //

const objetos = [
    {name: 'Auto', color: 'Rojo'},
    {name: 'Arbol', color: 'Verde'},
    {name: 'Rio', color: 'Azul'},
    {name: 'Casa', color: 'Amarillo'}
]

// CONSULTAR COLOR DE OBJETOS //
app.get('/colorObjetos/:objetos', (req, res) => {
    const obj = req.params.objetos
    const result = objetos.find(e => e.name === obj)

    if(result){
        res.status(200).json(result)
    }else{
        res.status(400).json(`${obj} no encontrado`)
    }
})


// CONSULTAR COLOR DE OBJETOS //
app.post('/colorObjetosPOST', (req, res) => {
    console.log(req.headers.apikey)
    const obj = req.body.objeto
    const result = objetos.find(e => e.name === obj)

    if(result){
        res.status(200).json(result)
    }else{
        res.status(400).json(`${obj} no encontrado`)
    }
})
// --------------------------------------------------------------------- //



// -- CON ARCHIVO JSON -- //



// CONSULTAR TODOS LOS USUARIOS //
app.get('/users/all', (req, res) => {
    res.status(200).json(userData)
})


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
    await writeFile('./data.json', JSON.stringify(userData, null, 2));
    res.status(201).json('Usuario agregado correctamente');
});


// MODIFICAR DATOS DE UN USUARIO //
app.put('/users/salary/update/:userId', (req, res) => {
    const user_id = req.params.userId
    const new_salary = req.body.salary

    try{
        const index = userData.findIndex(e => e.id == user_id)
        if(index != -1){
            userData[index].salary = new_salary
            writeFile('./data.json', JSON.stringify(userData))
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
            await writeFile('./data.json', JSON.stringify(userData, null, 2));
            res.status(200).json('Usuario eliminado!');
        } else {
            res.status(400).json('No se encontró al usuario');
        }
    } catch (error) {
        res.status(500).json('ERROR AL ELIMINAR USUARIO');
    }
});