import axios from "axios"
import { nowPaymentUrl } from "../utils/constants.js"
import dotenv from 'dotenv';
import crypto from 'crypto'
import { signTicketVerifiableCredential } from "./verifiable.credentials.js";
import { myArray } from "../data.js";
import { sendEmail } from "../utils/email_messaging.js";




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
const ipnSecret = process.env.IPN_SECRET_KEY;  // Replace with your actual IPN secret

export const generateSignature = (data) => {

  // Step 1: Convert the IPN secret key to a Buffer
  const secretKey = Buffer.from(ipnSecret, 'utf-8');

  // Step 2: Sort the data dictionary by keys and convert to a JSON string
  const sortedData = JSON.stringify(data, Object.keys(data).sort(), 2);

  // Step 3: Calculate the HMAC-SHA512 signature
  const hmac = crypto.createHmac('sha512', secretKey);
  hmac.update(sortedData, 'utf-8');
  const signature = hmac.digest('hex');
  return signature;
};



// This nowPayment webhook receives data from nowpayment and compares the sigining key we have to what is coming from them
// If the sigining key are same, then we can go ahead with siginging a vc for the user

export const nowPaymentWebhook = async (data, headers, did) => {
  console.log('webhook called');
  console.log(myArray.length);

  // const sig = await generateSignature(data)

  // Check if the data.pay_adress is contained in myArray

  for (const item of myArray) {
    if (item?.wallet_address == data?.pay_address) {
      console.log(myArray.length);
      if (JSON.stringify(headers['x-nowpayments-sig'])) {
        const vc = await signTicketVerifiableCredential(did, item?.customer_did, item)
        await sendEmail(item?.ticket_data?.email, vc)
        return vc

      } else {
        return 'None'
      }

    }

  }





}
