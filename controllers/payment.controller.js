import axios from "axios"
import { nowPaymentUrl } from "../utils/constants.js"
import dotenv from 'dotenv';

import { signTicketVerifiableCredential } from "./verifiable.credentials.js";
import { myArray } from "../data.js";

const crypto = require('crypto')

dotenv.config();


const addressRequestBody = (amount) => {
  return {
    price_amount: amount,
    price_currency: "usd",
    pay_currency: "btc",
    ipn_callback_url: process.env.IPN_CALL_BACK

  }
}

const headers = {
  "x-api-key": `${process.env.NOW_PAY_APIKEY}`,
  "Content-Type": "application/json",

}

export const generatePaymentAddress = async (amount) => {
  const body = addressRequestBody(amount)
  try {
    const res = await axios.post(nowPaymentUrl, JSON.stringify(body), { headers });
    console.log(res.data);
    if (res.status == 201) {
      return {
        status: true,
        data: res.data
      }

    } else {
      return { 'status': false };
    }

  } catch (error) {
    console.log(error, 'ERRORRRR')
    return { 'status': false };

  }

}




//For Verifying webhooks
export const generateSignature = async (data) => {
  const hmac = crypto.createHmac('sha512', process.env.IPN_SECRET_KEY);
  hmac.update(JSON.stringify(data, Object.keys(data).sort()));
  const signature = hmac.digest('hex');
  return signature;

}



// This nowPayment webhook receives data from nowpayment and compares the sigining key we have to what is coming from them
// If the sigining key are same, then we can go ahead with siginging a vc for the user

export const nowPaymentWebhook = async (data, headers, did) => {
  console.log("Callled nowPayment webhook");
  console.log(data, headers, 'DATA');

  const sig = await generateSignature(data)
  console.log(sig, 'SIGNING KEY');
  console.log(headers, 'HEASERS KEY');

  // Check if the data.pay_adress is contained in myArray
  for (var obj in myArray) {
    if (obj.wallet_adress == data.pay_address) {
      console.log('gOT HEREE');

      if (JSON.stringify(headers)['x-nowpayments-sig'] == sig) {
        const vc = await signTicketVerifiableCredential(did, obj.customer_did, obj)
        console.log(vc, 'THis is vc');
        return vc

      } else {
        return 'None'
      }

    }
  }

}
