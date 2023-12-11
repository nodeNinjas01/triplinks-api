import axios from "axios"
import { nowPaymentUrl } from "../utils/constants.js"
import dotenv from 'dotenv';
import CryptoJS from "crypto-js";
import { signTicketVerifiableCredential } from "./verifiable.credentials.js";
import { myArray } from "../data.js";

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
  // Convert the IPN secret key to a Buffer
  const secretKey = Buffer.from(process.env.IPN_SECRET_KEY, 'utf-8');

  // Sort the data dictionary by keys and convert to a JSON string
  const sortedData = JSON.stringify(data, Object.keys(data).sort(), 2);

  // Calculate the HMAC-SHA512 signature
  const hmac = CryptoJS.createHmac('sha512', secretKey);
  hmac.
    hmac.update(sortedData, 'utf-8');
  const signature = hmac.digest('hex');

  return signature;
}



// This nowPayment webhook receives data from nowpayment and compares the sigining key we have to what is coming from them
// If the sigining key are same, then we can go ahead with siginging a vc for the user

export const nowPaymentWebhook = async (data, headers, did) => {

  const sig = await generateSignature(data)

  // Check if the data.pay_adress is contained in myArray
  for (var obj in myArray) {
    if (obj.wallet_adress == data.pay_address) {
      if (JSON.stringify(headers)['X-Nowpayments-Sig'] == sig) {
        const vc = await signTicketVerifiableCredential(did, obj.customer_did, obj)
        return vc

      } else {
        return 'None'
      }

    }
  }

}
