const User = require('../models/User');
const { Op } = require('sequelize');

class UserController {

    static async createUser(req, res) {
        try{
            // Obtener los datos del cuerpo de la post
            const request_body = req.body;

            // Crear el user en la base de datos
            const User = await User.create({
                user_id: request_body.user_id,
                email: request_body.email,
                password: request_body.password,
                name: request_body.name,
                lastname: request_body.lastname,
                phone: request_body.phone
            });

            // Enviar el response para confirmar la correcta creacion del usuario
            res.status(201).send(User)
        } catch (error) {
            console.error('Error al crear usuario:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async updateUser(req, res) {
        try{
            // Obtener los datos del cuerpo de la post
            const request_body = req.body;

            const updatedUser = await User.findByPk(request_body.user_id);

            if (!updatedUser) {
                throw new Error('Usuario no encontrado.');
            }

            updatedUser.user_id = request_body.user_id;
            updatedUser.email = request_body.email;
            updatedUser.password = request_body.password;
            updatedUser.name = request_body.name;
            updatedUser.lastname = request_body.lastname;
            updatedUser.phone = request_body.phone

            await updatedUser.save();
            res.send('Usuario actualizado exitosamente.')

        } catch(error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }

    }



}


module.exports = UserController;