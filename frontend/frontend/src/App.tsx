import './App.css';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import MainPage from './pages/MainPage';
import CheckPage from './pages/CheckPage';
import Layout from './layouts/layout';

const router = createBrowserRouter([
    {
      path: "/",
      element: <LandingPage/>,
      errorElement: <NotFoundPage/>,
    },
    {
      path: "/main",
      element: <Layout><MainPage/></Layout>,
      errorElement: <NotFoundPage/>,
    },
    {
      path: "/check",
      element: <Layout><CheckPage/></Layout>,
      errorElement: <NotFoundPage/>,
    }
  ]);

function App() {
  return (
    <RouterProvider router={router}>
    </RouterProvider>
  )
}

export default App
