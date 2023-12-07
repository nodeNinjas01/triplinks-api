import { defineNewProtocol } from '../index.js';
import { web5, did } from '../index.js';
import { generatePaymentAddress, nowPaymentWebhook } from './payment.controller.js';
import { signTicketVerifiableCredential } from './verifiable.credentials.js';
import fs from 'fs'
import { myArray } from '../data.js';
/**
 * @desc    Publish a new airline ticket
 * @route   GET /api/v1/publish-ticket
 * @access  Private
 */
export const publishTicket = async (req, res) => {

  const publishTicketProtocol = defineNewProtocol();
  try {
    const { record } = await web5.dwn.records.create({
      data: req.body,
      message: {
        protocol: publishTicketProtocol.protocol,
        protocolPath: 'publishedTickets',
        dataFormat: 'application/json',
        schema: publishTicketProtocol.types.publishedTickets.schema,
        published: true
      },
    });

    let readResult = await record.data.json();
    res.status(200).json({
      success: true,
      data: readResult,
    });
    console.log('Tickets published successfully');
  } catch (error) {
    console.log("Couldn't write record: " + error);
  }
};

/**
 * @desc    Update an airline ticket
 * @route   GET /api/v1/update-ticket
 * @access  Private
 */
export const updateTicket = async (req, res) => {
  const publishTicketProtocol = defineNewProtocol();
  try {
    const {
      leaving,
      arriving,
      departureDate,
      arrivalDate,
      buisinessPrice,
      economyPrice,
      firstClassPrice,
    } = req.body;

    const response = await web5.dwn.records.query({
      message: {
        filter: {
          recordId: req.params.recordId,
        },
      },
    });

    if (response.records && response.records.length > 0) {
      const record = response.records[0];
      const updateResult = await record.update({
        data: {
          leaving: leaving ? leaving : record.leaving,
          arriving: arriving ? arriving : record.arriving,
          departureDate: departureDate ? departureDate : record.departureDate,
          arrivalDate: arrivalDate ? arrivalDate : record.arrivalDate,
          buisinessPrice: buisinessPrice
            ? buisinessPrice
            : record.buisinessPrice,
          economyPrice: economyPrice ? economyPrice : record.economyPrice,
          firstClassPrice: firstClassPrice
            ? firstClassPrice
            : record.firstClassPrice,
        },
      });

      if (updateResult.status.code === 202) {
        console.log('Ticket updated successfully');
        let readResult = await record.data.json();
        res.status(200).json({
          success: true,
          data: readResult,
        });
      } else {
        console.error('Error updating ticket:', updateResult.status);
      }
    } else {
      console.error('No record found with the specified ID');
    }
  } catch (error) {
    console.log("Couldn't write record: " + error);
  }
};

/**
 * @desc    Get all airline tickets
 * @route   GET /api/get-tickets
 * @access  Public
 */

export const getTickets = async (req, res) => {
  try {
    const response = await web5.dwn.records.query({
      from: did,
      message: {
        filter: {
          protocol: 'https://airrove/tickets',
          //   schema: 'https://schema.org/travel-tickets',
        },
      },
    });

    let userTickets;
    if (response.status.code === 200) {
      userTickets = await Promise.all(
        response.records.map(async (record) => {
          const data = await record.data.json();
          return {
            ...data,
            recordId: record.id,
            did,
          };
        })
      );
    }
    res.status(201).json({
      success: true,
      userTickets,
    });
  } catch (error) {
    console.log(error);
  }
};

/**
 * @desc    Get a Single ticket
 * @route   GET /api/v1/getticket
 * @access  Public
 */
export const getOneTicket = async (req, res) => {
  try {
    const response = await web5.dwn.records.query({
      from: did,
      message: {
        filter: {
          protocol: 'https://airrove/tickets',
          recordId: req.params.id,
          // schema: 'https://schema.org/travel-tickets',
        },
      },
    });

    let userTickets;
    if (response.status.code === 200) {
      userTickets = await Promise.all(
        response.records.map(async (record) => {
          const data = await record.data.json();
          return {
            ...data,
            recordId: record.id,
            did,
          };
        })
      );
    }
    res.status(201).json({
      success: true,
      userTickets,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getTicketParam = async (req, res) => {
  try {
    const { leaving, arriving, departureDate, arrivalDate } = req.body;

    const response = await web5.dwn.records.query({
      from: did,
      message: {
        filter: {
          protocol: 'https://airrove/tickets',
          // recordId: req.params.id,
          // schema: 'https://schema.org/travel-tickets',
        },
      },
    });

    let userTickets;
    if (response.status.code === 200) {
      userTickets = await Promise.all(
        response.records.map(async (record) => {
          const data = await record.data.json();
          //  data.leaving.includes("Port-Harcourt")
          return {
            ...data,
            recordId: record.id,
            did,
          };
        })
      );

      const tickets = userTickets.filter((ticket) => {
        if (
          (ticket.leaving == leaving &&
            ticket.arriving == arriving) &&
          (ticket.departureDate == departureDate || ticket.departureDate != "")
          && (ticket.arrivalDate == arrivalDate || ticket.arrivalDate != "")
        ) {
          return ticket;
        }
      });

      res.status(201).json({
        success: true,
        tickets,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * @desc    Delete an airline ticket
 * @route   DELETE/api/delete-ticket
 * @access  Private
 */
export const deleteTicket = async (req, res) => {
  try {
    const response = await web5.dwn.records.query({
      message: {
        filter: {
          recordId: req.params.id,
        },
      },
    });

    if (response.records && response.records.length > 0) {
      const record = response.records[0];
      const deleteResult = await record.delete();

      if (deleteResult.status.code === 202) {
        console.log('Ticket deleted successfully');

        res.status(202).json({
          success: true,
          data: [],
        });
      } else {
        console.error('Error deleting message:', deleteResult.status);
      }
    } else {
      console.error('No record found with the specified ID');
    }
  } catch (error) {
    console.error('Error in deleteMessage:', error);
  }
};




export const generateWallet = async (req, res) => {
  try {
    const { price_amount, customer_did } = req.body;
    const response = await generatePaymentAddress(price_amount)
    //Prepare data that will be written to data.json
    const data = {
      customer_did: customer_did,
      wallet_address: response.pay_address,
      ticket_data: req.body
    }


    // Read the existing array from the file
    const filePath = 'data.js';
    // Modify the array (add a new item, for example)
    myArray.push(data);

    // Convert the modified array back to a JavaScript code string
    const arrayCode = `module.exports = ${JSON.stringify(myArray, null, 2)};`;

    // Write the updated array code back to the file
    fs.writeFile(filePath, arrayCode, 'utf-8', (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('Array has been updated in', filePath);
      }
    });


    return res.status(200).json({ 'status': 'success', 'wallet': response })

  } catch (error) {
    res.status(400).json({ 'status': 'failed', 'error': error })
  }

}
export const indexFuction = async (req, res) => {
  return await res.status(200).json({ "data": "Airove - API" })

}



export const nowPaymentWebhookFunction = async (req, res) => {
  const data = req.body
  const headers = req.headers
  // const { customer }
  try {
    const vc = await nowPaymentWebhook(data, headers, did)
    return res.status(200).json({ 'vc': vc })
  } catch (error) {
    res.status(200).json({ 'vc': 'error' })

  }

}