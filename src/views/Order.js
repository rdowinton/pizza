import React, {useState} from "react";
import {useAuth0, withAuthenticationRequired} from "@auth0/auth0-react";
import Loading from "../components/Loading";
import {Alert, Button, Col, Container, Row, Table} from "reactstrap";
import {placeOrder} from "../api/menu";
import loading from "../assets/loading.svg";

import './Order.css';

const renderPrice = price => '$' + price.toFixed(2);
const MenuItem = ({ name, description, price, handleAddItem, canOrder }) => (
  <tr>
    <td>{name}</td>
    <td>{description}</td>
    <td>{renderPrice(price)}</td>
    <td><Button color="primary" onClick={handleAddItem} disabled={!canOrder}>Add</Button></td>
  </tr>
);

const Menu = ({ items, handleAddItem, canOrder }) => (
  <Table>
    <tbody>
    {items.map((i) => <MenuItem key={i.name} handleAddItem={() => handleAddItem(i)} canOrder={canOrder} {...i}/>)}
    </tbody>
  </Table>
);

const calculateTotal = order => order.length > 0 && order.map(i => i.price).reduce((total, value) => total + value);
const OrderSummary = ({ order, handleRemoveItem, handlePlaceOrder, canOrder }) => (
  <div>
    <Table>
      <tbody>
      {order.map((i, idx) => (
        <tr key={idx}>
          <td>{i.name}</td>
          <td>{renderPrice(i.price)}</td>
          <td>
            <input className="remove-button" type="button" onClick={() => handleRemoveItem(idx)} value="&#10060;"/>
          </td>
        </tr>
      ))}
      <tr className="total">
        <td>Total</td>
        <td>{renderPrice(calculateTotal(order))}</td>
      </tr>
      </tbody>
    </Table>
    <div className="text-center">
      <Button color="primary" onClick={() => handlePlaceOrder(order)} canOrder={canOrder}>Place order</Button>
    </div>
  </div>
);

const menuItems = [
  { name: 'Margherita', description: 'Tomato, cheese, basil', price: 9.99 },
  { name: 'Pepperoni', description: 'Tomato, cheese, pepperoni', price: 11.99 },
  { name: 'Quattro Formaggi', description: 'Tomato, cheese, cheddar, feta, blue cheese', price: 12.99 },
  { name: 'Picante', description: 'Tomato, cheese, pepperoni, salami, jalapenos', price: 12.99 },
  { name: 'Veggie', description: 'Tomato, cheese, onion, peppers, mushroom', price: 10.99 },
]

export const OrderComponent = () => {
  const { user, getAccessTokenSilently } = useAuth0();

  const [message, setMessage] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [order, setOrder] = useState([]);

  const allowedToOrder = !!user.email_verified;

  const handleAddItem = menuItem => setOrder([...order, menuItem]);
  const handleRemoveItem = index => setOrder(order.filter((_, i) => i !== index));

  const handlePlaceOrder = async order => {
    setPlacingOrder(true);
    const token = await getAccessTokenSilently();
    placeOrder(order, token).then(response => {
      setOrder([]);
      setMessage({ type: 'success', message: 'Order placed!' });
    }).catch(() => setMessage({ type: 'danger', message: 'Failed to place order' }))
      .finally(() => setPlacingOrder(false));
  };

  return (
    <Container className="mb-5">
      {!allowedToOrder && (
        <Row>
          <Alert color="warning">You need to verify your email address before you can order.</Alert>
        </Row>
      )}
      {message != null && (
        <Row>
          <Alert color={message.type}>{message.message}</Alert>
        </Row>
      )}
      <Row>
        <Col className="menu" md={8}>
          <h2>Menu</h2>
          <br/>
          <Menu items={menuItems} handleAddItem={handleAddItem} canOrder={allowedToOrder}/>
        </Col>
        <Col className="your-order" md={4}>
          <h2>Your order</h2>
          <br/>
          {!placingOrder && (!Array.isArray(order) || order.length === 0) && (
            <span>Your order is empty.</span>
          )}
          {!placingOrder && Array.isArray(order) && order.length > 0 && (
            <OrderSummary
              order={order}
              handleRemoveItem={handleRemoveItem}
              handlePlaceOrder={handlePlaceOrder}
              canOrder={allowedToOrder}
            />
          )}
          {placingOrder && (
            <div className='placing-order'>
              <img src={loading} alt="Loading" />
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default withAuthenticationRequired(OrderComponent, {
  onRedirecting: () => <Loading />,
});