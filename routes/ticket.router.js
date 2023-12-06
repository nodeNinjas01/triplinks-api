import express from 'express';
const router = express.Router();

import {
    publishTicket,
    updateTicket,
    getTickets,
    getTicketParam,
    getOneTicket,
    deleteTicket,
    indexFuction
} from './ticket.controller.js';

router.post('/publish-ticket', publishTicket);
router.get('/get-tickets', getTickets);
router.get('/getticket/:id', getOneTicket);
router.put('/update-ticket/:id', updateTicket);
router.delete('/delete-ticket/:id', deleteTicket);
router.post('/get-ticket-param', getTicketParam);
router.get('', indexFuction)
router.get('/generate-wallet',)

export default router;