import './App.css'

import { useState, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { ComponentType } from 'react';

import Preloader from './components/ux/preloader/Preloader';
import useScrollSmoother from './hooks/useScrollSmoother';
import { useAwayTitle } from './hooks/usePageVisibility';
import MainPageComponent from './pages/MainPage';

const MainPage = MainPageComponent as ComponentType<{ ready: boolean }>;


function App() {


  const [preloaderDone, setPreloaderDone] = useState(false);
  const [preloaderHidden, setPreloaderHidden] = useState(false);
  const wrapperRef = useRef(null);
  useScrollSmoother(wrapperRef, { enabled: true });
  useAwayTitle({ home: 'Elixir.Studio', label: 'Oh' });


  return (
    <>

      <div id="smooth-wrapper" ref={wrapperRef}>
        <div id="smooth-content">


          <Routes>
            <Route path="/" element={<MainPage ready={preloaderDone} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>


        </div>
      </div>

      {!preloaderHidden && (
        <Preloader
          onFinish={() => setPreloaderDone(true)}
          exiting={preloaderDone}
          onExited={() => setPreloaderHidden(true)}
        />
      )}

    </>
  );
}


export default App;
