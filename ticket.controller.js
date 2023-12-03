import { defineNewProtocol } from './index.js';
import { web5, did } from './index.js';

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
 * @route   GET /api/v1/get-tickets
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
