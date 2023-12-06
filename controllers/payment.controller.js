import axios from "axios"
const dotenv = require('dotenv')
dotenv.config()
import { nowPaymentUrl } from "../routes/utils/constants"

const addressRequestBody = async (amount) => body = {
  price_amount: amount,
  price_currency: "usd",
  pay_currency: "btc",
  ipn_callback_url: process.env.IPN_CALL_BACK

}

headers = {
  "x-api-key": `${process.env.NOW_PAY_APIKEY}`,
  "Content-Type": "application/json",

}

export const generatePaymentAddress = async (amount) => {
  const body = addressRequestBody(amount)
  let response;
  try {
    await axios.post(nowPaymentUrl, body, { headers }).then(res => {
      response = res
    })
    return response;

  } catch (error) {
    return error;

  }

}