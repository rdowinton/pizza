import _axios from 'axios';

const axios = _axios.create({
  baseURL: 'https://api.pizza.auth.yoga/'
});
export default axios;