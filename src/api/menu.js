import axios from './axios';
export const placeOrder = (order, token) => axios.post('/orders', { order }, {
  headers: { 'Authorization': 'Bearer ' + token }
});

export default { placeOrder };