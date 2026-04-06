import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useRef, useState } from 'react';
import PaymentForm from '../PaymentForm';
import { baseURL } from "./../../common/Constant";
import './PaymentElement.CSS';
import superAgent from 'superagent';

// API Secret key
const { REACT_APP_STRIPE_API_KEY } = process.env;

/**
 * PaymentElement Component
 * @returns 
 */
const PaymentElement = () => {
      const hasAPICalledRef = useRef(false);
      const [piClientSecret, setPiClientSecret] = useState('');

      /**
       * 副作用フック
       */
      const paymentIntent = () => {
            superAgent
                  .get(`${baseURL}/api/create-payment-intent`)
                  .end(async (err, res) => {
                        if (err) {
                              console.log("AwalletToken発行用API呼び出し中に失敗", err);
                              // popUpメソッドの呼び出し
                              return err;
                        }
                        console.log('res', res);


                  });
      }
      useEffect(() => {
            if (hasAPICalledRef.current) return

            hasAPICalledRef.current = true;
            console.log('paymentelem', `${baseURL}/api/create-payment-intent`)
            paymentIntent()
            // fetch(`${baseURL}/api/create-payment-intent`)
            //     .then(data => {
            //          console.log('DATA',data.json())
            //          data.json()
            //      })
            //      .then(response => {
            //          console.log('response',response)
            //          setPiClientSecret(response.clientSecret)
            //       })
      }, [])

      if (!piClientSecret) return null;

      return (
            <Elements
                  stripe={loadStripe(REACT_APP_STRIPE_API_KEY)}
                  options={{
                        clientSecret: piClientSecret,
                  }}
            >
                  <PaymentForm />
            </Elements>
      )
};

export default PaymentElement;