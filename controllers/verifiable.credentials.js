import { VerifiableCredential } from "@web5/credentials";
import { DidKeyMethod } from "@web5/dids";
import { Ed25519, Jose } from '@web5/crypto';

const didKey = await DidKeyMethod.create()






export const signTicketVerifiableCredential = async (did, customer_did, data) => {
  const privateKey = didKey.keySet.verificationMethodKeys[0].privateKeyJwk

  const vc = await new VerifiableCredential({
    type: "AiroveTicket",
    issuer: did,
    subject: customer_did,
    data: data
  })

  // 
  const signOptions = {
    issuerDid: did,
    subjectDid: customer_did,
    kid: `${did}#${did.split(':')[2]}`,
    signer: async (data) => await Ed25519.sign({ data, key: privateKey })
  };

  const vcJwt = await vc.sign(signOptions)
  return vcJwt


}