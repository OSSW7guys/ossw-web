import './App.css';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import MainPage from './pages/MainPage';
import CheckPage from './pages/CheckPage';

const router = createBrowserRouter([
    {
      path: "/",
      element: <LandingPage/>,
      errorElement: <NotFoundPage/>,
      children:[
        {path: 'main', element: <MainPage/>},
        {path: 'check', element: <CheckPage/>}
      ]
    }
  ]);

function App() {
  return (
    <RouterProvider router={router}>
    </RouterProvider>
  )
}

export default App
