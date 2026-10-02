import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import Login from './pages/Login'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Success from './pages/Success'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><Header /><Home /><Footer /></>} />
        <Route path="/products" element={<><Header /><Products /><Footer /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<><Header /><Cart /><Footer /></>} />
        <Route path="/checkout" element={<><Header /><Checkout /><Footer /></>} />
        <Route path="/success" element={<Success />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}