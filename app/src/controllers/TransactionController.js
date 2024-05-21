const InfoCompras = require('../models/InfoCompras');
const Flight = require('../models/Flight');
require('dotenv').config();

class InfoComprasController {
    static async createInfoCompras(req, res) => {
        try {
            const { ticketId, quantity } = req.body;
            const ticket = await InfoCompras.findUnique({
            where: {
                id: ticketId,
            }
            });
            if (!ticket) {
            res.status(404).json({
                message: "Ticket no encontrado"
            });
            return;
            }
            const amount = ticket.price * Number(quantity);
            const newTrx = await db.transaction.create({
            data: {
                ticket: {
                connect: {
                    id: ticketId,
                }
                },
                quantity,
                amount,
                status: "pending"
            }
            });
            const trx = await tx.create(newTrx.id, "test-iic2173", amount, process.env?.REDIRECT_URL || "http://localhost:8000");
            await db.transaction.update({
            where: {
                id: newTrx.id
            },
            data: {
                token: trx.token,
            }
            });
            res.status(201).json(trx);
        } catch (e) {
            console.error(e);
            res.status(500).send(e);
        }
    }
}
    
    trxRouter.post('/commit', async (req, res) => {
  const { ws_token } = req.body;
  if (!ws_token || ws_token === "") {
      res.status(200).json({
          message: "Transaccion anulada por el usuario"
        });
    return;
}
const confirmedTx = await tx.commit(ws_token);

if (confirmedTx.response_code !== 0) {
    const trx = await db.transaction.update({
        where: {
            token: ws_token
        },
        data: {
            status: "rejected"
        },
        select: {
            ticket: {
                select: {
                    name: true,
                    type: true,
          }
        },
        quantity: true,
        amount: true
      }
    });
    res.status(200).json({
      message: "Transaccion ha sido rechazada",
      ticket: trx.ticket,
      quantity: trx.quantity
    });
    return;
  }
  const trx = await db.transaction.update({
    where: {
      token: ws_token
    },
    data: {
      status: "completed"
    }, 
    select: {
      ticket: {
        select: {
          name: true,
          type: true,
        }
      },
      quantity: true,
      amount: true
    }
  });

  res.status(200).json({
    message: "Transaccion ha sido aceptada",
    ticket: trx.ticket,
    quantity: trx.quantity
  });
});

};
