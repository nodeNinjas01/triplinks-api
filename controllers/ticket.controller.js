import { defineNewProtocol } from '../index.js';
import { web5, did } from '../index.js';
import { DidKeyMethod } from '@web5/dids';
import {
  generatePaymentAddress,
  nowPaymentWebhook,
} from './payment.controller.js';
import { signTicketVerifiableCredential } from './verifiable.credentials.js';
import fs from 'fs';
import { myArray } from '../data.js';
import ErrorResponse from '../utils/errorResponse.js';

const appDid = 'did:ion:EiDVI-n7FjNAr9pHWnqSIJe_i9QzNWo3dvXycWgEA_5jXg:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJkd24tc2lnIiwicHVibGljS2V5SndrIjp7ImNydiI6IkVkMjU1MTkiLCJrdHkiOiJPS1AiLCJ4Ijoicm5Qb1BRRG1RemowbDROd2Q0TEwtSzByQ0kwVml5ZnVsOVMzOFZkU1dyTSJ9LCJwdXJwb3NlcyI6WyJhdXRoZW50aWNhdGlvbiJdLCJ0eXBlIjoiSnNvbldlYktleTIwMjAifSx7ImlkIjoiZHduLWVuYyIsInB1YmxpY0tleUp3ayI6eyJjcnYiOiJzZWNwMjU2azEiLCJrdHkiOiJFQyIsIngiOiI1WlBUNE8wZXNNX0d2MVZSMTdUeHNuVzc2VlNNRk9hUXQ2UjB1UHJKQWRBIiwieSI6ImxLbDZsLWZLLUtHSXl1c0VXVkxGcTEzTmk0RjRlWWlvUm9VNEdGREtwdTQifSwicHVycG9zZXMiOlsia2V5QWdyZWVtZW50Il0sInR5cGUiOiJKc29uV2ViS2V5MjAyMCJ9XSwic2VydmljZXMiOlt7ImlkIjoiZHduIiwic2VydmljZUVuZHBvaW50Ijp7ImVuY3J5cHRpb25LZXlzIjpbIiNkd24tZW5jIl0sIm5vZGVzIjpbImh0dHBzOi8vZHduLnRiZGRldi5vcmcvZHduMSIsImh0dHBzOi8vZHduLnRiZGRldi5vcmcvZHduMyJdLCJzaWduaW5nS2V5cyI6WyIjZHduLXNpZyJdfSwidHlwZSI6IkRlY2VudHJhbGl6ZWRXZWJOb2RlIn1dfX1dLCJ1cGRhdGVDb21taXRtZW50IjoiRWlENlZ3T3dtRTg3Q21KU0tCTHV0MGVUWFpLajBaZ0h2a0VEa2Y5ekh3S191USJ9LCJzdWZmaXhEYXRhIjp7ImRlbHRhSGFzaCI6IkVpRG9tQTF2bVVmSk1fRGtsQkpNZ3dDakVkeTRud2VZZ1hRb1Via1Zhb0dYUEEiLCJyZWNvdmVyeUNvbW1pdG1lbnQiOiJFaUM0NjNzTWhwUFBjLWttU2Q1RjRTYU1maE4yYXhOX1VCczJwaHlIanhPS3ZBIn19';

/**
 * @desc    Publish a new airline ticket
 * @route   GET /api/v1/publish-ticket
 * @access  Private
 */
export const publishTicket = async (req, res, next) => {
  const publishTicketProtocol = defineNewProtocol();
  try {
    const {
      departureState,
      arrivalState,
      departureDate,
      businessPrice,
      economyPrice,
      firstClassPrice,
      airlineName,
      departureAirport,
      arrivalAirport
    } = req.body;
    const { record } = await web5.dwn.records.create({
      data: {
        departureState,
        arrivalState,
        airlineName,
        departureDate,
        businessPrice,
        economyPrice,
        firstClassPrice,
        departureAirport,
        arrivalAirport
      },
      message: {
        protocol: publishTicketProtocol.protocol,
        protocolPath: 'publishedTickets',
        dataFormat: 'application/json',
        schema: publishTicketProtocol.types.publishedTickets.schema,
        published: true,
      },
    });

    let readResult = await record.data.json();
    res.status(200).json({
      success: true,
      data: readResult,
    });
  } catch (error) {
    return next(new ErrorResponse("Couldn't write record: " + error, 400));
  }
};

