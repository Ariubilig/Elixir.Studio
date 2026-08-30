import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { ComponentType } from 'react';

import Preloader from './components/ux/preloader/Preloader';
import { useAwayTitle } from './hooks/usePageVisibility';
import MainPageComponent from './pages/MainPage';

const MainPage = MainPageComponent as ComponentType<{ ready: boolean }>;


function App() {

  const [preloaderDone, setPreloaderDone] = useState(false);
  const [preloaderHidden, setPreloaderHidden] = useState(false);
  useAwayTitle({ home: 'Elixir.Studio', label: 'Oh' });


  return (
    <>

      <Routes>
        <Route path="/" element={<MainPage ready={preloaderDone} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

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

