import express from 'express';
import bodyParser from 'body-parser';
import { Web5 } from '@web5/api';

/*
Needs globalThis.crypto polyfill. 
This is *not* the crypto you're thinking of.
It's the original crypto...CRYPTOGRAPHY.
*/
import { webcrypto } from 'node:crypto';
import { read } from 'node:fs';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;
// const { web5, did: lizzyDid } = await Web5.connect();


const { web5, did: lizzyDid } = await Web5.connect();


// console.log(connection);

// const publicKey =  await connection.web5.agent.didManager._agent.keyManager._defaultSigningKey.publicKey.did;
// console.log(publicKey);

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


  // console.log('this is where we install local protocol')
const installLocalProtocol = async (web5, protocolDefinition) => {
    return await web5.dwn.protocols.configure({
      message: {
        definition: protocolDefinition,
      },
    });
  };

//  console.log('this is where we install remote protocol')
const installRemoteProtocol = async (web5, did, protocolDefinition) => {
  const { protocol } = await web5.dwn.protocols.configure({
    message: {
      definition: protocolDefinition,
    },
  });
  return await protocol.send(did);
};

const defineNewProtocol = () => {
  return {
    protocol: 'https://dwn.tbddev.org/dwn3',
    published: true,
    types: {
      publishedTickets: {
        schema: 'https://schema.org/travel',
        dataFormats: ['application/json'],
      },
      userTickets: {
        schema: 'https://schema.org/userTickets',
        dataFormats: ['application/json'],
      },
    },
    structure: {
      publishedTickets: {
        $actions: [
          { who: 'anyone', can: 'read' },
          { who: 'author', of: 'publishedTickets', can: 'write' },
        ],
      },
      userTickets: {
        $actions: [
          { who: 'author', of: 'userTickets', can: 'read' },
          { who: 'anyone', can: 'write' },
        ],
      },
    },
  };
};

const configureProtocol = async (web5, did) => {
  const protocolDefinition = defineNewProtocol();
  const protocolUrl = protocolDefinition.protocol;

  const { protocols: localProtocols, status: localProtocolStatus } =
    await queryLocalProtocol(web5, protocolUrl);
  if (localProtocolStatus.code !== 200 || localProtocols.length === 0) {
    const result = await installLocalProtocol(web5, protocolDefinition);
    console.log({ result });
    console.log('Protocol installed locally');
  }

  const { protocols: remoteProtocols, status: remoteProtocolStatus } =
    await queryRemoteProtocol(web5, did, protocolUrl);
  if (remoteProtocolStatus.code !== 200 || remoteProtocols.length === 0) {
    const result = await installRemoteProtocol(web5, did, protocolDefinition);
    console.log({ result });
    console.log('Protocol installed remotely');
  }
};

const testData = {
    date: '2024',
    did: lizzyDid,
    airline: 'Jamil-airline',
    seatnumber: 'a-5',
    amount: '20',
    amount_in_btc: '0.006',
    payer_address: '0x9994949494949'
  }

app.post('/publish-ticket', async (req, res) => {
//   const { from } = req.body;
// console.log(req.body);

  const publishTicketProtocol = defineNewProtocol();
  try {
    const { record } = await web5.dwn.records.create({
      data: testData,

      message: {
        protocol: publishTicketProtocol.protocol,
        protocolPath: 'publishedTickets',
        dataFormat: 'application/json',
        // schema: publishTicketProtocol.types.publishedTickets.schema,
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
});

app.get('/get-tickets', async (req, res) => {
  try {
    const response = await web5.dwn.records.query({
      from: lizzyDid,
      message: {
        filter: {
          protocol: 'https://dwn.tbddev.org/dwn3',
        //   schema: 'https://example.com/directMessageSchema',
        },
      },
    });
    res.status(200).json({
        response
    })
  } catch (error) {
    console.log(error);
  }
});

// const updateResult = await record.update({
//   data: 'We are in the web5',
// });

// const deleteResult = await record.delete();

// const readResult = await record.data.text();
// console.log(readResult);

const PORT = 5000
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  });

  //Handle unhandled rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1).red);
  });