/**
 * @desc    Update an airline ticket
 * @route   GET /api/v1/update-ticket
 * @access  Private
 */
export const updateTicket = async (req, res, next) => {
  const publishTicketProtocol = defineNewProtocol();
  try {
    const {
      departureState,
      arrivalState,
      departureDate,
      businessPrice,
      economyPrice,
      firstClassPrice,
      airlineName,
      departureAirport,
      arrivalAirport
    } = req.body;

    const response = await web5.dwn.records.query({
      message: {
        filter: {
          recordId: req.params.id,
        },
      },
    });

    if (response.records && response.records.length > 0) {
      const record = response.records[0];
      const updateResult = await record.update({
        data: {
          departureState: departureState ? departureState : record.departureState,
          arrivalState: arrivalState ? arrivalState : record.arrivalState,
          departureDate: departureDate ? departureDate : record.departureDate,
          businessPrice: businessPrice
            ? businessPrice
            : record.buisinessPrice,
          economyPrice: economyPrice ? economyPrice : record.economyPrice,
          firstClassPrice: firstClassPrice
            ? firstClassPrice
            : record.firstClassPrice,
          airlineName: airlineName ? airlineName : record.airlineName,
          departureAirport: departureAirport ? departureAirport : record.departureAirport,
          arrivalAirport: arrivalAirport ? arrivalAirport : record.arrivalAirport
        },
        // filter: {
        //   recordId: createdRecord.id
        // }
      });

      if (updateResult.status.code === 202) {
        let readResult = await record.data.json();
        res.status(200).json({
          success: true,
          data: readResult,
        });
      } else {
        return next(new ErrorResponse("Couldn't update record: " + error, 400));
      }
    } else {
      return next(
        new ErrorResponse('No record found with the specified ID' + error, 404)
      );
    }
  } catch (error) {
    return next(new ErrorResponse("Couldn't write record: " + error, 400));
  }
};

/**
 * @desc    Get all airline tickets
 * @route   GET /api/get-tickets
 * @access  Public
 */

export const getTickets = async (req, res, next) => {
  try {
    const response = await web5.dwn.records.query({
      from: did,
      message: {
        filter: {
          protocol: 'https://airrove/tickets',
          protocolPath: "publishedTickets"
          //   schema: 'https://schema.org/travel-tickets',
        },
      },
    });

    let userTickets;
    if (response.status.code === 200) {
      userTickets = await Promise.all(
        response.records.map(async (record) => {
          const data = await record.data.json();
          if (data) {
            return {
              ...data,
              recordId: record.id,
              did,
            };
          }
        })
      );
    }
    res.status(201).json({
      success: true,
      userTickets,
    });
  } catch (error) {
    return next(new ErrorResponse('Error occurred ' + error, 400));
  }
};

/**
 * @desc    Get a Single ticket
 * @route   GET /api/v1/getticket
 * @access  Public
 */
export const getOneTicket = async (req, res, next) => {
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
    return next(new ErrorResponse('An error occurred ' + error, 400));
  }
};

