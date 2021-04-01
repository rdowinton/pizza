import axios from './axios';
export const getMenuItems = () => axios.get('/menu');
export const placeOrder = (order, token) => axios.post('/orders', order, {
  headers: { 'Authorization': 'Bearer ' + token }
});

export default { getMenuItems, placeOrder  };