export const getTicketParam = async (req, res, next) => {
  try {
    const { leaving, goingto, departureDate } = req.body;

    const response = await web5.dwn.records.query({
      from: did,
      message: {
        filter: {
          protocol: 'https://airrove/tickets',
          protocolPath: 'publishedTickets',
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
          return {
            ...data,
            recordId: record.id,
            did,
          };
        })
      );

      const tickets = userTickets.filter((ticket) => {
        if (
          ticket.departureState.toLowerCase() === leaving.toLowerCase() &&
          ticket.arrivalState.toLowerCase() === goingto.toLowerCase() &&
          (ticket.departureDate == departureDate ||
            ticket.departureDate != '')
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
    return next(new ErrorResponse('An error occurred ' + error, 400));
  }
};

/**
 * @desc    Delete an airline ticket
 * @route   DELETE/api/delete-ticket
 * @access  Private
 */
export const deleteTicket = async (req, res, next) => {
  try {
    const response = await web5.dwn.records.query({
      message: {
        filter: {
          recordId: req.params.id,
        },
      },
    });

    if (response.records && response.records.length > 0) {
      // const record = response.records[0];
      // console.log(record);
      const deleteResult = await web5.dwn.records.delete({
        message: {
          recordId: req.params.id,
        },
      });

      if (deleteResult.status.code === 202) {
        res.status(202).json({
          success: true,
          data: [],
        });
      } else {
        return next(new ErrorResponse('Error deleting message: ' + error, 400));
      }
    } else {
      return next(new ErrorResponse('No record found with the specified ID', 404));
    }
  } catch (error) {
    return next(new ErrorResponse('Error in deleteMessage: ' + error, 500));
  }
};

export const generateWallet = async (req, res) => {
  try {
    const { price_amount, customer_did } = req.body;
    const response = await generatePaymentAddress(price_amount);
    //Prepare data that will be written to data.json

    if (response?.status) {
      const data = {
        customer_did: customer_did,
        wallet_address: response?.data?.pay_address,
        ticket_data: req.body,
      };

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

      return res.status(200).json({ status: 'success', wallet: response })

    } else {
      return res.status(400).json({ status: 'failed', error: 'wallet not generated' })
    }

  } catch (error) {
    res.status(400).json({ status: 'failed', error: error });
  }
};
export const indexFuction = async (req, res) => {
  return await res.status(200).json({ data: 'Airove - API' });
};

export const nowPaymentWebhookFunction = async (req, res) => {
  const data = req.body;
  const headers = req.headers;
  // const { customer }
  try {
    const vc = await nowPaymentWebhook(data, headers, did);
    return res.status(200).json({ vc: vc });
  } catch (error) {
    res.status(200).json({ vc: 'error' });
  }
};

/**
 * @desc    Publish a new airline ticket
 * @route   GET /api/v1/publish-ticket
 * @access  Private
 */
export const login = async (req, res, next) => {
  const { phoneNumber, passphrase } = req.body;

  try {
    const response = await web5.dwn.records.query({
      from: did,
      message: {
        filter: {
          protocol: 'https://airrove/tickets',
          protocolPath: 'userTickets',
        },
      },
    });
    // console.log(response);
    let user;
    let data;
    if (response.status.code === 200 && response.records.length > 0) {
      console.log(response.status.code);
      user = await Promise.all(
        response.records.map(async (record) => {
          data = await record.data.json();
          // console.log(record);
          if (data) {
            return {
              ...data,
              recordId: record.id,
              did,
            };
          }
        })
      );
      if (user) {
        if (
          user[0].phoneNumber !== phoneNumber ||
          user[0].passphrase !== passphrase
        ) {
          return next(new ErrorResponse('wrong phone number or pass phrase', 403));
        }
      }
    }

    if (!user) {
      const userDid = await DidKeyMethod.create();
      const userProtocol = defineNewProtocol();
      try {
        const { record, status } = await web5.dwn.records.create({
          data: {
            phoneNumber: phoneNumber,
            passphrase: passphrase,
            did: userDid.did,
          },
          message: {
            protocol: userProtocol.protocol,
            protocolPath: 'userTickets',
            dataFormat: 'application/json',
            schema: userProtocol.types.publishedTickets.schema,
            recipient: appDid,
          },
        });

        if (record) {
          const { status } = await record.send(appDid);
          console.log(status);
        }

        data = await record.data.json();
      } catch (error) {
        return next(new ErrorResponse("Couldn't write record: " + error, 400));
      }
    }

    res.status(201).json({
      success: true,
      user: user ? user[0].phoneNumber : data.phoneNumber,
      did: user ? user[0].did : data.did,
    });
  } catch (error) {
    return next(new ErrorResponse(error, 400));
  }
};
